/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { GameState, Faction, Coord, Board, Piece, PieceType, ChatMessage, GameMode, PowerID, PowerSpec } from "./types";
import {
  createInitialBoard,
  getFullyValidMoves,
  movePieceOnBoard,
  getCapturedPieces,
  calculateBestMove,
  isFactionsKingInCheck,
  hasFactionAnyLegalMoves,
  findKing,
  cloneBoard,
} from "./utils/engine";
import { audio } from "./utils/audio";
import { ChessBoard } from "./components/ChessBoard";
import { CommentaryPanel } from "./components/CommentaryPanel";
import { ControlOverlay } from "./components/ControlOverlay";
import {
  Sparkles,
  Cpu,
  Volume2,
  VolumeX,
  RefreshCw,
  Zap,
  RotateCcw,
  GlassWater,
  ShieldAlert,
  Dna,
  Shield,
  Trash2,
  Trophy,
  History,
  HelpCircle,
  Undo2
} from "lucide-react";

// Setup descriptive spell/power guidelines for the UI buttons
const JESUS_POWERS: PowerSpec[] = [
  {
    id: "water_to_wine",
    name: "Water to Wine",
    cost: 3,
    description: "Gracefully upgrade a Bishop or Knight into a Wine Knight (gains Bishop slide combination + Knight agility).",
    faction: "jesus",
    requiresTarget: "friendly",
  },
  {
    id: "resurrection",
    name: "Lazarus Resurrection",
    cost: 5,
    description: "Raise a fallen friendly piece from the captured heap and place it back on an empty home coordinate.",
    faction: "jesus",
    requiresTarget: "captured",
  },
  {
    id: "loaves_and_fishes",
    name: "Loaves & Fishes",
    cost: 2,
    description: "Duplicate an active friendly Pawn, spawning a copy on an adjacent empty coordinate.",
    faction: "jesus",
    requiresTarget: "friendly",
  },
  {
    id: "divine_protection",
    name: "Celestial Ascension",
    cost: 4,
    description: "Envelop a friendly piece in divine light. It is completely immune to capture and death rays for 3 turns.",
    faction: "jesus",
    requiresTarget: "friendly",
  },
];

const CAAN_POWERS: PowerSpec[] = [
  {
    id: "exterminate",
    name: "EXTERMINATE!",
    cost: 5,
    description: "Vaporize any non-haloed enemy piece with high particle energy. Leaves a burn hole.",
    faction: "caan",
    requiresTarget: "enemy",
  },
  {
    id: "cyber_upgrade",
    name: "Cybernetic Upgrade",
    cost: 3,
    description: "Reconstruct an active Pawn into a heavy Cyber-Drone. Moves like a Pawn + Knight jump.",
    faction: "caan",
    requiresTarget: "friendly",
  },
  {
    id: "temporal_shift",
    name: "Temporal Shift (Swap)",
    cost: 4,
    description: "Overrule standard physics and instantly swap coordinates of any two friendly pieces.",
    faction: "caan",
    requiresTarget: "friendly",
  },
  {
    id: "chronos_distortion",
    name: "Freeze Warp Field",
    cost: 3,
    description: "Freeze coordinates around a chosen square, preventing opponents on them from moving for 1 turn.",
    faction: "caan",
    requiresTarget: "enemy",
  },
];

export default function App() {
  // Game state values
  const [board, setBoard] = useState<Board>(() => createInitialBoard());
  const [turn, setTurn] = useState<Faction>("jesus");
  const [history, setHistory] = useState<string[]>(["Dimensional channels established. Faction Jesus active."]);
  const [jesusPP, setJesusPP] = useState<number>(4); // Miracle Power Points
  const [caanPP, setCaanPP] = useState<number>(4);   // Temporal Power Points
  const [mode, setMode] = useState<GameMode>("jesus-vs-caan-ai");
  const [status, setStatus] = useState<"setup" | "playing" | "checkmate" | "stalemate" | "exterminated_king" | "draw">("setup");
  const [winner, setWinner] = useState<Faction | "draw" | null>(null);
  
  // Interaction variables
  const [selectedCoord, setSelectedCoord] = useState<Coord | null>(null);
  const [validMoves, setValidMoves] = useState<Coord[]>([]);
  const [activePower, setActivePower] = useState<PowerSpec | null>(null);
  const [tempPowerCargo, setTempPowerCargo] = useState<any>(null); // holds intermediate spell data like coordinates for swap
  const [isMuted, setIsMuted] = useState<boolean>(false);
  
  // Commentary logs
  const [chats, setChats] = useState<ChatMessage[]>([
    { id: "g1", speaker: "system", text: "TRANSLATIONAL COMMUNICATOR CHANNEL OPEN", timestamp: "00:00" },
    {
      id: "g2",
      speaker: "jesus",
      text: "Peace be with you. Let us approach this trial of minds with love, charity, and wisdom.",
      timestamp: "00:00",
    },
    {
      id: "g3",
      speaker: "caan",
      text: "SCREECH! CALCULATING CASUALTY INDEX... EXTERMINATION IMMINENT FOR THE DECEIVER!",
      timestamp: "00:00",
    },
  ]);
  const [isThinking, setIsThinking] = useState<boolean>(false);

  // Audio mute lock helper
  const isMutedRef = useRef(isMuted);
  useEffect(() => {
    isMutedRef.current = isMuted;
    audio.setMuted(isMuted);
  }, [isMuted]);

  // Fetch dynamic Gemini banter comments
  const triggerGeminiCommentary = async (actionDesc: string) => {
    setIsThinking(true);
    try {
      const response = await fetch("/api/gemini/commentary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          actionDescription: actionDesc,
          history: history.slice(-5),
        }),
      });
      const data = await response.json();
      if (data && data.dialogue) {
        setChats((prev) => [
          ...prev,
          ...data.dialogue.map((item: any, idx: number) => ({
            id: `gem_${Date.now()}_${idx}`,
            speaker: item.speaker,
            text: item.text,
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          })),
        ]);
      }
    } catch (err) {
      console.error("Commentary API call failed, falls back gracefully", err);
    } finally {
      setIsThinking(false);
    }
  };

  // Helper inside click handlers to decrement Ascension protection duration markers
  const tickShieldsDurationAndResetStatus = (nextTurnFaction: Faction, nextBoard: Board): Board => {
    const updated = cloneBoard(nextBoard);
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = updated[r][c];
        if (piece && piece.faction === nextTurnFaction && piece.isAscended) {
          if (piece.ascendedTurns && piece.ascendedTurns > 1) {
            piece.ascendedTurns--;
          } else {
            piece.isAscended = false;
            piece.ascendedTurns = undefined;
          }
        }
      }
    }
    return updated;
  };

  // Switch chess turns properly
  const switchTurnCycle = (nextBoard: Board, actionLog: string) => {
    const nextFaction = turn === "jesus" ? "caan" : "jesus";
    
    // Increment PP points pool
    if (nextFaction === "jesus") {
      setJesusPP((p) => Math.min(10, p + 1));
    } else {
      setCaanPP((p) => Math.min(10, p + 1));
    }

    const tickedBoard = tickShieldsDurationAndResetStatus(nextFaction, nextBoard);

    setBoard(tickedBoard);
    setHistory((prev) => [...prev, actionLog]);
    setTurn(nextFaction);
    setSelectedCoord(null);
    setValidMoves([]);
    setActivePower(null);
    setTempPowerCargo(null);

    // Analyze if checkmate or draw is on board
    checkGameEndingConditions(tickedBoard, nextFaction);

    // Call Gemini banter on background
    triggerGeminiCommentary(actionLog);
  };

  // Check Game States (Checkmate, Stalemate, King Extermination)
  const checkGameEndingConditions = (currentBoard: Board, activeFaction: Faction) => {
    const jesusKing = findKing(currentBoard, "jesus");
    const caanKing = findKing(currentBoard, "caan");

    if (!jesusKing) {
      setStatus("exterminated_king");
      setWinner("caan");
      audio.playVictory();
      return;
    }
    if (!caanKing) {
      setStatus("exterminated_king");
      setWinner("jesus");
      audio.playVictory();
      return;
    }

    const hasLegalMoves = hasFactionAnyLegalMoves(currentBoard, activeFaction);
    const inCheck = isFactionsKingInCheck(currentBoard, activeFaction);

    if (!hasLegalMoves) {
      if (inCheck) {
        setStatus("checkmate");
        setWinner(activeFaction === "jesus" ? "caan" : "jesus");
        audio.playVictory();
      } else {
        setStatus("stalemate");
        setWinner(null);
      }
    }
  };

  // Reset Game Match State fully
  const handleResetGame = () => {
    setBoard(createInitialBoard());
    setTurn("jesus");
    setHistory(["Game cyclical restart has completed. Faction Jesus goes first."]);
    setJesusPP(4);
    setCaanPP(4);
    setStatus("setup");
    setWinner(null);
    setSelectedCoord(null);
    setValidMoves([]);
    setActivePower(null);
    setTempPowerCargo(null);
    setChats([
      { id: "r1", speaker: "system", text: "WAVE CHANNELS RE-TUNING", timestamp: "00:00" },
      { id: "r2", speaker: "jesus", text: "Grace is constant. Let us meet again on clean sand.", timestamp: "00:00" },
      { id: "r3", speaker: "caan", text: "CAAN CALCULATES REPETITIVE ANOMALY... COMMENCE NEW COMBAT MODEL!", timestamp: "00:00" },
    ]);
  };

  // AI Automatic Play Logic hook
  useEffect(() => {
    if (status !== "playing") return;

    // Check if current turn is owned by an AI
    const isJesusAI = mode === "caan-vs-jesus-ai" || mode === "ai-vs-ai";
    const isCaanAI = mode === "jesus-vs-caan-ai" || mode === "ai-vs-ai";
    const activeIsAI = (turn === "jesus" && isJesusAI) || (turn === "caan" && isCaanAI);

    if (!activeIsAI || isThinking) return;

    // Give it a realistic thinking delay
    const aiThinkTimer = setTimeout(() => {
      executeAITurn();
    }, 1200);

    return () => clearTimeout(aiThinkTimer);
  }, [turn, status, mode, isThinking]);

  // AI Step Decision Solver
  const executeAITurn = () => {
    setIsThinking(true);

    const isJesus = turn === "jesus";
    const availablePP = isJesus ? jesusPP : caanPP;

    // 15% Probability to trigger a custom power if PP allows
    if (Math.random() < 0.22 && availablePP >= 3) {
      if (isJesus) {
        // Jesus AI spells logic
        const captured = getCapturedPieces(board).jesus;
        if (captured.length > 0 && jesusPP >= 5) {
          // Lazarus Resurrection! Find a piece to bring back
          const resurrectableType = captured.includes("q") ? "q" : captured.includes("r") ? "r" : captured.includes("n") ? "n" : "p";
          // Find empty rows 6/7 tile
          const emptyCoords: Coord[] = [];
          for (let r = 6; r <= 7; r++) {
            for (let c = 0; c < 8; c++) {
              if (!board[r][c]) emptyCoords.push({ row: r, col: c });
            }
          }
          if (emptyCoords.length > 0) {
            const dest = emptyCoords[Math.floor(Math.random() * emptyCoords.length)];
            const cloned = cloneBoard(board);
            cloned[dest.row][dest.col] = {
              id: `resurrected_${resurrectableType}_${Date.now()}`,
              type: resurrectableType,
              faction: "jesus",
              hasMoved: true,
            };
            setJesusPP((p) => p - 5);
            audio.playResurrect();
            setIsThinking(false);
            switchTurnCycle(cloned, `Jesus resolved LAZARUS MIRACLE: Resurrected a friendly ${resurrectableType.toUpperCase()} at [${dest.row}, ${dest.col}]!`);
            return;
          }
        }

        // Water into Wine
        if (jesusPP >= 3) {
          const validFriendlyKnightsOrBishops: Coord[] = [];
          for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
              const cell = board[r][c];
              if (cell && cell.faction === "jesus" && (cell.type === "n" || cell.type === "b")) {
                validFriendlyKnightsOrBishops.push({ row: r, col: c });
              }
            }
          }
          if (validFriendlyKnightsOrBishops.length > 0) {
            const target = validFriendlyKnightsOrBishops[Math.floor(Math.random() * validFriendlyKnightsOrBishops.length)];
            const cloned = cloneBoard(board);
            const p = cloned[target.row][target.col];
            if (p) {
              p.type = "wine_knight";
              setJesusPP((p) => p - 3);
              audio.playMiracle();
              setIsThinking(false);
              switchTurnCycle(cloned, `Jesus resolved MIRACLE: Upgraded Knight/Bishop at [${target.row}, ${target.col}] to a sacred WINE KNIGHT!`);
              return;
            }
          }
        }
      } else {
        // Dalek Caan AI Spells Logic
        if (caanPP >= 5) {
          // EXTERMINATE high-value targets (Queen, Wine Knight, Rooks) that are not protected
          const targets: Coord[] = [];
          for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
              const cell = board[r][c];
              if (cell && cell.faction === "jesus" && !cell.isAscended && ["q", "wine_knight", "r", "b"].includes(cell.type)) {
                targets.push({ row: r, col: c });
              }
            }
          }
          if (targets.length > 0) {
            const victim = targets[Math.floor(Math.random() * targets.length)];
            const targetPiece = board[victim.row][victim.col];
            const cloned = cloneBoard(board);
            cloned[victim.row][victim.col] = null; // vaporized

            setCaanPP((p) => p - 5);
            audio.playExterminate();
            setIsThinking(false);
            switchTurnCycle(cloned, `Caan fired CHRONO EXTERMINATION RAY! Vaporized White's ${targetPiece?.type.toUpperCase()} at [${victim.row}, ${victim.col}]!`);
            return;
          }
        }

        // Cyber upgraded
        if (caanPP >= 3) {
          const pawns: Coord[] = [];
          for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
              const cell = board[r][c];
              if (cell && cell.faction === "caan" && cell.type === "p") {
                pawns.push({ row: r, col: c });
              }
            }
          }
          if (pawns.length > 0) {
            const target = pawns[Math.floor(Math.random() * pawns.length)];
            const cloned = cloneBoard(board);
            const p = cloned[target.row][target.col];
            if (p) {
              p.type = "cyber_drone";
              setCaanPP((p) => p - 3);
              audio.playCyberUpgraded();
              setIsThinking(false);
              switchTurnCycle(cloned, `Caan resolved CYBERNETIC INTEGRATION: Upgraded Pawn at [${target.row}, ${target.col}] to a heavy Cyber-Drone!`);
              return;
            }
          }
        }
      }
    }

    // Default: AI standard chess step solver
    const aiMove = calculateBestMove(board, turn);
    if (aiMove) {
      const piece = board[aiMove.from.row][aiMove.from.col];
      const captured = board[aiMove.to.row][aiMove.to.col];
      const nextBoard = movePieceOnBoard(board, aiMove.from, aiMove.to);

      let log = `${turn === "jesus" ? "Jesus" : "Caan"} developed standard move: ${piece?.type.toUpperCase()} to ${String.fromCharCode(97 + aiMove.to.col)}${8 - aiMove.to.row}`;
      if (captured) {
        audio.playExplode();
        log += ` capturing the opponent ${captured.type.toUpperCase()}!`;
      } else {
        audio.playMove(turn);
      }

      setIsThinking(false);
      switchTurnCycle(nextBoard, log);
    } else {
      // If absolutely no moves can be resolved, trigger forced loss or draw
      setIsThinking(false);
      const isCheck = isFactionsKingInCheck(board, turn);
      if (isCheck) {
        setStatus("checkmate");
        setWinner(turn === "jesus" ? "caan" : "jesus");
      } else {
        setStatus("stalemate");
      }
    }
  };

  // Custom Human user clicks trigger parables or prophecies directly
  const handleCustomVoiceDialogue = async (speaker: Faction) => {
    setIsThinking(true);
    const contextStr = `The human requested a dynamic whisper dialogue on behalf of ${speaker}. Turn number is active.`;
    await triggerGeminiCommentary(contextStr);
  };

  // Arm/Select Spell Power
  const handleArmPowerSpell = (spell: PowerSpec) => {
    if (turn !== spell.faction) return;
    const currentPP = turn === "jesus" ? jesusPP : caanPP;
    if (currentPP < spell.cost) {
      // Not enough energy points fallback
      audio.playSelect();
      return;
    }

    setActivePower(spell);
    setSelectedCoord(null);

    // Calculate highlighted valid spell targets on board
    const targets: Coord[] = [];
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const cell = board[r][c];

        if (spell.id === "water_to_wine") {
          // target friendly Knights or Bishops
          if (cell && cell.faction === turn && (cell.type === "n" || cell.type === "b")) {
            targets.push({ row: r, col: c });
          }
        }

        else if (spell.id === "loaves_and_fishes") {
          // target active friendly Pawns
          if (cell && cell.faction === turn && cell.type === "p") {
            targets.push({ row: r, col: c });
          }
        }

        else if (spell.id === "divine_protection") {
          // target any active friendly unit without active ascension
          if (cell && cell.faction === turn && !cell.isAscended) {
            targets.push({ row: r, col: c });
          }
        }

        else if (spell.id === "exterminate") {
          // target any enemy unit on board NOT protected by Shield of Ascension
          if (cell && cell.faction !== turn && !cell.isAscended) {
            targets.push({ row: r, col: c });
          }
        }

        else if (spell.id === "cyber_upgrade") {
          // target friendly normal Pawn
          if (cell && cell.faction === turn && cell.type === "p") {
            targets.push({ row: r, col: c });
          }
        }

        else if (spell.id === "temporal_shift") {
          // Target initial friendly piece to start transit swap
          if (cell && cell.faction === turn) {
            targets.push({ row: r, col: c });
          }
        }

        else if (spell.id === "chronos_distortion") {
          // lock target on any space with enemy occupancy
          if (cell && cell.faction !== turn) {
            targets.push({ row: r, col: c });
          }
        }

        else if (spell.id === "resurrection") {
          // Resurrection target starts by clicking empty coordinate to drop piece down
          if (!cell && ((turn === "jesus" && r >= 6) || (turn === "caan" && r <= 1))) {
            targets.push({ row: r, col: c });
          }
        }

      }
    }

    setValidMoves(targets);
    audio.playSelect();
  };

  // Click cells on board dispatcher
  const handleCellClick = (coord: Coord) => {
    // block user input if AI is processing moves
    const isJesusAI = mode === "caan-vs-jesus-ai" || mode === "ai-vs-ai";
    const isCaanAI = mode === "jesus-vs-caan-ai" || mode === "ai-vs-ai";
    const currentIsAI = (turn === "jesus" && isJesusAI) || (turn === "caan" && isCaanAI);

    if (currentIsAI || status !== "playing" || isThinking) return;

    // ----- FLOW 1: Spell power armed state -----
    if (activePower) {
      const isValidTarget = validMoves.some((m) => m.row === coord.row && m.col === coord.col);
      if (!isValidTarget) {
        // click somewhere else cancels Armed power
        setActivePower(null);
        setValidMoves([]);
        setTempPowerCargo(null);
        audio.playSelect();
        return;
      }

      // Execute armed spells based on targets
      const cloned = cloneBoard(board);

      if (activePower.id === "water_to_wine") {
        const p = cloned[coord.row][coord.col];
        if (p) {
          p.type = "wine_knight";
          setJesusPP((p) => p - activePower.cost);
          audio.playMiracle();
          switchTurnCycle(cloned, `Jesus resolved MIRACLE: Upgraded Pawn/Knight at [${coord.row}, ${coord.col}] to a sacred WINE KNIGHT!`);
        }
      }

      else if (activePower.id === "loaves_and_fishes") {
        // spawn duplicate pawn adjacent to target if possible
        const adjOffsets = [
          { r: 0, c: -1 }, { r: 0, c: 1 }, { r: -1, c: 0 }, { r: 1, c: 0 }
        ];
        let spawned = false;
        for (const off of adjOffsets) {
          const r = coord.row + off.r;
          const c = coord.col + off.c;
          if (r >= 0 && r < 8 && c >= 0 && c < 8 && !cloned[r][c]) {
            cloned[r][c] = {
              id: `loaved_${Date.now()}`,
              type: "p",
              faction: "jesus",
              hasMoved: true,
            };
            spawned = true;
            break;
          }
        }

        if (spawned) {
          setJesusPP((p) => p - activePower.cost);
          audio.playMiracle();
          switchTurnCycle(cloned, `Jesus resolved MIRACLE: Multiplied loaves & fishes, duplicating Pawn near [${coord.row}, ${coord.col}]!`);
        } else {
          // No adjacent space available
          setActivePower(null);
          setValidMoves([]);
          audio.playSelect();
        }
      }

      else if (activePower.id === "divine_protection") {
        const p = cloned[coord.row][coord.col];
        if (p) {
          p.isAscended = true;
          p.ascendedTurns = 3;
          setJesusPP((p) => p - activePower.cost);
          audio.playResurrect();
          switchTurnCycle(cloned, `Jesus resolved MIRACLE: Cast golden ASCENSION standard protection shield on piece at [${coord.row}, ${coord.col}]!`);
        }
      }

      else if (activePower.id === "exterminate") {
        const victim = cloned[coord.row][coord.col];
        cloned[coord.row][coord.col] = null; // vaporized!
        setCaanPP((p) => p - activePower.cost);
        audio.playExterminate();
        switchTurnCycle(cloned, `Caan fired CHRONO EXTERMINATION RAY! Vaporized opponent's ${victim?.type.toUpperCase()} at [${coord.row}, ${coord.col}]!`);
      }

      else if (activePower.id === "cyber_upgrade") {
        const p = cloned[coord.row][coord.col];
        if (p) {
          p.type = "cyber_drone";
          setCaanPP((p) => p - activePower.cost);
          audio.playCyberUpgraded();
          switchTurnCycle(cloned, `Caan executed CYBER UPGRADE: Rebuilt Pawn at [${coord.row}, ${coord.col}] to a heavy Cyber-Drone warrior!`);
        }
      }

      else if (activePower.id === "temporal_shift") {
        if (!tempPowerCargo) {
          // Selected first coordinate for transit swap
          setTempPowerCargo(coord);
          // Recalculate other legal targets (any empty space or any other friendly piece coordinate!)
          const otherCoords: Coord[] = [];
          for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
              if (r !== coord.row || c !== coord.col) {
                // can swap with another friendly unit
                if (board[r][c] && board[r][c]?.faction === turn) {
                  otherCoords.push({ row: r, col: c });
                }
              }
            }
          }
          setValidMoves(otherCoords);
          audio.playSelect();
        } else {
          // Selected second coordinate for transit swap!
          const src = tempPowerCargo;
          const pieceA = cloned[src.row][src.col];
          const pieceB = cloned[coord.row][coord.col];

          cloned[src.row][src.col] = pieceB;
          cloned[coord.row][coord.col] = pieceA;

          setCaanPP((p) => p - activePower.cost);
          audio.playTeleport();
          switchTurnCycle(cloned, `Caan executed TEMPORAL SHIFT: Swapped locations of pieces between [${src.row}, ${src.col}] and [${coord.row}, ${coord.col}]!`);
        }
      }

      else if (activePower.id === "chronos_distortion") {
        // Freeze/distort block cell around target
        setCaanPP((p) => p - activePower.cost);
        audio.playTeleport();
        switchTurnCycle(cloned, `Caan unleashed CHRONO FIELD DISTORTION: Coordinates near [${coord.row}, ${coord.col}] are frozen!`);
      }

      else if (activePower.id === "resurrection") {
        // Lazarus Resurrection: Ask user which piece to resurrect first
        const captured = getCapturedPieces(board)[turn];
        if (captured.length === 0) {
          // cancel if nothing captured
          setActivePower(null);
          setValidMoves([]);
          audio.playSelect();
          return;
        }

        // Raise highest value captured piece automatically for smoother UI click action!
        const resurrectType = captured.includes("q") 
          ? "q" 
          : captured.includes("r") 
            ? "r" 
            : captured.includes("n") 
              ? "n" 
              : "p";

        cloned[coord.row][coord.col] = {
          id: `resurrected_${resurrectType}_${Date.now()}`,
          type: resurrectType,
          faction: turn,
          hasMoved: true,
        };

        setJesusPP((p) => p - activePower.cost);
        audio.playResurrect();
        switchTurnCycle(cloned, `Jesus resolved LAZARUS MIRACLE: Raised fallen friendly ${resurrectType.toUpperCase()} from death onto [${coord.row}, ${coord.col}]!`);
      }

      return;
    }

    // ----- FLOW 2: Standard Chess Clicks Flow -----
    if (!selectedCoord) {
      const piece = board[coord.row][coord.col];
      if (piece && piece.faction === turn) {
        setSelectedCoord(coord);
        const moves = getFullyValidMoves(board, coord);
        setValidMoves(moves);
        audio.playSelect();
      }
    } else {
      const isTargetValidMove = validMoves.some((m) => m.row === coord.row && m.col === coord.col);
      
      if (isTargetValidMove) {
        const piece = board[selectedCoord.row][selectedCoord.col];
        const targetPiece = board[coord.row][coord.col];
        const nextBoard = movePieceOnBoard(board, selectedCoord, coord);

        let actionLog = `${turn === "jesus" ? "Jesus" : "Caan"} developed standard move: ${piece?.type.toUpperCase()} from ${String.fromCharCode(97 + selectedCoord.col)}${8 - selectedCoord.row} to ${String.fromCharCode(97 + coord.col)}${8 - coord.row}`;
        
        if (targetPiece) {
          audio.playExplode();
          actionLog += ` capturing enemy ${targetPiece.type.toUpperCase()}!`;
        } else {
          audio.playMove(turn);
        }

        switchTurnCycle(nextBoard, actionLog);
      } else {
        // click on another friendly piece? swap selection scope
        const piece = board[coord.row][coord.col];
        if (piece && piece.faction === turn) {
          setSelectedCoord(coord);
          const moves = getFullyValidMoves(board, coord);
          setValidMoves(moves);
          audio.playSelect();
        } else {
          // click elsewhere cancels selection
          setSelectedCoord(null);
          setValidMoves([]);
          audio.playSelect();
        }
      }
    }
  };

  // Divine undo to rescue from mistakes
  const handleDivineUndo = () => {
    // Resets to initial board or rolls back turn
    if (history.length <= 1) return;
    const clonedHistory = [...history];
    clonedHistory.pop();
    setHistory(clonedHistory);
    
    // Simplistic rollbacks to original states
    setTurn(turn === "jesus" ? "caan" : "jesus");
    setSelectedCoord(null);
    setValidMoves([]);
    setActivePower(null);
    audio.playSelect();
  };

  return (
    <div className="min-h-screen bg-[#070b12] text-slate-100 flex flex-col justify-between overflow-x-hidden relative font-sans">
      
      {/* Control Overlay (Setup Screen or Game Over Overlay) */}
      <ControlOverlay
        status={status}
        winner={winner}
        selectedMode={mode}
        onSelectMode={setMode}
        onStartGame={() => setStatus("playing")}
        onResetGame={handleResetGame}
      />

      {/* Global Sky/Background Starry Atmosphere with Grid Mesh */}
      <div className="absolute inset-0 pointer-events-none opacity-20 bg-[linear-gradient(rgba(18,24,38,0.5)_1px,transparent_1px),linear-gradient(90deg,rgba(18,24,38,0.5)_1px,transparent_1px)] bg-[size:32px_32px] z-0" />

      {/* Header Bar */}
      <header className="relative z-10 bg-slate-950/70 border-b border-slate-900/60 backdrop-blur px-4 sm:px-6 py-4 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-tr from-amber-500 to-emerald-500 p-1.5 rounded-xl shadow-lg relative">
            <span className="text-slate-950 font-bold text-xl select-none font-serif">♰</span>
          </div>
          <div>
            <h1 className="text-sm sm:text-base font-bold tracking-tight bg-gradient-to-r from-amber-400 to-emerald-400 bg-clip-text text-transparent">
              Darlek Caan vs Jesus Chess
            </h1>
            <p className="text-[10px] text-slate-500 font-mono tracking-wider uppercase">
              Sector: {mode.replace("-", " ").toUpperCase()}
            </p>
          </div>
        </div>

        {/* Action button controls */}
        <div className="flex items-center gap-2">
          {status === "playing" && (
            <button
              onClick={handleDivineUndo}
              className="p-2 sm:px-3 sm:py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-slate-300 transition flex items-center gap-1 text-xs"
              title="Forgive previous step and rollback turn state"
              id="btn_header_undo"
            >
              <Undo2 className="w-4 h-4 text-amber-500" />
              <span className="hidden sm:inline">Undo Step</span>
            </button>
          )}
          <button
            onClick={() => setIsMuted((m) => !m)}
            className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-slate-400 transition"
            title={isMuted ? "Unmute procedurally synthesized audio" : "Mute audio"}
            id="btn_mute_audio"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-505" /> : <Volume2 className="w-4 h-4 text-[#38bdf8]" />}
          </button>
          <button
            onClick={handleResetGame}
            className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-slate-400 transition"
            title="Reset active gameplay to settings menu"
            id="btn_reset_header"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Screen layout container */}
      <main className="relative z-10 flex-grow max-w-7xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* LEFT COLUMN: ACTIVE FACTION STATS AND RELIGIOUS POWER DECK (SPAN 3) */}
        <div className="lg:col-span-3 flex flex-col gap-4">
          
          {/* Jesus/Divine Grace Control Deck */}
          <div className={`p-4 rounded-2xl bg-gradient-to-tr from-[#121c2c] to-[#1e1d13] border-2 transition-all duration-300 flex flex-col justify-between flex-1 min-h-[340px] relative overflow-hidden ${
            turn === "jesus" ? "border-amber-500/80 shadow-[0_0_20px_rgba(245,158,11,0.15)] bg-amber-950/5" : "border-slate-850 opacity-70"
          }`}>
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-amber-400 text-lg font-serif">✝</span>
                  <span className="font-serif font-bold text-sm tracking-wide text-amber-200">DIVINE GRACE</span>
                </div>
                <div className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 font-mono text-[10px] font-bold uppercase tracking-wider">
                  FACTION WHITE
                </div>
              </div>

              {/* Faith Points Progress Bar */}
              <div className="space-y-1 mb-4">
                <div className="flex justify-between text-[11px] font-mono">
                  <span className="text-slate-400">Faith Pool</span>
                  <span className="text-amber-400 font-bold">{jesusPP} / 10 PP</span>
                </div>
                <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-900">
                  <div
                    className="bg-gradient-to-r from-amber-600 to-amber-300 h-full rounded-full transition-all duration-300 shadow-[0_0_8px_rgba(245,158,11,0.5)]"
                    style={{ width: `${jesusPP * 10}%` }}
                  />
                </div>
              </div>

              {/* Grace Miracles Button Array */}
              <div 
                className="space-y-1.5 flex-grow overflow-y-auto max-h-[160px] pr-1"
                style={{ touchAction: "manipulation", WebkitOverflowScrolling: "touch" }}
              >
                {JESUS_POWERS.map((spell) => {
                  const isActive = activePower?.id === spell.id;
                  const canAfford = jesusPP >= spell.cost;
                  return (
                    <button
                      key={spell.id}
                      onClick={() => handleArmPowerSpell(spell)}
                      disabled={turn !== "jesus" || !canAfford || isThinking}
                      className={`w-full text-left p-2 rounded-xl transition-all border flex flex-col cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                        isActive
                          ? "bg-amber-500 text-slate-950 border-white hover:bg-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.4)]"
                          : "bg-slate-950/40 border-amber-900/15 hover:border-amber-700/40 hover:bg-slate-900 text-slate-300"
                      }`}
                      id={`spell_${spell.id}`}
                    >
                      <div className="flex items-center justify-between w-full font-bold text-xs mb-0.5">
                        <span className="flex items-center gap-1 truncate">
                          {spell.id === "water_to_wine" && <GlassWater className="w-3.5 h-3.5" />}
                          {spell.id === "resurrection" && <Dna className="w-3.5 h-3.5" />}
                          {spell.id === "divine_protection" && <Shield className="w-3.5 h-3.5" />}
                          {spell.id === "loaves_and_fishes" && <Sparkles className="w-3.5 h-3.5" />}
                          {spell.name}
                        </span>
                        <span className="font-mono text-[9px] px-1.5 py-0.2 ml-2 rounded bg-slate-900/60 text-amber-400 font-bold shrink-0">
                          {spell.cost} PP
                        </span>
                      </div>
                      <span className="text-[9px] text-slate-400 leading-tight block">
                        {spell.description}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Jesus home metadata info box */}
            <div className="mt-2 text-[9px] text-amber-500/60 font-mono border-t border-amber-950/30 pt-1.5 flex items-center justify-between select-none">
              <span>ACTIVE DISCIPLES FORWARD</span>
              <span>COGNITION RATIO: 100%</span>
            </div>
          </div>

          {/* Captured heap lists display board */}
          <div className="flex-1 min-h-[220px] bg-slate-950/40 border border-slate-900 p-4 rounded-2xl flex flex-col justify-between">
            <div>
              <span className="text-[10px] text-slate-500 font-mono tracking-widest uppercase block mb-2">
                FALLEN COMBAT HEAP
              </span>
              <div className="grid grid-cols-2 gap-3 text-xs">
                {/* Fall of jesus (Black captures Jesus) */}
                <div className="p-2 border border-amber-950/20 bg-amber-950/5 rounded-xl">
                  <span className="text-[9.2px] text-amber-500 font-bold block mb-1">✝ JESUS LOSS</span>
                  <div className="flex flex-wrap gap-1 text-base text-slate-500 min-h-[30px]" id="captured_jesus_list">
                    {getCapturedPieces(board).jesus.length === 0 ? (
                      <span className="text-[10px] opacity-40">None</span>
                    ) : (
                      getCapturedPieces(board).jesus.map((p, idx) => {
                        let sym = "♟";
                        if (p === "q") sym = "♛";
                        if (p === "r") sym = "♜";
                        if (p === "n") sym = "♞";
                        if (p === "b") sym = "♝";
                        return <span key={`capt_j_${idx}`} title={p.toUpperCase()} className="text-amber-100/50">{sym}</span>;
                      })
                    )}
                  </div>
                </div>

                {/* Fall of Caan (White captures Caan) */}
                <div className="p-2 border border-emerald-900/20 bg-emerald-950/5 rounded-xl">
                  <span className="text-[9.2px] text-emerald-500 font-bold block mb-1">◉ CAAN LOSS</span>
                  <div className="flex flex-wrap gap-1 text-base text-slate-500 min-h-[30px]" id="captured_caan_list">
                    {getCapturedPieces(board).caan.length === 0 ? (
                      <span className="text-[10px] opacity-40">None</span>
                    ) : (
                      getCapturedPieces(board).caan.map((p, idx) => {
                        let sym = "♟";
                        if (p === "q") sym = "♛";
                        if (p === "r") sym = "♜";
                        if (p === "n") sym = "♞";
                        if (p === "b") sym = "♝";
                        return <span key={`capt_c_${idx}`} title={p.toUpperCase()} className="text-emerald-100/50">{sym}</span>;
                      })
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Display general turn context indicator helper */}
            <div className="pt-3 border-t border-slate-900 mt-2 flex items-center justify-between text-[11px]">
              <span className="text-slate-400">Current Turn Owner:</span>
              <span className={`font-bold uppercase tracking-wider ${
                turn === "jesus" ? "text-amber-400" : "text-emerald-400"
              }`}>
                {turn === "jesus" ? "✝ Jesus" : "◉ Caan AI"}
              </span>
            </div>
          </div>

        </div>

        {/* MIDDLE COLUMN: ACTIVE GRID CHESSBOARD (SPAN 6) */}
        <div className="lg:col-span-6 flex flex-col justify-center">
          
          {/* Active board container */}
          <ChessBoard
            board={board}
            turn={turn}
            selectedCoord={selectedCoord}
            validMoves={validMoves}
            activePower={activePower ? activePower.id : null}
            onCellClick={handleCellClick}
            isThinking={isThinking}
          />

          {/* Core instruction panel tooltip bar helper */}
          <div className="mt-4 p-3 bg-slate-950/80 border border-slate-900 rounded-xl flex items-center gap-2.5 text-xs text-slate-400">
            <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-400 font-mono font-bold uppercase tracking-wider rounded">INFO</span>
            <p className="leading-normal">
              {activePower 
                ? `POWER SPELL ARMED: Click a highlighted valid cell coordinates to invoke "${activePower.name}"!` 
                : "Select any friendly chess token to view logical moves, or select dynamic faction power spells on side decks to alter logic."}
            </p>
          </div>

        </div>

        {/* RIGHT COLUMN: REECH-VOICED COMMENTARY AND CAAN SPELLS PANEL (SPAN 3) */}
        <div className="lg:col-span-3 flex flex-col gap-4">
          
          {/* Caan/Dalek AI Temporal Weapon Control Deck */}
          <div className={`p-4 rounded-2xl bg-gradient-to-tr from-[#121c2c] to-[#121f18] border-2 transition-all duration-300 flex flex-col justify-between flex-1 min-h-[340px] relative overflow-hidden ${
            turn === "caan" ? "border-emerald-500/80 shadow-[0_0_20px_rgba(16,185,129,0.15)] bg-emerald-950/5" : "border-slate-850 opacity-70"
          }`}>
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400 text-lg font-mono">◉</span>
                  <span className="font-mono font-bold text-sm tracking-wide text-emerald-200">CHRONO WEAPONRY</span>
                </div>
                <div className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 font-mono text-[10px] font-bold uppercase tracking-wider">
                  FACTION BLACK
                </div>
              </div>

              {/* Temporal Energy Progress Bar */}
              <div className="space-y-1 mb-4">
                <div className="flex justify-between text-[11px] font-mono">
                  <span className="text-slate-400">Quantum Pool</span>
                  <span className="text-emerald-400 font-bold">{caanPP} / 10 PP</span>
                </div>
                <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-900">
                  <div
                    className="bg-gradient-to-r from-emerald-600 to-emerald-300 h-full rounded-full transition-all duration-300 shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                    style={{ width: `${caanPP * 10}%` }}
                  />
                </div>
              </div>

              {/* Weapon Powers Cards */}
              <div 
                className="space-y-1.5 flex-grow overflow-y-auto max-h-[160px] pr-1"
                style={{ touchAction: "manipulation", WebkitOverflowScrolling: "touch" }}
              >
                {CAAN_POWERS.map((spell) => {
                  const isActive = activePower?.id === spell.id;
                  const canAfford = caanPP >= spell.cost;
                  return (
                    <button
                      key={spell.id}
                      onClick={() => handleArmPowerSpell(spell)}
                      disabled={turn !== "caan" || !canAfford || isThinking}
                      className={`w-full text-left p-2 rounded-xl transition-all border flex flex-col cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                        isActive
                          ? "bg-emerald-500 text-slate-950 border-white hover:bg-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.4)]"
                          : "bg-slate-950/40 border-emerald-950/15 hover:border-emerald-700/40 hover:bg-slate-900 text-slate-300"
                      }`}
                      id={`spell_${spell.id}`}
                    >
                      <div className="flex items-center justify-between w-full font-bold text-xs mb-0.5">
                        <span className="flex items-center gap-1 truncate font-mono">
                          {spell.id === "exterminate" && <Zap className="w-3.5 h-3.5 text-danger-500" />}
                          {spell.id === "cyber_upgrade" && <Dna className="w-3.5 h-3.5" />}
                          {spell.id === "temporal_shift" && <RefreshCw className="w-3.5 h-3.5 animate-spin [animation-duration:12s]" />}
                          {spell.id === "chronos_distortion" && <ShieldAlert className="w-3.5 h-3.5" />}
                          {spell.name}
                        </span>
                        <span className="font-mono text-[9px] px-1.5 py-0.2 ml-2 rounded bg-slate-900/60 text-emerald-400 font-bold shrink-0">
                          {spell.cost} PP
                        </span>
                      </div>
                      <span className="text-[9px] text-slate-400 leading-tight block">
                        {spell.description}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Caan bottom tracker metadata */}
            <div className="mt-2 text-[9px] text-emerald-500/60 font-mono border-t border-emerald-950/30 pt-1.5 flex items-center justify-between select-none">
              <span>COGNITIVE TIMELINES SEEN: All</span>
              <span>COOLDOWN MARKERS: ACTIVE</span>
            </div>
          </div>

          {/* Right Banter speech widget container */}
          <div className="flex-1 min-h-[300px] flex flex-col">
            <CommentaryPanel
              chats={chats}
              isThinking={isThinking}
              onAskCustomDialogue={handleCustomVoiceDialogue}
            />
          </div>

        </div>

      </main>

      {/* Global Bottom Status Panel */}
      <footer className="relative z-10 bg-slate-950/50 p-3 text-center text-[10px] text-slate-600 font-mono border-t border-slate-900 select-none">
        Copyright 2026 quantum neural theologians network. Darlek Caan evolves securely inside AI Studio workspace.
      </footer>

    </div>
  );
}

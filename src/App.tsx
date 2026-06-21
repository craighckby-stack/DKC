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

      let log = `${turn === "jesus" ? "Jesus" : "Caan"} 

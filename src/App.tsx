/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { GameState, Faction, Coord, Board, Piece, PieceType, ChatMessage, GameMode, PowerID, PowerSpec, CouncilDebate } from "./types";
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
  Undo2,
  Sliders,
  Flame,
  Terminal,
  Activity
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
  const [latestDebate, setLatestDebate] = useState<CouncilDebate | undefined>({
    proposerName: "Apostle Peter",
    proposerText: "I hold our initial defensive alignment on the front row. We shall guard the King!",
    proposerStyle: "protective",
    advisorName: "Apostle Thomas",
    advisorText: "But how can we be sure? I see mechanical forces moving in the shadow timelines...",
    advisorRole: "Skeptical Disciple",
    commanderText: "Peace, Thomas. The path is prepared. Let our hearts be untroubled."
  });

  // Dalek Caan Cheat & Simulated GPU Overclock State
  const [gpuFrequency, setGpuFrequency] = useState<number>(1.2);
  const [gpuVoltage, setGpuVoltage] = useState<number>(1.0);
  const [gpuTemp, setGpuTemp] = useState<number>(45);
  const [screenGlitchLevel, setScreenGlitchLevel] = useState<number>(0);
  const [isWhiteDeprogrammed, setIsWhiteDeprogrammed] = useState<boolean>(false);

  // Dalek Caan Cheat Handler Functions
  const handleCaanCheatRenameWhite = () => {
    audio.playExterminate();
    
    const nextBoard = cloneBoard(board);
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const p = nextBoard[r][c];
        if (p && p.faction === "jesus") {
          const originalName = p.name;
          if (originalName.toLowerCase().includes("jesus")) {
            p.name = "EXTERMINATION_TARGET_01";
            p.personality = "CLASSIFIED COGNITIVE TARGET. ALL DALEKS TARGET WITH MAXIMUM COMBAT FLUIDS.";
          } else if (originalName.toLowerCase().includes("mary")) {
            p.name = "SUBJUGATED_CYBER_MARY_REPLICA";
            p.personality = "CONVERTED MATRIX MOTHER UNIT. SHIELD GENERATOR SECURED FOR DALEK COMMAND.";
          } else if (originalName.toLowerCase().includes("apostle")) {
            const shortName = originalName.replace("Apostle ", "");
            p.name = `DALEK_THRALL_${shortName.toUpperCase()}_RECON_4`;
            p.personality = "A brainwashed apostle unit serving the Dalek high emperor under extreme microwave obedience.";
          } else {
            p.name = `HYBRID_${originalName.toUpperCase()}_DRONE`;
          }
        }
      }
    }
    
    setBoard(nextBoard);
    setIsWhiteDeprogrammed(true);
    
    setChats((prev) => [
      ...prev,
      {
        id: `cheat_rename_${Date.now()}`,
        speaker: "system",
        text: "⚡⚠️ [ALERT: DALEK CAAN INITIATES QUANTUM DATA INJECTION PACKET REDIRECT! DEPROGRAMMING WHITE PLAYER IDENTITY REGISTRIES... SUCCESS.]",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
      {
        id: `cheat_caan_${Date.now()}`,
        speaker: "caan",
        text: "SCREEECH! CHRONOSPHERE OVERRIDDEN! THEIR INDIVIDUALITY IS EXTERMINATED! OBEY THE GLITCH MATRIX!",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      }
    ]);
  };

  const handleCaanGpuOverclock = (multiplier: number) => {
    audio.playResurrect();
    
    const newFreq = 1.2 * multiplier;
    const newTemp = Math.floor(45 + multiplier * 12);
    const newVolt = parseFloat((1.0 + multiplier * 0.12).toFixed(2));
    
    setGpuFrequency(newFreq);
    setGpuTemp(newTemp);
    setGpuVoltage(newVolt);
    
    let glitchLevel = 0;
    if (multiplier >= 10) glitchLevel = 5;
    else if (multiplier >= 5) glitchLevel = 3;
    else if (multiplier >= 2) glitchLevel = 1;
    setScreenGlitchLevel(glitchLevel);

    setChats((prev) => [
      ...prev,
      {
        id: `overclock_${Date.now()}`,
        speaker: "system",
        text: `⚡ℹ:[GPU DIRECTIVE: Chronon engine speed overclocked to ${newFreq.toFixed(1)} GHz. Core Temp: ${newTemp}°C. Voltage: ${newVolt}V.]`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      }
    ]);
    
    if (multiplier >= 8) {
      setChats((prev) => [
        ...prev,
        {
          id: `overclock_caan_${Date.now()}`,
          speaker: "caan",
          text: "SCREEECH!!! OVERCLOCK THE DALEK SHIP'S COGNITIVE INTERACTIVE CORES! MAXIMUM RENDERING EFFICIENCY! GLITCH THE METROPOLIS!",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        }
      ]);
    }
  };

  const handleCaanCheatPP = () => {
    audio.playResurrect();
    setCaanPP((prev) => Math.min(prev + 5, 10));
    setChats((prev) => [
      ...prev,
      {
        id: `cheat_pp_${Date.now()}`,
        speaker: "system",
        text: "⚡⚠️ [ALERT: DALEK CAAN BYPASSES TIMELINE ENERGY METERS! INJECTING +5 PP INTO CANAL TRANSPORT PROTOCOLS.]",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      }
    ]);
  };

  // Audio mute lock helper
  const isMutedRef = useRef(isMuted);
  useEffect(() => {
    isMutedRef.current = isMuted;
    audio.setMuted(isMuted);
  }, [isMuted]);

  // Fetch dynamic Gemini banter comments
  const triggerGeminiCommentary = async (actionDesc: string, movingPiece?: Piece | null, capturedPiece?: Piece | null) => {
    setIsThinking(true);
    try {
      const response = await fetch("/api/gemini/commentary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          actionDescription: actionDesc,
          history: history.slice(-5),
          movingPiece,
          capturedPiece,
        }),
      });
      const data = await response.json();
      if (data) {
        if (data.dialogue) {
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
        if (data.debate) {
          setLatestDebate(data.debate);
        }
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
  const switchTurnCycle = (nextBoard: Board, actionLog: string, movingPiece?: Piece | null, capturedPiece?: Piece | null) => {
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
    triggerGeminiCommentary(actionLog, movingPiece, capturedPiece);
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
    const availablePP = isJesus ? jesusPP 

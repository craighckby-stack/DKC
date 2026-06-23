/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * DARLEK CANN v3.0 - Core Type Definitions
 */

export type Faction = "jesus" | "caan";

export type PieceType = 
  | "p" | "r" | "n" | "b" | "q" | "k" 
  | "wine_knight" 
  | "cyber_drone";

export interface AgentProfile {
  personality: "aggressive" | "cautious" | "balanced" | "erratic" | "protective";
  voiceDesc: string;
  intelligenceTier: 1 | 2 | 3; // For LLM fallback orchestration
  lastThoughtProcess: string;
}

export interface Piece {
  id: string;
  type: PieceType;
  faction: Faction;
  hasMoved: boolean;
  metadata: {
    isAscended?: boolean;
    ascendedTurns?: number;
    isCyber?: boolean;
    name?: string;
    avatar?: string;
  };
  agent: AgentProfile;
}

export type Cell = Piece | null;
export type Board = Cell[][];

export interface Coord { row: number; col: number; }

export type GameMode = "jesus-vs-caan-ai" | "caan-vs-jesus-ai" | "ai-vs-ai" | "local-coop";

export interface ChatMessage {
  id: string;
  speaker: Faction | "system";
  text: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

export interface DebateEngine {
  topic: string;
  proposer: { name: string; text: string; style: string };
  advisor: { name: string; text: string; role: string };
  verdict: string | null;
}

export interface GameState {
  board: Board;
  turn: Faction;
  history: string[];
  resources: { jesusPP: number; caanPP: number };
  mode: GameMode;
  status: "setup" | "playing" | "checkmate" | "stalemate" | "exterminated_king" | "draw";
  selectedCoord: Coord | null;
  validMoves: Coord[];
  activePower: PowerID | null;
  chats: ChatMessage[];
  isThinking: boolean;
  debate: DebateEngine | null;
}

export type PowerID = 
  | "water_to_wine" | "resurrection" | "loaves_and_fishes" | "divine_protection" | "forgiveness"
  | "temporal_shift" | "exterminate" | "cyber_upgrade" | "chronos_distortion" | "temporal_barrier";

export interface PowerSpec {
  id: PowerID;
  name: string;
  cost: number;
  description: string;
  faction: Faction;
  targetType: "friendly" | "enemy" | "empty" | "any" | "captured" | "none";
}

export interface SystemMetrics {
  latencyMs: number;
  tokenUsage: number;
  activeAgents: number;
  memoryPressure: number;
}
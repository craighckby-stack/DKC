/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * @system DARLEK_CANN_V3_CORE
 */

import React, { useMemo } from "react";
import { GameMode, Faction } from "../types";
import { Play, Sparkles, Cpu, Eye, RefreshCw, ShieldAlert, AlertTriangle } from "lucide-react";

interface ControlOverlayProps {
  status: "setup" | "playing" | "checkmate" | "stalemate" | "exterminated_king" | "draw";
  winner: Faction | "draw" | null;
  selectedMode: GameMode;
  onSelectMode: (mode: GameMode) => void;
  onStartGame: () => void;
  onResetGame: () => void;
}

const MODE_CONFIG = [
  { id: "jesus-vs-caan-ai", label: "Play as Jesus", icon: Sparkles, color: "amber", desc: "Miracles vs Predictive Calculations" },
  { id: "caan-vs-jesus-ai", label: "Play as Darlek Caan", icon: Cpu, color: "emerald", desc: "Laser Extermination vs Holy Apostles" },
  { id: "ai-vs-ai", label: "Deity Spectator", icon: Eye, color: "indigo", desc: "AI vs AI with Gemini Commentary" },
  { id: "local-coop", label: "Local Hotseat", icon: RefreshCw, color: "slate", desc: "Pass-and-play local duel" },
] as const;

export function ControlOverlay({ status, winner, selectedMode, onSelectMode, onStartGame, onResetGame }: ControlOverlayProps) {
  const isPlaying = status === "playing";
  const isGameOver = status !== "setup" && status !== "playing";

  const statusDisplay = useMemo(() => ({
    title: isGameOver ? "Tactical Resolution" : "Cosmic Conflict Setup",
    icon: isGameOver ? AlertTriangle : ShieldAlert
  }), [isGameOver]);

  if (isPlaying) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/95 backdrop-blur-xl flex justify-center items-center p-4 font-sans">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col">
        <div className="bg-gradient-to-b from-slate-800 to-slate-900 p-6 border-b border-slate-800 text-center">
          <h1 className="text-2xl font-bold text-white tracking-widest uppercase">{statusDisplay.title}</h1>
        </div>

        <div className="p-6 space-y-6">
          {!isGameOver ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-2">
                {MODE_CONFIG.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => onSelectMode(m.id as GameMode)}
                    className={`p-3 border rounded-xl flex items-center gap-3 transition duration-300 ${
                      selectedMode === m.id 
                        ? `border-${m.color}-500 bg-${m.color}-950/30` 
                        : "border-slate-800 bg-slate-950 hover:border-slate-700"
                    }`}
                  >
                    <m.icon className={`w-5 h-5 text-${m.color}-400`} />
                    <div className="text-left">
                      <div className="text-sm font-bold text-slate-200">{m.label}</div>
                      <div className="text-[10px] text-slate-500">{m.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
              <button 
                onClick={onStartGame} 
                className="w-full py-4 bg-white text-slate-950 font-black rounded-xl hover:bg-slate-200 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4" /> COMMENCE
              </button>
            </div>
          ) : (
            <div className="text-center space-y-4">
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
                <div className="text-xs text-slate-500 uppercase tracking-widest">Resolution Status</div>
                <div className="text-xl font-bold text-white mt-1">{status.replace("_", " ").toUpperCase()}</div>
                {winner && <div className="text-sm text-slate-400 mt-2">Victor: {winner.toUpperCase()}</div>}
              </div>
              <button 
                onClick={onResetGame} 
                className="px-6 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition"
              >
                Restart Cycle
              </button>
            </div>
          )}
        </div>

        <div className="p-4 bg-slate-950/50 border-t border-slate-800 flex items-center justify-center gap-2 text-[10px] text-slate-600">
          <statusDisplay.icon className="w-3 h-3" /> 
          SYSTEM_READY: {status.toUpperCase()}
        </div>
      </div>
    </div>
  );
}
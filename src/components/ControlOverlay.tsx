/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * @system DARLEK_CANN_V3_CORE
 * @module ControlOverlay
 */

import React, { useMemo } from "react";
import { GameMode, Faction } from "../types";
import { Play, Sparkles, Cpu, Eye, RefreshCw, ShieldAlert, AlertTriangle, Terminal } from "lucide-react";

interface ControlOverlayProps {
  status: "setup" | "playing" | "checkmate" | "stalemate" | "exterminated_king" | "draw";
  winner: Faction | "draw" | null;
  selectedMode: GameMode;
  onSelectMode: (mode: GameMode) => void;
  onStartGame: () => void;
  onResetGame: () => void;
}

const MODE_CONFIG = [
  { id: "jesus-vs-caan-ai", label: "Play as Jesus", icon: Sparkles, theme: "amber", desc: "Miracles vs Predictive Calculations" },
  { id: "caan-vs-jesus-ai", label: "Play as Darlek Caan", icon: Cpu, theme: "emerald", desc: "Laser Extermination vs Holy Apostles" },
  { id: "ai-vs-ai", label: "Deity Spectator", icon: Eye, theme: "indigo", desc: "AI vs AI with Gemini Commentary" },
  { id: "local-coop", label: "Local Hotseat", icon: RefreshCw, theme: "slate", desc: "Pass-and-play local duel" },
] as const;

const THEME_MAP: Record<string, string> = {
  amber: "border-amber-500 bg-amber-950/30 text-amber-400",
  emerald: "border-emerald-500 bg-emerald-950/30 text-emerald-400",
  indigo: "border-indigo-500 bg-indigo-950/30 text-indigo-400",
  slate: "border-slate-500 bg-slate-800/30 text-slate-400",
};

export function ControlOverlay({ status, winner, selectedMode, onSelectMode, onStartGame, onResetGame }: ControlOverlayProps) {
  const isPlaying = status === "playing";
  const isGameOver = status !== "setup" && status !== "playing";

  const statusMeta = useMemo(() => ({
    title: isGameOver ? "Tactical Resolution" : "Cosmic Conflict Setup",
    icon: isGameOver ? AlertTriangle : ShieldAlert,
    color: isGameOver ? "text-rose-500" : "text-cyan-400"
  }), [isGameOver]);

  if (isPlaying) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/98 backdrop-blur-2xl flex justify-center items-center p-4 font-sans">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col">
        <div className="bg-slate-950/50 p-6 border-b border-slate-800 flex items-center gap-3">
          <Terminal className={`w-6 h-6 ${statusMeta.color}`} />
          <h1 className="text-xl font-bold text-white tracking-widest uppercase">{statusMeta.title}</h1>
        </div>

        <div className="p-6 space-y-6">
          {!isGameOver ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-2">
                {MODE_CONFIG.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => onSelectMode(m.id as GameMode)}
                    className={`p-4 border rounded-xl flex items-center gap-4 transition-all duration-200 ${
                      selectedMode === m.id 
                        ? THEME_MAP[m.theme] 
                        : "border-slate-800 bg-slate-950 hover:border-slate-700 hover:bg-slate-900"
                    }`}
                  >
                    <m.icon className="w-6 h-6" />
                    <div className="text-left">
                      <div className="text-sm font-bold">{m.label}</div>
                      <div className="text-[10px] opacity-70">{m.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
              <button 
                onClick={onStartGame} 
                className="w-full py-4 bg-white text-slate-950 font-black rounded-xl hover:bg-slate-200 transition-all active:scale-[0.98] flex items-center justify-center gap-2 uppercase tracking-widest"
              >
                <Play className="w-4 h-4" /> Initiate Sequence
              </button>
            </div>
          ) : (
            <div className="text-center space-y-6">
              <div className="p-6 bg-slate-950 rounded-2xl border border-slate-800">
                <div className="text-[10px] text-slate-500 uppercase tracking-[0.2em]">Final Outcome</div>
                <div className="text-2xl font-black text-white mt-2">{status.replace("_", " ").toUpperCase()}</div>
                {winner && <div className="text-sm text-slate-400 mt-3 font-mono">VICTOR: {winner.toUpperCase()}</div>}
              </div>
              <button 
                onClick={onResetGame} 
                className="w-full py-3 bg-slate-800 text-white rounded-xl hover:bg-slate-700 transition font-bold uppercase tracking-widest text-sm"
              >
                Reset System Core
              </button>
            </div>
          )}
        </div>

        <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center justify-center gap-2 text-[9px] text-slate-600 uppercase tracking-widest">
          <statusMeta.icon className="w-3 h-3" /> 
          System Status: {status.toUpperCase()} // Core_ID: DARLEK_CANN_V3
        </div>
      </div>
    </div>
  );
}
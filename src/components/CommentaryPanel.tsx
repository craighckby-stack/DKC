/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from "react";
import { ChatMessage, Faction } from "../types";
import { Sparkles, Cpu, Send, RefreshCw, AlertTriangle } from "lucide-react";

interface CommentaryPanelProps {
  chats: ChatMessage[];
  isThinking: boolean;
  onAskCustomDialogue: (voice: Faction, prompt?: string) => void;
}

export function CommentaryPanel({ chats, isThinking, onAskCustomDialogue }: CommentaryPanelProps) {
  const [customPrompt, setCustomPrompt] = useState("");
  const [targetFaction, setTargetFaction] = useState<Faction>("caan");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [chats, isThinking]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!customPrompt.trim()) return;
    onAskCustomDialogue(targetFaction, customPrompt);
    setCustomPrompt("");
  }, [customPrompt, targetFaction, onAskCustomDialogue]);

  return (
    <div className="flex flex-col bg-slate-900 border border-slate-800 rounded-2xl h-full shadow-2xl overflow-hidden font-sans">
      <div className="bg-slate-950 p-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-2.5 h-2.5 rounded-full ${isThinking ? 'bg-rose-500 animate-ping' : 'bg-emerald-500'} transition-colors`} />
          <span className="font-mono text-[10px] text-slate-400 tracking-widest uppercase">
            {isThinking ? "CALCULATING TEMPORAL DRIFT" : "COSMIC WAVEFEED ACTIVE"}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 p-4 bg-slate-950/40 border-b border-slate-800/50">
        {[ { id: 'jesus', label: 'DIVINE ADVOCATE', color: 'amber' }, { id: 'caan', label: 'TEMPORAL PROPHET', color: 'emerald' } ].map((persona) => (
          <button 
            key={persona.id} 
            onClick={() => setTargetFaction(persona.id as Faction)}
            className={`p-3 border rounded-xl transition-all ${targetFaction === persona.id ? `bg-${persona.color}-950/30 border-${persona.color}-500/50` : 'bg-slate-900/40 border-slate-800'}`}
          >
            <div className={`w-12 h-12 mx-auto rounded-full bg-slate-950 flex items-center justify-center border border-${persona.color}-900/50 mb-2`}>
              {persona.id === 'jesus' ? '✝' : '◉-👁'}
            </div>
            <span className={`block text-[10px] font-mono text-${persona.color}-400`}>{persona.label}</span>
          </button>
        ))}
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
        {chats.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-slate-600 text-xs">
            <RefreshCw className="w-8 h-8 mb-2 opacity-20" />
            Awaiting temporal input...
          </div>
        )}
        {chats.map((msg) => (
          <div key={msg.id} className={`flex flex-col p-3 rounded-xl border ${msg.speaker === 'jesus' ? 'bg-amber-950/10 border-amber-900/20' : 'bg-emerald-950/10 border-emerald-900/20'}`}>
            <span className="text-[9px] font-mono text-slate-500 mb-1">{msg.speaker.toUpperCase()}</span>
            <p className="text-xs text-slate-200">{msg.text}</p>
          </div>
        ))}
        {isThinking && (
          <div className="flex items-center gap-2 text-[10px] text-sky-400 font-mono animate-pulse">
            <AlertTriangle className="w-3 h-3" /> Processing quantum state...
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="bg-slate-950 p-3 border-t border-slate-800 flex gap-2">
        <input
          value={customPrompt}
          onChange={(e) => setCustomPrompt(e.target.value)}
          placeholder={`Whisper to ${targetFaction}...`}
          className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:border-indigo-500 outline-none"
        />
        <button type="submit" className="p-2 bg-indigo-900/50 rounded-lg hover:bg-indigo-800">
          <Send className="w-4 h-4 text-indigo-300" />
        </button>
      </form>
    </div>
  );
}
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * @description DARLEK CANN v3.0 - Temporal Commentary Engine
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { ChatMessage, Faction } from "../types";
import { Sparkles, Cpu, Send, RefreshCw, AlertTriangle, ShieldCheck, Zap } from "lucide-react";

interface CommentaryPanelProps {
  chats: ChatMessage[];
  isThinking: boolean;
  onAskCustomDialogue: (voice: Faction, prompt?: string) => void;
}

const FACTION_CONFIG = {
  jesus: { label: 'DIVINE ADVOCATE', color: 'amber', icon: '✝' },
  caan: { label: 'TEMPORAL PROPHET', color: 'emerald', icon: '◉-👁' }
};

export function CommentaryPanel({ chats, isThinking, onAskCustomDialogue }: CommentaryPanelProps) {
  const [customPrompt, setCustomPrompt] = useState("");
  const [targetFaction, setTargetFaction] = useState<Faction>("caan");
  const [isAutoScrollEnabled, setIsAutoScrollEnabled] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Memory-safe scroll management
  useEffect(() => {
    if (isAutoScrollEnabled && scrollRef.current) {
      const el = scrollRef.current;
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    }
  }, [chats, isThinking, isAutoScrollEnabled]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!customPrompt.trim()) return;
    onAskCustomDialogue(targetFaction, customPrompt);
    setCustomPrompt("");
  }, [customPrompt, targetFaction, onAskCustomDialogue]);

  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
      setIsAutoScrollEnabled(scrollHeight - scrollTop <= clientHeight + 100);
    }
  };

  return (
    <div className="flex flex-col bg-slate-950 border border-slate-800 rounded-2xl h-full shadow-2xl overflow-hidden font-sans">
      <div className="bg-slate-900 p-3 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isThinking ? 'bg-rose-500 animate-ping' : 'bg-emerald-500'} transition-colors`} />
          <span className="font-mono text-[9px] text-slate-400 tracking-widest uppercase">
            {isThinking ? "QUANTUM DRIFT DETECTED" : "SYSTEM STABLE"}
          </span>
        </div>
        <ShieldCheck className="w-3 h-3 text-slate-600" />
      </div>

      <div className="grid grid-cols-2 gap-2 p-3 bg-slate-900/20 border-b border-slate-800">
        {(Object.entries(FACTION_CONFIG) as [Faction, typeof FACTION_CONFIG['caan']][]).map(([id, config]) => (
          <button 
            key={id} 
            onClick={() => setTargetFaction(id)}
            className={`p-2 border rounded-lg transition-all ${targetFaction === id ? `bg-${config.color}-950/20 border-${config.color}-500/30` : 'bg-slate-900 border-slate-800'}`}
          >
            <span className={`block text-[10px] font-mono text-${config.color}-400 mb-1`}>{config.icon} {config.label}</span>
          </button>
        ))}
      </div>

      <div ref={scrollRef} onScroll={handleScroll} className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin">
        {chats.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-slate-700 text-[10px]">
            <Zap className="w-6 h-6 mb-2 opacity-20" />
            Awaiting temporal synchronization...
          </div>
        )}
        {chats.map((msg) => (
          <div key={msg.id} className={`p-3 rounded-lg border ${msg.speaker === 'jesus' ? 'bg-amber-950/5 border-amber-900/10' : 'bg-emerald-950/5 border-emerald-900/10'}`}>
            <div className="flex justify-between mb-1">
              <span className="text-[9px] font-mono text-slate-500">{msg.speaker.toUpperCase()}</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">{msg.text}</p>
          </div>
        ))}
        {isThinking && (
          <div className="flex items-center gap-2 text-[10px] text-rose-400 font-mono">
            <Cpu className="w-3 h-3 animate-spin" /> Analyzing causality chains...
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="bg-slate-900 p-3 border-t border-slate-800">
        <div className="relative">
          <input
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            placeholder={`Inject directive to ${targetFaction}...`}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:border-indigo-500 outline-none transition-all"
          />
          <button type="submit" className="absolute right-2 top-2 p-1 hover:bg-slate-800 rounded">
            <Send className="w-3 h-3 text-slate-400" />
          </button>
        </div>
      </form>
    </div>
  );
}
import React, { useEffect, useCallback } from 'react';
import { Board, Coord, Faction, ChatMessage } from './types';
import { ChessBoard } from './components/ChessBoard';
import { CommentaryPanel } from './components/CommentaryPanel';
import { ControlOverlay } from './components/ControlOverlay';
import { useGameOrchestrator } from './hooks/useGameOrchestrator';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';

/**
 * DARLEK CANN v3.0 // CHESS CORE
 * Orchestrates the epistemic conflict between Jesus and Caan.
 * Architecture: Next.js + Agent Orchestra + State Machine
 */
export default function App() {
  const {
    board,
    turn,
    status,
    pp,
    isThinking,
    chats,
    executeMove,
    resetGame,
    triggerCaanProtocol,
    setStatus
  } = useGameOrchestrator();

  // Global key bindings siphoned from 'sovereign-v86' for system control
  useKeyboardShortcuts({
    Escape: () => setStatus('setup'),
    'c': triggerCaanProtocol,
    'r': resetGame
  });

  const handleMove = useCallback((from: Coord, to: Coord) => {
    if (status !== 'playing' || isThinking) return;
    executeMove(from, to);
  }, [status, isThinking, executeMove]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-rose-500/30">
      <header className="p-4 border-b border-slate-800 flex justify-between items-center backdrop-blur-md">
        <h1 className="text-xl font-bold tracking-tighter text-rose-500">
          DARLEK CANN v3.0 // <span className="text-slate-400">EPISTEMIC_CHESS</span>
        </h1>
        <div className="flex gap-6 text-xs font-mono bg-slate-900 px-3 py-1 rounded border border-slate-800">
          <span className={turn === 'jesus' ? 'text-blue-400' : 'text-slate-600'}>JESUS_PP: {pp.jesus}</span>
          <span className={turn === 'caan' ? 'text-rose-400' : 'text-slate-600'}>CAAN_PP: {pp.caan}</span>
        </div>
      </header>
      
      <main className="flex-1 flex p-6 gap-6 max-w-7xl mx-auto w-full">
        <div className="flex-1 flex items-center justify-center">
          <ChessBoard board={board} onSquareClick={handleMove} />
        </div>
        
        <aside className="w-96 flex flex-col gap-4">
          <CommentaryPanel chats={chats} isThinking={isThinking} />
          <ControlOverlay 
            onReset={resetGame} 
            onCheat={triggerCaanProtocol} 
            disabled={isThinking}
          />
        </aside>
      </main>
    </div>
  );
}

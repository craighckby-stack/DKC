import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameState, Faction, Coord, Board, Piece, PowerSpec, ChatMessage, GameMode, CouncilDebate } from './types';
import { createInitialBoard, cloneBoard, findKing, hasFactionAnyLegalMoves, isFactionsKingInCheck, calculateBestMove, movePieceOnBoard } from './utils/engine';
import { audio } from './utils/audio';
import { ChessBoard } from './components/ChessBoard';
import { CommentaryPanel } from './components/CommentaryPanel';
import { ControlOverlay } from './components/ControlOverlay';
import { useGameOrchestrator } from './hooks/useGameOrchestrator';

export default function App() {
  const [board, setBoard] = useState<Board>(createInitialBoard);
  const [turn, setTurn] = useState<Faction>('jesus');
  const [status, setStatus] = useState<'setup' | 'playing' | 'checkmate' | 'stalemate'>('setup');
  const [pp, setPp] = useState({ jesus: 4, caan: 4 });
  const [isThinking, setIsThinking] = useState(false);
  const [chats, setChats] = useState<ChatMessage[]>([]);
  
  const orchestrator = useGameOrchestrator({
    board, setBoard, turn, setTurn, status, setStatus, pp, setPp, setIsThinking, setChats
  });

  const handleMove = useCallback((from: Coord, to: Coord) => {
    if (status !== 'playing' || isThinking) return;
    orchestrator.executeMove(from, to);
  }, [status, isThinking, orchestrator]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setStatus('setup');
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <header className="p-4 border-b border-slate-800 flex justify-between items-center">
        <h1 className="text-xl font-bold tracking-tighter text-rose-500">DARLEK CANN v3.0 // CHESS CORE</h1>
        <div className="flex gap-4 text-xs font-mono">
          <span>JESUS_PP: {pp.jesus}</span>
          <span>CAAN_PP: {pp.caan}</span>
        </div>
      </header>
      <main className="flex-1 flex p-6 gap-6">
        <ChessBoard board={board} onSquareClick={handleMove} />
        <div className="w-80 flex flex-col gap-4">
          <CommentaryPanel chats={chats} isThinking={isThinking} />
          <ControlOverlay 
            onReset={() => orchestrator.resetGame()} 
            onCheat={orchestrator.triggerCaanProtocol} 
          />
        </div>
      </main>
    </div>
  );
}
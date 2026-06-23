import React, { useMemo } from 'react';
import { Board, Cell, Coord, Faction } from '../types';
import { Shield, Sparkles, Zap, RefreshCw } from 'lucide-react';

interface ChessBoardProps {
  board: Board;
  turn: Faction;
  selectedCoord: Coord | null;
  validMoves: Coord[];
  activePower: string | null;
  onCellClick: (coord: Coord) => void;
  isThinking: boolean;
}

const COL_LABELS = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const ROW_LABELS = ['8', '7', '6', '5', '4', '3', '2', '1'];

const PIECE_SYMBOLS: Record<string, string> = {
  k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟',
  wine_knight: '♞', cyber_drone: '♟'
};

export function ChessBoard({ board, turn, selectedCoord, validMoves, activePower, onCellClick, isThinking }: ChessBoardProps) {
  const moveMap = useMemo(() => {
    const map = new Set<string>();
    validMoves.forEach(m => map.add(`${m.row},${m.col}`));
    return map;
  }, [validMoves]);

  return (
    <div className="relative border-4 border-slate-950 rounded-2xl bg-slate-950/50 p-2 sm:p-4 shadow-[0_10px_40px_rgba(0,0,0,0.8)] overflow-hidden">
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_30%,rgba(0,0,0,0.15))] z-10" />
      
      <div className="grid grid-cols-8 gap-0 border border-slate-900">
        {board.map((rowArr, r) =>
          rowArr.map((cell, c) => {
            const isSelected = selectedCoord?.row === r && selectedCoord?.col === c;
            const isValid = moveMap.has(`${r},${c}`);
            const isDark = (r + c) % 2 === 1;

            return (
              <div
                key={`cell_${r}_${c}`}
                onClick={() => !isThinking && onCellClick({ row: r, col: c })}
                className={`relative aspect-square flex items-center justify-center select-none group transition-all duration-200 ${isDark ? 'bg-[#0b0f19]' : 'bg-[#182030]'} ${isSelected ? 'ring-4 ring-inset ring-amber-500/80 bg-amber-950/20' : ''} ${isValid ? 'cursor-pointer hover:bg-blue-900/20' : ''}`}
              >
                {c === 0 && <span className="absolute top-1 left-1 text-[8px] text-slate-500/60 font-mono font-bold">{ROW_LABELS[r]}</span>}
                {r === 7 && <span className="absolute bottom-1 right-1 text-[8px] text-slate-500/60 font-mono font-bold">{COL_LABELS[c]}</span>}
                
                {isValid && !cell && <div className={`w-3 h-3 rounded-full ${activePower ? 'bg-indigo-500 animate-ping' : 'bg-amber-400/30'}`} />}

                {cell && (
                  <div className={`relative w-10 h-10 sm:w-14 sm:h-14 rounded-full flex items-center justify-center transition-all ${cell.faction === 'jesus' ? 'text-white bg-slate-950/40 border border-white/20' : 'text-slate-950 bg-slate-100 border-2'}`}>
                    {cell.isAscended && <div className="absolute -inset-1.5 border-2 border-white rounded-full animate-pulse bg-white/10"><Shield className="absolute -top-2 w-4 h-4 fill-slate-950" /></div>}
                    {cell.type === 'cyber_drone' && <div className="absolute -inset-1 border border-dashed rounded-full animate-spin"><Zap className="absolute -bottom-2 w-3 h-3 fill-white" /></div>}
                    {cell.type === 'wine_knight' && <div className="absolute -inset-1 border border-white/60 rounded-full"><Sparkles className="absolute -top-2 -right-2 w-3 h-3" /></div>}
                    <span className="text-2xl sm:text-4xl z-10">{PIECE_SYMBOLS[cell.type] || ''}</span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {isThinking && (
        <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="px-6 py-3 bg-slate-900 border border-indigo-500/50 rounded-xl flex items-center gap-3 shadow-2xl">
            <RefreshCw className="w-5 h-5 text-indigo-400 animate-spin" />
            <span className="text-xs text-indigo-200 font-mono tracking-widest">QUANTUM_CALCULATION_ACTIVE</span>
          </div>
        </div>
      )}
    </div>
  );
}
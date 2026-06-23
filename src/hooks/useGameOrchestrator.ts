import { useCallback } from 'react';
import { audio } from '../utils/audio';
import { movePieceOnBoard, cloneBoard } from '../utils/engine';

export const useGameOrchestrator = (ctx: any) => {
  const executeMove = useCallback((from, to) => {
    const nextBoard = movePieceOnBoard(ctx.board, from, to);
    ctx.setBoard(nextBoard);
    ctx.setTurn(ctx.turn === 'jesus' ? 'caan' : 'jesus');
    audio.playMove();
  }, [ctx]);

  const resetGame = useCallback(() => {
    ctx.setBoard(createInitialBoard());
    ctx.setTurn('jesus');
    ctx.setStatus('playing');
  }, [ctx]);

  const triggerCaanProtocol = useCallback(() => {
    audio.playExterminate();
    // Logic for quantum data injection
  }, []);

  return { executeMove, resetGame, triggerCaanProtocol };
};
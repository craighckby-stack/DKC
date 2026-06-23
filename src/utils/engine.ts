/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Board, Cell, Coord, Faction, Piece, PieceType } from "../types";

export const PIECE_VALUES: Record<PieceType, number> = {
  p: 100, n: 320, b: 330, r: 500, q: 900, k: 20000, wine_knight: 500, cyber_drone: 480,
};

const PIECE_CONFIGS: Record<string, any> = {
  caan: {
    0: { 0: { name: "Dalek Sec", personality: "Cold, calculated black commander.", moveStyle: "cautious" }, 4: { name: "Black Dalek Caan", personality: "Quantum Prophet of Skaro.", moveStyle: "balanced" } },
    1: { name: "Dalek Drone", personality: "Standard combat drone.", moveStyle: "aggressive" }
  },
  jesus: {
    7: { 4: { name: "Jesus Christ", personality: "The Savior and Prince of Peace.", moveStyle: "protective" } },
    6: { name: "Apostle", personality: "Devoted disciple of Christ.", moveStyle: "balanced" }
  }
};

export const generateId = (): string => `piece_${Math.random().toString(36).substring(2, 11)}`;

export function initializePieceAgent(piece: Piece, row: number, col: number): Piece {
  const config = PIECE_CONFIGS[piece.faction]?.[row]?.[col] || PIECE_CONFIGS[piece.faction]?.[row] || {};
  return { ...piece, ...config };
}

export function createInitialBoard(): Board {
  const board: Board = Array(8).fill(null).map(() => Array(8).fill(null));
  const setupRow = (row: number, faction: Faction, types: PieceType[]) => {
    types.forEach((type, col) => {
      board[row][col] = initializePieceAgent({ id: `${faction}_${type}_${col}`, type, faction, hasMoved: false }, row, col);
    });
  };
  setupRow(0, "caan", ["r", "n", "b", "q", "k", "b", "n", "r"]);
  setupRow(1, "caan", Array(8).fill("p"));
  setupRow(6, "jesus", Array(8).fill("p"));
  setupRow(7, "jesus", ["r", "n", "b", "q", "k", "b", "n", "r"]);
  return board;
}

export const isWithinBoard = (r: number, c: number): boolean => r >= 0 && r < 8 && c >= 0 && c < 8;

export const cloneBoard = (board: Board): Board => board.map(row => row.map(cell => (cell ? { ...cell } : null)));

export function getBasicMoves(board: Board, from: Coord): Coord[] {
  const piece = board[from.row][from.col];
  if (!piece) return [];
  
  const moves: Coord[] = [];
  const { type, faction } = piece;

  const addMove = (r: number, c: number) => {
    if (isWithinBoard(r, c)) {
      const target = board[r][c];
      if (!target || target.faction !== faction) moves.push({ row: r, col: c });
      return !target;
    }
    return false;
  };

  if (type === "p") {
    const dir = faction === "jesus" ? -1 : 1;
    if (!board[from.row + dir]?.[from.col]) {
      moves.push({ row: from.row + dir, col: from.col });
      if (!piece.hasMoved && !board[from.row + 2 * dir]?.[from.col]) moves.push({ row: from.row + 2 * dir, col: from.col });
    }
    [from.col - 1, from.col + 1].forEach(c => {
      const target = board[from.row + dir]?.[c];
      if (target && target.faction !== faction) moves.push({ row: from.row + dir, col: c });
    });
  }

  if (type === "n" || type === "wine_knight" || type === "cyber_drone") {
    const offsets = [{r:-2,c:-1},{r:-2,c:1},{r:-1,c:-2},{r:-1,c:2},{r:1,c:-2},{r:1,c:2},{r:2,c:-1},{r:2,c:1}];
    offsets.forEach(o => addMove(from.row + o.r, from.col + o.c));
    if (type === "wine_knight") [{r:-1,c:-1},{r:-1,c:1},{r:1,c:-1},{r:1,c:1}].forEach(o => addMove(from.row + o.r, from.col + o.c));
  }

  if (["b", "q", "r"].includes(type)) {
    const dirs = type === "b" ? [{r:-1,c:-1},{r:-1,c:1},{r:1,c:-1},{r:1,c:1}] : type === "r" ? [{r:-1,c:0},{r:1,c:0},{r:0,c:-1},{r:0,c:1}] : [{r:-1,c:-1},{r:-1,c:1},{r:1,c:-1},{r:1,c:1},{r:-1,c:0},{r:1,c:0},{r:0,c:-1},{r:0,c:1}];
    dirs.forEach(d => {
      let r = from.row + d.r, c = from.col + d.c;
      while (addMove(r, c) && board[r][c] === null) { r += d.r; c += d.c; }
    });
  }

  return moves;
}
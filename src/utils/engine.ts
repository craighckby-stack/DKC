import { Board, Coord, Faction, Piece, PieceType } from "../types";

export const PIECE_VALUES: Record<PieceType, number> = {
  p: 100, n: 320, b: 330, r: 500, q: 900, k: 20000, wine_knight: 500, cyber_drone: 480,
};

const REGISTRY: Record<string, Record<string, any>> = {
  caan: { '0,0': { name: "Dalek Sec", moveStyle: "cautious" }, '0,4': { name: "Dalek Caan", moveStyle: "balanced" }, default: { name: "Dalek Drone", moveStyle: "aggressive" } },
  jesus: { '7,4': { name: "Jesus Christ", moveStyle: "protective" }, default: { name: "Apostle", moveStyle: "balanced" } }
};

export const isWithinBoard = (r: number, c: number): boolean => r >= 0 && r < 8 && c >= 0 && c < 8;

export const cloneBoard = (board: Board): Board => board.map(row => row.map(cell => cell ? { ...cell } : null));

export function createInitialBoard(): Board {
  const board: Board = Array.from({ length: 8 }, () => Array(8).fill(null));
  const setup = (row: number, faction: Faction, types: PieceType[]) => {
    types.forEach((type, col) => {
      const config = REGISTRY[faction][`${row},${col}`] || REGISTRY[faction].default;
      board[row][col] = { id: `${faction}_${type}_${col}`, type, faction, hasMoved: false, ...config };
    });
  };
  setup(0, "caan", ["r", "n", "b", "q", "k", "b", "n", "r"]);
  setup(1, "caan", Array(8).fill("p"));
  setup(6, "jesus", Array(8).fill("p"));
  setup(7, "jesus", ["r", "n", "b", "q", "k", "b", "n", "r"]);
  return board;
}

export function getBasicMoves(board: Board, from: Coord): Coord[] {
  const piece = board[from.row][from.col];
  if (!piece) return [];
  const moves: Coord[] = [];
  const { type, faction } = piece;

  const add = (r: number, c: number): boolean => {
    if (!isWithinBoard(r, c)) return false;
    const target = board[r][c];
    if (!target || target.faction !== faction) moves.push({ row: r, col: c });
    return !target;
  };

  if (type === "p") {
    const d = faction === "jesus" ? -1 : 1;
    if (isWithinBoard(from.row + d, from.col) && !board[from.row + d][from.col]) {
      moves.push({ row: from.row + d, col: from.col });
      if (!piece.hasMoved && !board[from.row + 2 * d][from.col]) moves.push({ row: from.row + 2 * d, col: from.col });
    }
    [from.col - 1, from.col + 1].forEach(c => {
      const t = board[from.row + d]?.[c];
      if (t && t.faction !== faction) moves.push({ row: from.row + d, col: c });
    });
  } else if (["n", "wine_knight", "cyber_drone"].includes(type)) {
    [{r:-2,c:-1},{r:-2,c:1},{r:-1,c:-2},{r:-1,c:2},{r:1,c:-2},{r:1,c:2},{r:2,c:-1},{r:2,c:1}].forEach(o => add(from.row + o.r, from.col + o.c));
    if (type === "wine_knight") [{r:-1,c:-1},{r:-1,c:1},{r:1,c:-1},{r:1,c:1}].forEach(o => add(from.row + o.r, from.col + o.c));
  } else {
    const dirs = [...(type !== "r" ? [{r:-1,c:-1},{r:-1,c:1},{r:1,c:-1},{r:1,c:1}] : []), ...(type !== "b" ? [{r:-1,c:0},{r:1,c:0},{r:0,c:-1},{r:0,c:1}] : [])];
    dirs.forEach(d => {
      let r = from.row + d.r, c = from.col + d.c;
      while (add(r, c) && !board[r][c]) { r += d.r; c += d.c; }
    });
  }
  return moves;
}
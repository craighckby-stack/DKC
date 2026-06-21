/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Board, Cell, Coord, Faction, Piece, PieceType } from "../types";

// Generate unique IDs for chess pieces to support key-identities in animations
export function generateId(): string {
  return "piece_" + Math.random().toString(36).substring(2, 11);
}

// Map piece value for AI evaluation
export const PIECE_VALUES: Record<PieceType, number> = {
  p: 100,
  n: 320,
  b: 330,
  r: 500,
  q: 900,
  k: 20000,
  wine_knight: 500, // Jesus upgraded Knight and Bishop slide combination
  cyber_drone: 480, // Dalek upgraded heavy trooper
};

export function createInitialBoard(): Board {
  const board: Board = Array(8)
    .fill(null)
    .map(() => Array(8).fill(null));

  // Initialize Black (Faction: caan, Dalek alliance) on Row 0 and 1
  const caanBackRow: PieceType[] = ["r", "n", "b", "q", "k", "b", "n", "r"];
  for (let col = 0; col < 8; col++) {
    board[0][col] = {
      id: `caan_${caanBackRow[col]}_${col}`,
      type: caanBackRow[col],
      faction: "caan",
      hasMoved: false,
    };
    board[1][col] = {
      id: `caan_p_${col}`,
      type: "p",
      faction: "caan",
      hasMoved: false,
    };
  }

  // Initialize White (Faction: jesus, Divine forces) on Row 6 and 7
  const jesusBackRow: PieceType[] = ["r", "n", "b", "q", "k", "b", "n", "r"];
  for (let col = 0; col < 8; col++) {
    board[6][col] = {
      id: `jesus_p_${col}`,
      type: "p",
      faction: "jesus",
      hasMoved: false,
    };
    board[7][col] = {
      id: `jesus_${jesusBackRow[col]}_${col}`,
      type: jesusBackRow[col],
      faction: "jesus",
      hasMoved: false,
    };
  }

  return board;
}

export function isWithinBoard(row: number, col: number): boolean {
  return row >= 0 && row < 8 && col >= 0 && col < 8;
}

// Deep clone board array
export function cloneBoard(board: Board): Board {
  return board.map((row) =>
    row.map((cell) => (cell ? { ...cell } : null))
  );
}

// Basic move validation ignoring check status (to avoid recursion lock)
export function getBasicMoves(board: Board, from: Coord): Coord[] {
  const moves: Coord[] = [];
  const piece = board[from.row][from.col];
  if (!piece) return [];

  const { type, faction } = piece;

  if (type === "p") {
    const dir = faction === "jesus" ? -1 : 1;
    const startRow = faction === "jesus" ? 6 : 1;

    // Moving forward 1 step
    const nextRow = from.row + dir;
    if (isWithinBoard(nextRow, from.col) && !board[nextRow][from.col]) {
      moves.push({ row: nextRow, col: from.col });

      // Moving forward 2 steps from initial lane
      const doubleRow = from.row + 2 * dir;
      if (from.row === startRow && isWithinBoard(doubleRow, from.col) && !board[doubleRow][from.col]) {
        moves.push({ row: doubleRow, col: from.col });
      }
    }

    // Diagonal captures
    const captureCols = [from.col - 1, from.col + 1];
    for (const c of captureCols) {
      if (isWithinBoard(nextRow, c)) {
        const target = board[nextRow][c];
        if (target && target.faction !== faction) {
          moves.push({ row: nextRow, col: c });
        }
      }
    }
  }

  else if (type === "cyber_drone") {
    // Cyber Drones can move forward 1 step, diagonal forward, OR move like a Knight! (Cyber-upgraded mobility)
    const dir = faction === "caan" ? 1 : -1;
    
    // forward step
    const forwardR = from.row + dir;
    if (isWithinBoard(forwardR, from.col) && !board[forwardR][from.col]) {
      moves.push({ row: forwardR, col: from.col });
    }
    // forward diagonal steps (even as moves or captures)
    for (const dc of [from.col - 1, from.col + 1]) {
      if (isWithinBoard(forwardR, dc)) {
        const tgt = board[forwardR][dc];
        if (!tgt || tgt.faction !== faction) {
          moves.push({ row: forwardR, col: dc });
        }
      }
    }
    // Knight jumps
    const knightOffsets = [
      { r: -2, c: -1 }, { r: -2, c: 1 },
      { r: -1, c: -2 }, { r: -1, c: 2 },
      { r: 1, c: -2 }, { r: 1, c: 2 },
      { r: 2, c: -1 }, { r: 2, c: 1 }
    ];
    for (const off of knightOffsets) {
      const r = from.row + off.r;
      const c = from.col + off.c;
      if (isWithinBoard(r, c)) {
        const target = board[r][c];
        if (!target || target.faction !== faction) {
          moves.push({ row: r, col: c });
        }
      }
    }
  }

  else if (type === "n" || type === "wine_knight") {
    // Normal Knight jumps
    const knightOffsets = [
      { r: -2, c: -1 }, { r: -2, c: 1 },
      { r: -1, c: -2 }, { r: -1, c: 2 },
      { r: 1, c: -2 }, { r: 1, c: 2 },
      { r: 2, c: -1 }, { r: 2, c: 1 }
    ];
    for (const off of knightOffsets) {
      const r = from.row + off.r;
      const c = from.col + off.c;
      if (isWithinBoard(r, c)) {
        const target = board[r][c];
        if (!target || target.faction !== faction) {
          moves.push({ row: r, col: c });
        }
      }
    }

    if (type === "wine_knight") {
      // Wine Knight can also step 1 tile diagonally (combination of Knight + holy Bishop energy)
      const diagOffsets = [
        { r: -1, c: -1 }, { r: -1, c: 1 },
        { r: 1, c: -1 }, { r: 1, c: 1 }
      ];
      for (const off of diagOffsets) {
        const r = from.row + off.r;
        const c = from.col + off.c;
        if (isWithinBoard(r, c)) {
          const target = board[r][c];
          if (!target || target.faction !== faction) {
            moves.push({ row: r, col: c });
          }
        }
      }
    }
  }

  else if (type === "b" || type === "q") {
    // Sliding Diagonally
    const dirs = [
      { r: -1, c: -1 }, { r: -1, c: 1 },
      { r: 1, c: -1 }, { r: 1, c: 1 }
    ];
    for (const d of dirs) {
      let r = from.row + d.r;
      let c = from.col + d.c;
      while (isWithinBoard(r, c)) {
        const target = board[r][c];
        if (!target) {
          moves.push({ row: r, col: c });
        } else {
          if (target.faction !== faction) {
            moves.push({ row: r, col: c });
          }
          break;
        }
        r += d.r;
        c += d.c;
      }
    }
  }

  if (type === "r" || type === "q") {
    // Sliding Orthogonally
    const dirs = [
      { r: -1, c: 0 }, { r: 1, c: 0 },
      { r: 0, c: -1 }, { r: 0, c: 1 }
    ];
    for (const d of dirs) {
      let r = from.row + d.r;
      let c = from.col + d.c;
      while (isWithinBoard(r, c)) {
        const target = board[r][c];
        if (!target) {
          moves.push({ row: r, col: c });
        } else {
          if (target.faction !== faction) {
            moves.push({ row: r, col: c });
          }
          break;
        }
        r += d.r;
        c += d.c;
      }
    }
  }

  else if (type === "k") {
    // King moves 1 grid in all directions
    const kingOffsets = [
      { r: -1, c: -1 }, { r: -1, c: 0 }, { r: -1, c: 1 },
      { r: 0, c: -1 },                  { r: 0, c: 1 },
      { r: 1, c: -1 },  { r: 1, c: 0 },  { r: 1, c: 1 }
    ];
    for (const off of kingOffsets) {
      const r = from.row + off.r;
      const c = from.col + off.c;
      if (isWithinBoard(r, c)) {
        const target = board[r][c];
        if (!target || target.faction !== faction) {
          moves.push({ row: r, col: c });
        }
      }
    }

    // Castling Simplified: King on starting slot, Rook unmoved, empty path
    if (!piece.hasMoved) {
      const r = faction === "jesus" ? 7 : 0;
      if (from.row === r && from.col === 4) {
        // King side castling
        const rookKing = board[r][7];
        if (rookKing && !rookKing.hasMoved && !board[r][5] && !board[r][6]) {
          moves.push({ row: r, col: 6 });
        }
        // Queen side castling
        const rookQueen = board[r][0];
        if (rookQueen && !rookQueen.hasMoved && !board[r][1] && !board[r][2] && !board[r][3]) {
          moves.push({ row: r, col: 2 });
        }
      }
    }
  }

  return moves;
}

// Find king coordinate
export function findKing(board: Board, faction: Faction): Coord | null {
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const cell = board[r][c];
      if (cell && cell.type === "k" && cell.faction === faction) {
        return { row: r, col: c };
      }
    }
  }
  return null;
}

// Verify if the specified faction's King is in check
export function isFactionsKingInCheck(board: Board, faction: Faction): boolean {
  const kingPos = findKing(board, faction);
  if (!kingPos) return false;

  // Scan all cells. If an opponent piece can reach the king's coordinate, the king is under threat.
  const opponentFaction = faction === "jesus" ? "caan" : "jesus";
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (piece && piece.faction === opponentFaction) {
        const moves = getBasicMoves(board, { row: r, col: c });
        if (moves.some((m) => m.row === kingPos.row && m.col === kingPos.col)) {
          return true;
        }
      }
    }
  }

  return false;
}

// Filter moves that would expose or retain check on own king
export function getFullyValidMoves(board: Board, from: Coord): Coord[] {
  const piece = board[from.row][from.col];
  if (!piece) return [];

  const basicMoves = getBasicMoves(board, from);
  const faction = piece.faction;

  return basicMoves.filter((move) => {
    // Clone and execute virtual move
    const testBoard = cloneBoard(board);
    const self = testBoard[from.row][from.col];
    testBoard[from.row][from.col] = null;
    testBoard[move.row][move.col] = self;

    // Handle normal castling repositioning in check-simulation
    if (self && self.type === "k" && Math.abs(move.col - from.col) === 2) {
      const r = faction === "jesus" ? 7 : 0;
      if (move.col === 6) {
        testBoard[r][5] = testBoard[r][7];
        testBoard[r][7] = null;
      } else if (move.col === 2) {
        testBoard[r][3] = testBoard[r][0];
        testBoard[r][0] = null;
      }
    }

    // It is legal ONLY IF the faction's king is NOT left in check.
    return !isFactionsKingInCheck(testBoard, faction);
  });
}

// Apply standard movement or castling
export function movePieceOnBoard(board: Board, from: Coord, to: Coord): Board {
  const newBoard = cloneBoard(board);
  const piece = newBoard[from.row][from.col];
  if (!piece) return board;

  piece.hasMoved = true;
  newBoard[from.row][from.col] = null;

  // Perform castling rook slide
  if (piece.type === "k" && Math.abs(to.col - from.col) === 2) {
    const r = piece.faction === "jesus" ? 7 : 0;
    if (to.col === 6) {
      const rook = newBoard[r][7];
      if (rook) {
        rook.hasMoved = true;
        newBoard[r][5] = rook;
        newBoard[r][7] = null;
      }
    } else if (to.col === 2) {
      const rook = newBoard[r][0];
      if (rook) {
        rook.hasMoved = true;
        newBoard[r][3] = rook;
        newBoard[r][0] = null;
      }
    }
  }

  // Automatic Pawn promotion to Queen when reaching opposite edge
  if (piece.type === "p") {
    const promoRow = piece.faction === "jesus" ? 0 : 7;
    if (to.row === promoRow) {
      piece.type = "q";
    }
  }

  newBoard[to.row][to.col] = piece;
  return newBoard;
}

// Check if any legal moves are possible for a faction
export function hasFactionAnyLegalMoves(board: Board, faction: Faction): boolean {
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (piece && piece.faction === faction) {
        const moves = getFullyValidMoves(board, { row: r, col: c });
        if (moves.length > 0) {
          return true;
        }
      }
    }
  }
  return false;
}

// Count captured pieces per side
export function getCapturedPieces(board: Board): { jesus: PieceType[]; caan: PieceType[] } {
  const counts: Record<Faction, Record<PieceType, number>> = {
    jesus: { p: 8, n: 2, b: 2, r: 2, q: 1, k: 1, wine_knight: 0, cyber_drone: 0 },
    caan: { p: 8, n: 2, b: 2, r: 2, q: 1, k: 1, wine_knight: 0, cyber_drone: 0 },
  };

  // Find remaining on board
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (piece) {
        const t = piece.type;
        const mappedType = t === "wine_knight" ? "n" : t === "cyber_drone" ? "p" : t;
        counts[piece.faction][mappedType]--;
      }
    }
  }

  const result = { jesus: [] as PieceType[], caan: [] as PieceType[] };
  // Fill arrays
  for (const f of ["jesus", "caan"] as Faction[]) {
    const list = f === "jesus" ? result.jesus : result.caan;
    const items = counts[f];
    for (const t in items) {
      const remainingToBeCapturedCount = items[t as PieceType];
      for (let i = 0; i < remainingToBeCapturedCount; i++) {
        list.push(t as PieceType);
      }
    }
  }

  return result;
}

// Evaluation heuristic for the AI
export function evaluateBoardScore(board: Board, faction: Faction): number {
  let score = 0;
  const opp = faction === "jesus" ? "caan" : "jesus";

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const cell = board[r][c];
      if (cell) {
        const val = PIECE_VALUES[cell.type] || 100;
        const positionBonus = (cell.faction === "jesus" ? (7 - r) : r) * 10; // drive pieces forward
        
        if (cell.faction === faction) {
          score += val + positionBonus;
          if (cell.isAscended) score += 150; // value defensive shield
          if (cell.isCyber) score += 200; // value cyber upgrades
        } else {
          score -= (val + positionBonus);
          if (cell.isAscended) score -= 150;
          if (cell.isCyber) score -= 200;
        }
      }
    }
  }

  return score;
}

// Selects the smartest legal chess move using a 1-ply greedy lookahead with tactical heuristic
export function calculateBestMove(board: Board, faction: Faction): { from: Coord; to: Coord; score: number } | null {
  const possibleMoves: { from: Coord; to: Coord; score: number }[] = [];

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (piece && piece.faction === faction) {
        const from = { row: r, col: c };
        const moves = getFullyValidMoves(board, from);

        for (const to of moves) {
          // Simulate and score
          const testBoard = movePieceOnBoard(board, from, to);
          let score = evaluateBoardScore(testBoard, faction);

          // Add heavy weight for straight capture
          const captured = board[to.row][to.col];
          if (captured) {
            score += PIECE_VALUES[captured.type] * 1.5;
          }

          possibleMoves.push({ from, to, score });
        }
      }
    }
  }

  if (possibleMoves.length === 0) return null;

  // Sort descending and select the best, adding light randomization (jitter) for organic play
  possibleMoves.sort((a, b) => b.score - a.score);
  const bestScore = possibleMoves[0].score;
  const candidates = possibleMoves.filter((m) => Math.abs(m.score - bestScore) < 15);

  return candidates[Math.floor(Math.random() * candidates.length)];
}

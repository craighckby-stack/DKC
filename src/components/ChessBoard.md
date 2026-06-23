# ChessBoard Component Architecture

## Overview
High-performance, memoized grid rendering system for the Darlek-Cann-Chess engine. 

## Integration Schema
- **State Management**: Consumes `board` (2D array), `validMoves` (Coord[]), and `isThinking` (boolean).
- **Rendering Strategy**: Utilizes `React.memo` for individual cell pieces to minimize DOM thrashing during high-frequency state updates.
- **Styling**: Tailwind CSS with custom radial gradients and ring-based selection indicators.

## Workflow
1. `moveMap` generation via `useMemo`.
2. Grid iteration with coordinate-based keying.
3. `PieceRenderer` injection for specialized piece logic (Ascension, Cyber-Drone, Wine-Knight).

## Dependencies
- `lucide-react` for iconography.
- `../types` for interface definitions.
# ChessBoard Component Architecture

## Overview
The `ChessBoard` component serves as the primary visual interface for the DARLEK CANN chess engine. It utilizes a memoized grid rendering system to ensure high-performance updates during quantum-state calculations.

## Technical Workflow
1. **State Synchronization**: Receives `board` and `validMoves` from the engine.
2. **Memoization**: `moveMap` is computed via `useMemo` to prevent O(n) lookups during render.
3. **Event Handling**: `handleCellClick` is wrapped in `useCallback` to maintain referential integrity.
4. **Quantum Overlay**: The `isThinking` state triggers a backdrop-blur overlay, preventing user interaction during engine processing.

## Integration Schema
- **Input**: `Board` (2D Array), `Faction`, `Coord` (Selected), `validMoves` (Array).
- **Output**: `onCellClick` (Coord).
- **Styling**: Tailwind CSS with custom radial gradients and pulse animations for 'Ascended' pieces.
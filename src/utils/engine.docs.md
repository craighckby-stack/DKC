# Engine Architecture: DARLEK CANN v3.0

## Overview
This engine implements a high-performance, vector-based movement system for the chess-variant environment. It utilizes a decoupled `ENTITY_MANIFEST` for behavior injection.

## Workflow
1. **Initialization**: `createInitialBoard` hydrates the board state using the `ENTITY_MANIFEST`.
2. **Movement Calculation**: `getBasicMoves` uses a vector-based approach to determine valid paths.
3. **Validation**: All moves are checked against board boundaries and faction-based collision logic.

## Integration
- **Next.js**: Designed for server-side pre-calculation of move sets.
- **State Management**: Compatible with atomic state updates (e.g., Zustand/Recoil).
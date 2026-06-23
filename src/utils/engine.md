# Engine Architectural Blueprint

## Overview
The `engine.ts` module serves as the core state-transition and validation layer for the Chess-based simulation. It utilizes a strategy-based move generation pattern to support non-standard piece types (Cyber Drones, Wine Knights).

## Integration Schema
- **State Management**: Uses immutable board cloning to prevent side-effect pollution.
- **Agent Orchestra**: Piece personalities are injected via `initializePieceAgent` using a lookup-table pattern, allowing for dynamic personality updates without modifying core move logic.
- **Validation**: `getBasicMoves` implements a recursive-safe sliding logic to prevent stack overflows during check-detection cycles.
# Engine Architecture: DARLEK CANN v3.0

## Overview
The engine utilizes a registry-based agent configuration system. 

## Workflow
1. **Initialization**: `createInitialBoard` maps faction-specific agents.
2. **Move Generation**: `getBasicMoves` uses a sliding window strategy for efficiency.
3. **Validation**: `validateAndPush` ensures boundary safety and faction-collision logic.

## Integration
- Connects to `types.ts` for interface definitions.
- Designed for integration with `sovereign-kernel` state management patterns.
# DARLEK CANN v3.0 // CHESS CORE

## Architectural Blueprint
This system implements a dual-agent epistemic debate engine mapped onto a chess board. 

### Core Components
- **Orchestrator**: Central state machine managing the transition between 'setup', 'playing', and 'checkmate'.
- **Epistemic Engine**: Evaluates board states not just by material, but by 'Power Points' (PP) derived from the 'epistemic_debate_engine' repository.
- **Agent Orchestra**: Uses a 3-tier LLM fallback to determine move selection.

### Integration Schema
- `src/hooks/useGameOrchestrator.ts`: The brain. Manages the lifecycle of the game.
- `src/utils/engine.ts`: The logic layer. Handles move validation and board mutation.

### System Constraints
- All moves must be validated against the `Faction` constraints.
- State is immutable; all board updates return a new reference.
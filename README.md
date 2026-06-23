# DARLEK CANN v3.0: Epistemic Debate Engine

## Architecture
- **Core**: Express/Vite Hybrid.
- **Cognitive Layer**: Gemini 1.5 Flash integration with fallback state machine.
- **Integration**: Designed to interface with `Darlek-Caan-Chess` and `epistemic_debate_engine`.

## Workflow
1. Client sends move data.
2. Server validates via `Cognitive Core`.
3. If API is unreachable, `generateFallbackResponse` triggers.
4. Response is returned as structured JSON for UI rendering.
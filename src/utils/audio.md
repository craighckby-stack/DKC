# Audio Engine Architecture (v5.0)

## Overview
Unified synthetic sound synthesis architecture for the DARLEK CANN ecosystem. Designed for low-latency feedback in high-stakes epistemic simulations.

## Integration Schema
- **Singleton Pattern**: `audio` instance is globally accessible.
- **Memory Management**: Automatic node cleanup via `onended` hooks to prevent memory leaks in long-running simulations.
- **Faction-Based Synthesis**: Audio signatures are modulated by `Faction` (Jesus vs Caan) to provide auditory cues for state transitions.

## API Reference
- `playSelect()`: UI interaction feedback.
- `playMove(faction)`: Dynamic frequency mapping based on faction.
- `playExterminate()`: Complex FM synthesis for high-impact events.
- `playVictory()`: Harmonic chord progression.
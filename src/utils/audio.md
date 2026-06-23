# Audio Engine Architecture (v4.0)

## Overview
High-performance synthetic audio synthesis for the DARLEK CANN ecosystem. Utilizes Web Audio API for low-latency feedback.

## Workflow
1. **Initialization**: Lazy-loaded on first user interaction to comply with browser autoplay policies.
2. **Bus Architecture**: All sounds route through a `masterGain` node for global volume control.
3. **Lifecycle**: Nodes are automatically disconnected after playback to prevent memory leaks.

## Integration
Import `audio` from `@/utils/audio`. 
- `audio.playSelect()`: UI interaction feedback.
- `audio.playMove(faction)`: Faction-specific move sounds.
- `audio.playExterminate()`: High-impact event synthesis.
- `audio.playVictory()`: Arpeggiated victory sequence.
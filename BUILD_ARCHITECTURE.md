# DARLEK CANN v3.0 - Build Architecture

## Overview
This system utilizes a highly optimized Vite configuration designed for agent-orchestration. 

## Key Architectural Decisions
1. **Agent-Mode Isolation**: When `DISABLE_HMR` is true, the system enters 'Autonomous Mode', disabling polling and HMR to prevent memory leaks in headless environments.
2. **Core Chunking**: The `src/core` directory is isolated into an `agent-core` chunk to ensure that the primary agent logic is loaded independently of UI components.
3. **Environment Injection**: Build versions and core IDs are injected at compile time to allow for runtime telemetry and version tracking across the swarm.

## Integration Schema
- `@core`: Contains the primary agent logic, state machines, and epistemic engines.
- `@components`: UI layer, strictly decoupled from core logic.
- `@lib`: Shared utilities and quantum-data processing helpers.
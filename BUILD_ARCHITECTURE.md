# DARLEK CANN v3.0 - Architectural Blueprint

## System Overview
This repository functions as the central orchestrator for the DARLEK CANN agent swarm. It utilizes a modular Vite configuration to ensure strict separation between the core logic (`@core`) and the autonomous agent swarm (`@agents`).

## Build Pipeline
- **Transpilation**: ESNext target for maximum performance.
- **Chunking**: Granular separation of `vendor`, `agent-core`, and `agent-swarm` to facilitate hot-swapping of agent logic without full system reloads.
- **Environment**: Injected via `loadEnv` with strict typing enforced by `define` blocks.

## Integration Schema
- **Sovereign-Kernel**: Implements the self-refactoring hooks.
- **SN-OMEGA**: Provides the multi-dimensional analysis interface.
- **Agent Orchestra**: Managed via the `@agents` alias for direct import paths.
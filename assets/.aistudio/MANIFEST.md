# DARLEK CANN v3.0 - SYSTEM MANIFEST

## Overview
This directory serves as the root for AI Studio workspace isolation. It contains the security manifest and architectural blueprints for the DARLEK CANN v3.0 evolution engine.

## Integration Schema
- **Evolution Engine**: Located in `/src/evolution_engine`. Protected by `.gitignore` overrides.
- **Orchestrator**: Located in `/src/orchestrator`. Manages agent swarms.
- **Schema Registry**: `/schemas/` contains the structural definitions for all agent communications.

## Security Protocol
All sensitive environment variables and binary model weights are strictly excluded from version control to prevent leakage of the OMEGA-class intelligence architecture.
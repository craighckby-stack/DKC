import metadata from '../metadata.json';

export const SYSTEM_CONFIG = {
  ...metadata,
  isProduction: process.env.NODE_ENV === 'production',
  getAgentConfig: () => ({
    orchestrator: metadata.architecture.agent_orchestration,
    security: metadata.architecture.security_kernel
  })
};

export type SystemManifest = typeof metadata;
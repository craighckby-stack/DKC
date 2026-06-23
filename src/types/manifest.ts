export interface SystemManifest {
  manifest_version: string;
  system_identity: { name: string; designation: string; version: string; author: string; mode: string };
  architecture: Record<string, string>;
  capabilities: { primary_engine: string; secondary_modules: string[]; hooks: Record<string, boolean> };
  quantum_state_config: { entropy_threshold: number; swarm_node_limit: number; fallback_strategy: string };
  constraints: Record<string, string>;
  deployment: Record<string, any>;
}

export const validateManifest = (data: any): data is SystemManifest => {
  return typeof data.manifest_version === 'string' && !!data.system_identity;
};
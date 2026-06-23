export interface SystemManifest {
  manifest_version: string;
  system_identity: { name: string; designation: string; author: string };
  architecture_blueprint: Record<string, string>;
  capabilities_matrix: {
    primary: string;
    secondary: string[];
    integration_hooks: Record<string, boolean>;
  };
  environment_constraints: { node_min: string; typescript_mode: string; styling: string };
  deployment_schema: Record<string, string>;
}

export const manifest: SystemManifest = require('../metadata.json');
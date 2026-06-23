export interface SystemTelemetry {
  status: 'ONLINE' | 'OFFLINE' | 'CRITICAL';
  timestamp: number;
  nodeId: string;
}

export interface OMEGAConfig {
  version: string;
  mode: 'DEVELOPMENT' | 'PRODUCTION';
  enableTelemetry: boolean;
}
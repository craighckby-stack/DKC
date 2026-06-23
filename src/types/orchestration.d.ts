export interface BootDiagnostic {
  msg: string;
  delay: number;
}

export interface OmegaCoreState {
  isInitialized: boolean;
  swarmStatus: 'idle' | 'syncing' | 'active' | 'error';
  quantumEntropy: number;
}
export interface QuantumState {
  superposition: boolean;
  entanglementId: string | null;
  probabilityAmplitude: number;
}

export interface AgentOrchestrationConfig {
  fallbackChain: string[];
  maxConcurrency: number;
  priorityQueue: boolean;
}
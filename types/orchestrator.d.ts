export type SystemState = "INITIALIZING" | "ACTIVE" | "REFACTORING" | "FALLBACK" | "TERMINATED";

export interface QuantumState {
  readonly entropy: number;
  readonly contextHash: string;
  readonly timestamp: number;
  readonly gravitationalMass: number;
}

export interface KernelPatch {
  id: string;
  targetFile: string;
  diff: string;
  checksum: string;
}

export interface DialogueResponse {
  id: string;
  content: string;
  confidence: number;
  sourceTier: "PRIMARY" | "SECONDARY" | "TERTIARY";
  latency: number;
}

export interface ActionDescription {
  id: string;
  payload: string;
  priority: 0 | 1 | 2;
  contextHash: string;
  quantumSignature: QuantumState;
  metadata?: Record<string, unknown>;
}
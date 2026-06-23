export interface QuantumState {
  superposition: boolean;
  collapseProbability: number;
  entangledWith: string[];
}

export const INITIAL_QUANTUM_STATE: QuantumState = {
  superposition: false,
  collapseProbability: 0.05,
  entangledWith: []
};
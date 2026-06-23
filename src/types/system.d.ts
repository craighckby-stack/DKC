export interface SystemState {
  id: string;
  status: 'active' | 'evolving' | 'dormant' | 'critical';
  swarmNodes: number;
  lastMutation: Date;
  integrityScore: number;
}

export interface AgentTask {
  priority: 1 | 2 | 3 | 4 | 5;
  payload: Record<string, unknown>;
  callback: (result: any) => void;
}
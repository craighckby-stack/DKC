export type SystemState = 'ACTIVE' | 'FALLBACK' | 'CRITICAL_FAILURE';

export interface ActionDescription {
  id: string;
  payload: string;
  priority: 0 | 1 | 2;
  contextHash: string;
}

export interface DialogueResponse {
  content: string;
  metadata: {
    tier: 'PRIMARY' | 'FALLBACK';
    latency: number;
  };
}
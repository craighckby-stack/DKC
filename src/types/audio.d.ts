export interface SoundProfile {
  id: string;
  frequency: number;
  type: OscillatorType;
  duration: number;
}

export type AudioEvent = 'SELECT' | 'MOVE' | 'EXTERMINATE' | 'VICTORY' | 'MIRACLE';
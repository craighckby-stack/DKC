import { QuantumState } from '../types';

/**
 * Unitary-Core implementation for quantum-state context retention.
 * Siphoned from unitary-core repository patterns.
 */
export class QuantumBuffer {
  private buffer: Map<string, QuantumState> = new Map();

  public inject(hash: string, state: QuantumState): void {
    this.buffer.set(hash, state);
  }

  public prune(): void {
    if (this.buffer.size > 1000) {
      const oldest = Array.from(this.buffer.keys())[0];
      this.buffer.delete(oldest);
    }
  }
}
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * @description DARLEK CANN Audio Engine v3.0 - High-Performance Synthetic Sound Synthesis
 */

export type Faction = 'jesus' | 'caan';

interface SoundNodeConfig {
  type: OscillatorType;
  freq: number;
  duration: number;
  gain: number;
}

class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;

  private init(): void {
    if (this.ctx) return;
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioCtx) {
      this.ctx = new AudioCtx();
    }
  }

  private createNode(config: SoundNodeConfig): { osc: OscillatorNode; gain: GainNode } {
    if (!this.ctx) throw new Error('AudioContext not initialized');
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = config.type;
    osc.frequency.setValueAtTime(config.freq, this.ctx.currentTime);
    gain.gain.setValueAtTime(config.gain, this.ctx.currentTime);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    return { osc, gain };
  }

  public setMuted(mute: boolean): void {
    this.isMuted = mute;
    if (!this.ctx) return;
    mute ? this.ctx.suspend() : this.ctx.resume();
  }

  public playSelect(): void {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;
    const { osc, gain } = this.createNode({ type: 'sine', freq: 800, duration: 0.05, gain: 0.05 });
    osc.frequency.exponentialRampToValueAtTime(1200, this.ctx.currentTime + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.05);
  }

  public playMove(faction: Faction): void {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;
    const isJesus = faction === 'jesus';
    const { osc, gain } = this.createNode({
      type: isJesus ? 'sine' : 'sawtooth',
      freq: isJesus ? 440 : 220,
      duration: isJesus ? 0.12 : 0.15,
      gain: isJesus ? 0.12 : 0.08
    });
    osc.frequency.exponentialRampToValueAtTime(isJesus ? 120 : 80, this.ctx.currentTime + (isJesus ? 0.12 : 0.15));
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + (isJesus ? 0.12 : 0.15));
    osc.start();
    osc.stop(this.ctx.currentTime + (isJesus ? 0.12 : 0.15));
  }

  public playExterminate(): void {
    if (this.isMuted || !this.ctx) return;
    this.init();
    const now = this.ctx.currentTime;
    const carrier = this.ctx.createOscillator();
    const mod = this.ctx.createOscillator();
    const modGain = this.ctx.createGain();
    const mainGain = this.ctx.createGain();

    carrier.type = 'sawtooth';
    carrier.frequency.setValueAtTime(180, now);
    carrier.frequency.exponentialRampToValueAtTime(30, now + 0.8);
    mod.frequency.setValueAtTime(140, now);
    modGain.gain.setValueAtTime(400, now);
    mainGain.gain.setValueAtTime(0.2, now);
    mainGain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

    mod.connect(modGain);
    modGain.connect(carrier.frequency);
    carrier.connect(mainGain);
    mainGain.connect(this.ctx.destination);

    carrier.start(); mod.start();
    carrier.stop(now + 0.8); mod.stop(now + 0.8);
  }

  public playVictory(): void {
    if (this.isMuted || !this.ctx) return;
    this.init();
    const now = this.ctx.currentTime;
    [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
      const { osc, gain } = this.createNode({ type: 'sine', freq, duration: 1.5, gain: 0.05 });
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.05, now + i * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
      osc.start();
      osc.stop(now + 1.5);
    });
  }
}

export const audio = new SoundEngine();
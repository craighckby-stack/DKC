/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * @description DARLEK CANN Audio Engine v4.0 - Unified Synthetic Sound Synthesis Architecture
 */

export type Faction = 'jesus' | 'caan';

class AudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private isMuted: boolean = false;

  private getContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
    return this.ctx;
  }

  public setMuted(mute: boolean): void {
    this.isMuted = mute;
    if (this.masterGain) {
      this.masterGain.gain.setValueAtTime(mute ? 0 : 1, this.getContext().currentTime);
    }
  }

  private playTone(freq: number, type: OscillatorType, duration: number, attack: number = 0.01, release: number = 0.1): void {
    if (this.isMuted) return;
    const ctx = this.getContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.1, ctx.currentTime + attack);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(this.masterGain!);

    osc.start();
    osc.stop(ctx.currentTime + duration);
    
    // Cleanup
    setTimeout(() => { osc.disconnect(); gain.disconnect(); }, duration * 1000 + 100);
  }

  public playSelect(): void {
    this.playTone(800, 'sine', 0.05);
  }

  public playMove(faction: Faction): void {
    const isJesus = faction === 'jesus';
    this.playTone(isJesus ? 440 : 220, isJesus ? 'sine' : 'sawtooth', isJesus ? 0.12 : 0.15);
  }

  public playExterminate(): void {
    const ctx = this.getContext();
    const now = ctx.currentTime;
    const carrier = ctx.createOscillator();
    const mod = ctx.createOscillator();
    const modGain = ctx.createGain();
    const mainGain = ctx.createGain();

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
    mainGain.connect(this.masterGain!);

    carrier.start(); mod.start();
    carrier.stop(now + 0.8);
  }

  public playVictory(): void {
    const now = this.getContext().currentTime;
    [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 'sine', 0.5), i * 150);
    });
  }
}

export const audio = new AudioEngine();
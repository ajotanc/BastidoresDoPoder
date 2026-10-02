declare module 'vue-confetti' {
  import type { Plugin } from 'vue';

  export interface ConfettiParticleConfig {
    type?: 'rect' | 'circle' | 'heart' | 'image';
    size?: number;
    dropRate?: number;
    color?: string;
  }

  export interface ConfettiStartOptions {
    canvasId?: string;
    canvasElement?: HTMLCanvasElement;
    particles?: ConfettiParticleConfig[];
    defaultType?: string;
    defaultSize?: number;
    defaultDropRate?: number;
    defaultColors?: string[];
    particlesPerFrame?: number;
    windSpeedMax?: number;
  }

  export class Confetti {
    start(options?: ConfettiStartOptions): void;
    stop(): void;
    remove(): void;
    update(options: Partial<ConfettiStartOptions>): void;
  }

  const VueConfetti: Plugin & { Confetti: typeof Confetti };
  export default VueConfetti;
}

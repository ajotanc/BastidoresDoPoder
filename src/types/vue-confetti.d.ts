declare module 'vue-confetti' {
  export class Confetti {
    start(options: {
      canvasElement: HTMLCanvasElement;
      particlesPerFrame: number;
      particles: { type: 'rect' | 'circle' }[];
      defaultColors: string[];
      defaultSize: number;
      defaultDropRate: number;
      windSpeedMax: number;
    }): void;
    stop(): void;
    remove(): void;
  }
}

import { onBeforeUnmount, watch, type Ref } from 'vue';
import type { GameState } from '@/game/models/gameState';

/** Celebrate the live result once, without replaying when restoring a finished game. */
export function useVictoryCelebration(state: Ref<GameState>) {
  let cleanup: (() => void) | undefined;
  let generation = 0;
  const clear = () => { generation++; cleanup?.(); cleanup = undefined; };
  watch(state, async (next, previous) => {
    if (next.gameId !== previous.gameId || next.phase !== 'FINISHED') { clear(); return; }
    if (previous.phase === 'FINISHED' || !next.winnerPlayerId || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    const current = ++generation;
    try {
      const { Confetti } = await import('vue-confetti');
      if (current !== generation) return;
      const canvas = document.createElement('canvas');
      canvas.setAttribute('aria-hidden', 'true');
      Object.assign(canvas.style, { position: 'fixed', inset: '0', width: '100%', height: '100%', pointerEvents: 'none', zIndex: '60' });
      document.body.append(canvas);
      // vue-confetti only resizes its default canvas. Custom canvases must use
      // CSS-pixel dimensions because particles reset the drawing transform.
      const resize = () => {
        const bounds = canvas.getBoundingClientRect();
        canvas.width = Math.round(bounds.width || window.innerWidth);
        canvas.height = Math.round(bounds.height || window.innerHeight);
      };
      resize();
      const confetti = new Confetti();
      const dispose = () => {
        window.removeEventListener('resize', resize);
        window.visualViewport?.removeEventListener('resize', resize);
        confetti.remove(); canvas.remove();
      };
      cleanup = dispose;
      window.addEventListener('resize', resize);
      window.visualViewport?.addEventListener('resize', resize);
      const mobile = canvas.width < 640;
      confetti.start({ canvasElement: canvas, particlesPerFrame: mobile ? 1 : 1.5,
        particles: [{ type: 'rect' }, { type: 'circle' }],
        defaultColors: ['#e6bf73', '#f3d59a', '#fff3d4'], defaultSize: mobile ? 4 : 5, defaultDropRate: 4,
        windSpeedMax: 2,
      });
      const stopTimer = window.setTimeout(() => confetti.stop(), 2200);
      const removeTimer = window.setTimeout(dispose, 7000);
      cleanup = () => { clearTimeout(stopTimer); clearTimeout(removeTimer); dispose(); };
    } catch { cleanup?.(); /* Celebration must never interrupt the match. */ }
  });
  onBeforeUnmount(clear);
}

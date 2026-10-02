import { onBeforeUnmount, watch, type Ref } from 'vue';
import { Confetti } from 'vue-confetti';
import type { GameState } from '@/game/models/gameState';
import type { ConfettiStartOptions } from 'vue-confetti';

const CONFETTI_DURATION_MS = 3000;
const CONFETTI_FADE_MS = 3000;

/**
 * Paleta oficial de confetes dourados temáticos do Bastidores do Poder.
 */
export const GOLDEN_CONFETTI_COLORS = [
  '#e6bf73',
  '#f3d59a',
  '#fff3d4',
  '#d4a84b',
  '#c9973a',
  '#b8862f'
];

const options: ConfettiStartOptions = {
  particles: [
    { type: 'rect', size: 5 },
  ],
  defaultType: 'rect',
  defaultColors: GOLDEN_CONFETTI_COLORS,
  defaultSize: 5,
  defaultDropRate: 8,
  particlesPerFrame: 3,
  windSpeedMax: 1,
};

let confettiInstance: Confetti | null = null;
let fadeAnimation: Animation | null = null;
let stopTimer: number | undefined;
let removeTimer: number | undefined;

function getConfetti(): Confetti {
  if (!confettiInstance) {
    confettiInstance = new Confetti();
  }
  return confettiInstance;
}

function getConfettiCanvas(): HTMLCanvasElement | null {
  return document.querySelector<HTMLCanvasElement>('#confetti-canvas, canvas[id*="confetti"]');
}

function fitConfettiCanvas(): HTMLCanvasElement | null {
  const canvas = getConfettiCanvas();
  if (!canvas) {
    console.warn('[confetti] canvas não encontrado para ajustar');
    return null;
  }
  fadeAnimation?.cancel();
  fadeAnimation = null;
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  Object.assign(canvas.style, {
    position: 'fixed',
    inset: '0',
    width: '100vw',
    height: '100vh',
    pointerEvents: 'none',
    zIndex: '9999',
    opacity: '1',
  });
  return canvas;
}

function fadeOutConfettiCanvas(): void {
  const canvas = getConfettiCanvas();
  if (!canvas) {
    console.warn('[confetti] canvas não encontrado para o fade');
    return;
  }
  fadeAnimation = canvas.animate?.(
    [{ opacity: 1 }, { opacity: 0 }],
    { duration: CONFETTI_FADE_MS, easing: 'ease-out', fill: 'forwards' },
  ) ?? null;
}

function clearConfettiTimers(): void {
  window.clearTimeout(stopTimer);
  window.clearTimeout(removeTimer);
}

function disposeConfetti(): void {
  clearConfettiTimers();
  fadeAnimation?.cancel();
  fadeAnimation = null;
  try {
    confettiInstance?.stop();
    confettiInstance?.remove();
  } catch (error) {
    if (error instanceof Error) {
      console.warn('[confetti] erro ao descartar:', error.message);
    }
  }
}

/**
 * Dispara a chuva de confetes exclusivamente quadrados nas cores douradas.
 * Pode ser invocada diretamente via window.testConfetti().
 */
export function triggerConfettiCelebration(): void {
  try {
    clearConfettiTimers();
    const confetti = getConfetti();

    // 1º start cria o canvas; ajustamos o tamanho; 2º start mede a largura correta
    confetti.start(options);
    fitConfettiCanvas();
    confetti.stop();
    confetti.start(options);
    fitConfettiCanvas();

    stopTimer = window.setTimeout(fadeOutConfettiCanvas, CONFETTI_DURATION_MS);

    removeTimer = window.setTimeout(() => {
      disposeConfetti();
    }, CONFETTI_DURATION_MS + CONFETTI_FADE_MS);
  } catch (error) {
    if (error instanceof Error) {
      console.error('[confetti] falhou:', error.message);
    }
    disposeConfetti();
  }
}

/**
 * Composable que monitora a partida e celebra a vitória com confetes dourados
 * para todos os jogadores na mesa assim que o jogo é finalizado.
 */
export function useVictoryCelebration(state: Ref<GameState>): void {
  let lastGameId = state.value?.gameId;
  let celebratedGameId: string | null = null;

  watch(
    () => [state.value?.phase, state.value?.winnerPlayerId, state.value?.gameId],
    () => {
      if (!state.value) {
        return;
      }

      const current = state.value;

      // Reinicia o tracking se a partida mudar
      if (current.gameId !== lastGameId) {
        lastGameId = current.gameId;
        celebratedGameId = null;
      }

      if (current.phase !== 'FINISHED') {
        return;
      }

      // Dispara para todos os jogadores na mesa quando a partida for concluída
      if (celebratedGameId === current.gameId) {
        return;
      }

      celebratedGameId = current.gameId;
      triggerConfettiCelebration();
    },
    { immediate: true }
  );

  onBeforeUnmount(disposeConfetti);
}

if (typeof window !== 'undefined') {
  (window as Window & { testConfetti?: () => void }).testConfetti = triggerConfettiCelebration;
}
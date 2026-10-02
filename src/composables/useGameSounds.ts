import { onBeforeUnmount, onMounted, ref, watch, type Ref } from 'vue';
import type { GameState } from '@/game/models/gameState';

const SOUNDS_STORAGE_KEY = 'bdp-sounds';

export interface GameSoundsReturn {
  enabled: Ref<boolean>;
  toggle: () => void;
}

/**
 * Gerenciador de efeitos sonoros sintéticos (Web Audio API) para a mesa de jogo.
 */
export function useGameSounds(state: Ref<GameState>, playerId: Ref<string>): GameSoundsReturn {
  const enabled = ref(true);

  try {
    enabled.value = localStorage.getItem(SOUNDS_STORAGE_KEY) !== 'false';
  } catch {
    // Preferência opcional
  }

  let audio: AudioContext | undefined;

  const unlock = (): void => {
    if (!enabled.value) return;
    try {
      audio ??= new AudioContext();
      if (audio.state === 'suspended') {
        void audio.resume().catch(() => {});
      }
    } catch {
      // Audio é opcional no navegador
    }
  };

  const toggle = (): void => {
    enabled.value = !enabled.value;
    try {
      localStorage.setItem(SOUNDS_STORAGE_KEY, String(enabled.value));
    } catch {
      // Preferência opcional
    }
    if (enabled.value) unlock();
  };

  async function play(notes: number[]): Promise<void> {
    if (!enabled.value) return;
    try {
      audio ??= new AudioContext();
      if (audio.state === 'suspended') {
        await audio.resume().catch(() => {});
      }
      if (audio.state !== 'running') return;

      const context = audio;
      notes.forEach((frequency, index) => {
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        const start = context.currentTime + index * 0.18;

        oscillator.type = 'triangle';
        oscillator.frequency.value = frequency;

        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(0.4, start + 0.015);
        gain.gain.setValueAtTime(0.4, start + 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.3);

        oscillator.connect(gain);
        gain.connect(context.destination);

        oscillator.start(start);
        oscillator.stop(start + 0.32);

        oscillator.onended = () => {
          oscillator.disconnect();
          gain.disconnect();
        };
      });
    } catch {
      // Falha silenciosa de áudio
    }
  }

  // Rastreamento por valores primitivos para evitar falhas com reatividade de objetos mutados
  let lastPhase = state.value?.phase;
  let lastGameId = state.value?.gameId;
  let lastActivePlayerId = state.value?.activePlayerId;
  let lastTurn = state.value?.turn;
  let lastHistoryId = state.value?.history?.[0]?.id;
  let hasPlayedVictoryForGameId: string | null = null;

  watch(
    () => [
      state.value?.phase,
      state.value?.winnerPlayerId,
      state.value?.gameId,
      state.value?.activePlayerId,
      state.value?.turn,
      state.value?.history?.[0]?.id,
    ],
    () => {
      const current = state.value;
      if (!current) return;

      const prevPhase = lastPhase;
      const prevGameId = lastGameId;
      const prevActivePlayerId = lastActivePlayerId;
      const prevTurn = lastTurn;
      const prevHistoryId = lastHistoryId;

      // Atualiza o snapshot para a próxima iteração
      lastPhase = current.phase;
      lastGameId = current.gameId;
      lastActivePlayerId = current.activePlayerId;
      lastTurn = current.turn;
      lastHistoryId = current.history?.[0]?.id;

      if (current.gameId !== prevGameId) {
        hasPlayedVictoryForGameId = null;
      }

      // 1. Fanfarra de Vitória
      if (current.phase === 'FINISHED' && hasPlayedVictoryForGameId !== current.gameId) {
        hasPlayedVictoryForGameId = current.gameId;
        void play([392, 494, 587, 784, 659, 784]);
        return;
      }

      // 2. Notificação de Contestação (Fake News!)
      if (
        current.history?.[0]?.id !== prevHistoryId &&
        current.history?.some((event) => event.type === 'CHALLENGE_DECLARED' && event.id === current.history[0]?.id)
      ) {
        void play([330, 262]);
        return;
      }

      // 3. Vez do jogador agir na rodada
      if (
        current.phase === 'WAITING_ACTION' &&
        current.activePlayerId === playerId.value &&
        (prevPhase !== 'WAITING_ACTION' || prevActivePlayerId !== current.activePlayerId || prevTurn !== current.turn)
      ) {
        void play([440, 554]);
      }
    },
    { immediate: true }
  );

  onMounted(() => {
    unlock();
    document.addEventListener('pointerdown', unlock);
    document.addEventListener('keydown', unlock);
  });

  onBeforeUnmount(() => {
    document.removeEventListener('pointerdown', unlock);
    document.removeEventListener('keydown', unlock);
    void audio?.close().catch(() => {});
  });

  return { enabled, toggle };
}

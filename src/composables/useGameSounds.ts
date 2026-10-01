import { onBeforeUnmount, onMounted, ref, watch, type Ref } from 'vue';
import type { GameState } from '@/game/models/gameState';
const key = 'bdp-sounds';
export function useGameSounds(state: Ref<GameState>, playerId: Ref<string>) {
  const enabled = ref(true);
  try { enabled.value = localStorage.getItem(key) !== 'false'; } catch { /* Optional preference. */ }
  let audio: AudioContext | undefined;
  const unlock = () => {
    if (!enabled.value) return;
    try { audio ??= new AudioContext(); void audio.resume().catch(() => {}); } catch { /* Audio is optional. */ }
  };
  const toggle = () => {
    enabled.value = !enabled.value;
    try { localStorage.setItem(key, String(enabled.value)); } catch { /* Optional preference. */ }
    if (enabled.value) unlock();
  };
  function play(notes: number[]) {
    if (!enabled.value || audio?.state !== 'running') return;
    const context = audio;
    notes.forEach((frequency, index) => {
      const oscillator = context.createOscillator(); const gain = context.createGain();
      const start = context.currentTime + index * 0.18;
      oscillator.type = 'triangle';
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0, start); gain.gain.linearRampToValueAtTime(0.4, start + 0.015);
      gain.gain.setValueAtTime(0.4, start + 0.08); gain.gain.exponentialRampToValueAtTime(0.001, start + 0.3);
      oscillator.connect(gain); gain.connect(context.destination); oscillator.start(start); oscillator.stop(start + 0.32);
      oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
    });
  }
  watch(state, (next, previous) => {
    if (next.gameId !== previous.gameId) return;
    if (next.phase === 'FINISHED' && previous.phase !== 'FINISHED' && next.winnerPlayerId) play([392, 494, 587]);
    else if (next.history[0]?.id !== previous.history[0]?.id && next.history.some(event => event.type === 'CHALLENGE_DECLARED' && !previous.history.some(old => old.id === event.id))) play([330, 262]);
    else if (next.phase === 'WAITING_ACTION' && next.activePlayerId === playerId.value && (previous.phase !== 'WAITING_ACTION' || previous.activePlayerId !== next.activePlayerId || previous.turn !== next.turn)) play([440, 554]);
  });
  onMounted(() => { unlock(); document.addEventListener('pointerdown', unlock); document.addEventListener('keydown', unlock); });
  onBeforeUnmount(() => { document.removeEventListener('pointerdown', unlock); document.removeEventListener('keydown', unlock); void audio?.close().catch(() => {}); });
  return { enabled, toggle };
}

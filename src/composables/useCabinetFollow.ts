import { computed, watch, type Ref } from 'vue';
import type { GameState } from '@/game/models/gameState';

/** Follow the current decision inside the carousel without moving the page. */
export function useCabinetFollow(container: Ref<HTMLElement | null>, state: Ref<GameState>, myPlayerId: Ref<string>, interacting: Ref<boolean>) {
  const focusId = computed(() => {
    const game = state.value;
    const candidates = game.phase === 'FINISHED' ? [game.winnerPlayerId]
      : game.phase === 'WAITING_ACTION' ? [game.activePlayerId]
      : [game.cardChoicePlayerId, game.responsePlayerIds[0], game.pendingAction?.blockedByPlayerId,
        game.pendingAction?.targetPlayerId, game.pendingAction?.sourcePlayerId, game.activePlayerId];
    return candidates.find(id => id && id !== myPlayerId.value && game.players[id]) ?? null;
  });
  watch([container, focusId], ([element, id]) => {
    if (!element || !id || interacting.value) return;
    const card = Array.from(element.querySelectorAll<HTMLElement>('[data-cabinet-id]')).find(item => item.dataset.cabinetId === id);
    if (!card) return;
    const frame = element.getBoundingClientRect();
    const bounds = card.getBoundingClientRect();
    if (bounds.left >= frame.left - 1 && bounds.right <= frame.right + 1) return;
    const left = element.scrollLeft + bounds.left - frame.left - (element.clientWidth - bounds.width) / 2;
    element.scrollTo({ left: Math.max(0, Math.min(left, element.scrollWidth - element.clientWidth)),
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
  }, { flush: 'post' });
  return { focusId };
}

import { ref, readonly } from 'vue';
import type { RoleCard } from '@/types/game';

const isOpen = ref<boolean>(false);
const activeCard = ref<RoleCard | null>(null);

/**
 * Composable para gerenciamento do modal de ampliação (Lightbox) das cartas.
 */
export function useLightbox() {
  /**
   * Abre o modal com os dados da carta selecionada.
   */
  const openCardLightbox = (card: RoleCard): void => {
    activeCard.value = card;
    isOpen.value = true;
  };

  /**
   * Fecha o modal e restaura o scroll do corpo da página.
   */
  const closeCardLightbox = (): void => {
    isOpen.value = false;
    activeCard.value = null;
  };

  return {
    isOpen: readonly(isOpen),
    activeCard: readonly(activeCard),
    openCardLightbox,
    closeCardLightbox,
  };
}

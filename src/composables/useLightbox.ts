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
    if (typeof document !== 'undefined') {
      document.body.classList.add('modal-open');
    }
  };

  /**
   * Fecha o modal e restaura o scroll do corpo da página.
   */
  const closeCardLightbox = (): void => {
    isOpen.value = false;
    activeCard.value = null;
    if (typeof document !== 'undefined') {
      document.body.classList.remove('modal-open');
    }
  };

  return {
    isOpen: readonly(isOpen),
    activeCard: readonly(activeCard),
    openCardLightbox,
    closeCardLightbox,
  };
}

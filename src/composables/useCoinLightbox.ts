import { ref, readonly } from 'vue';
import type { GameCoin } from '@/types/game';

const isOpen = ref<boolean>(false);
const activeCoin = ref<GameCoin | null>(null);

/**
 * Composable para gerenciamento do modal de ampliação (Lightbox) das moedas (Contos).
 */
export function useCoinLightbox() {
  /**
   * Abre o modal com os dados da moeda selecionada.
   */
  const openCoinLightbox = (coin: GameCoin): void => {
    activeCoin.value = coin;
    isOpen.value = true;
    if (typeof document !== 'undefined') {
      document.body.classList.add('modal-open');
    }
  };

  /**
   * Fecha o modal e restaura o scroll do corpo da página.
   */
  const closeCoinLightbox = (): void => {
    isOpen.value = false;
    activeCoin.value = null;
    if (typeof document !== 'undefined') {
      document.body.classList.remove('modal-open');
    }
  };

  return {
    isOpen: readonly(isOpen),
    activeCoin: readonly(activeCoin),
    openCoinLightbox,
    closeCoinLightbox,
  };
}

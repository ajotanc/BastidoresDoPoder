import { describe, it, expect } from 'vitest';
import { useLightbox } from '@/composables/useLightbox';
import { useCoinLightbox } from '@/composables/useCoinLightbox';
import { useActiveSection } from '@/composables/useActiveSection';
import { normalizeSearch } from '@/utils/search';
import { cn } from '@/utils/cn';
import { ROLE_CARDS, GAME_COINS } from '@/constants/gameData';

describe('Composables e Utilitários', () => {
  it('useLightbox deve controlar o estado do modal de cartas', () => {
    const { isOpen, activeCard, openCardLightbox, closeCardLightbox } = useLightbox();

    expect(isOpen.value).toBe(false);
    expect(activeCard.value).toBeNull();

    const testCard = ROLE_CARDS[0];
    if (testCard) {
      openCardLightbox(testCard);
      expect(isOpen.value).toBe(true);
      expect(activeCard.value?.id).toBe(testCard.id);

      closeCardLightbox();
      expect(isOpen.value).toBe(false);
      expect(activeCard.value).toBeNull();
    }
  });

  it('useCoinLightbox deve controlar o estado do modal de moedas', () => {
    const { isOpen, activeCoin, openCoinLightbox, closeCoinLightbox } = useCoinLightbox();

    expect(isOpen.value).toBe(false);
    expect(activeCoin.value).toBeNull();

    const testCoin = GAME_COINS[0];
    if (testCoin) {
      openCoinLightbox(testCoin);
      expect(isOpen.value).toBe(true);
      expect(activeCoin.value?.id).toBe(testCoin.id);

      closeCoinLightbox();
      expect(isOpen.value).toBe(false);
      expect(activeCoin.value).toBeNull();
    }
  });

  it('normalizeSearch deve remover acentos e converter para minúsculas', () => {
    expect(normalizeSearch('Barão')).toBe('barao');
    expect(normalizeSearch('Eleição & Conspiração')).toBe('eleicao & conspiracao');
    expect(normalizeSearch('CORONEL')).toBe('coronel');
  });

  it('cn deve mesclar classes tailwind corretamente', () => {
    const result = cn('px-4 py-2', 'px-6', { 'bg-gold': true, 'bg-red-500': false });
    expect(result).toContain('px-6');
    expect(result).not.toContain('px-4');
    expect(result).toContain('bg-gold');
  });

  it('useActiveSection deve iniciar na primeira seção e permitir ativação de "game"', () => {
    const sectionIds = ['home', 'game', 'cards', 'setup'] as const;
    const { activeSectionId, setActiveSection } = useActiveSection(sectionIds);

    expect(activeSectionId.value).toBe('home');

    setActiveSection('game');
    expect(activeSectionId.value).toBe('game');

    setActiveSection('cards');
    expect(activeSectionId.value).toBe('cards');
  });

  it('ROLE_DISPLAY_NAMES e PLAYABLE_ROLES devem ser canônicos e consistentes com ROLE_CARDS', async () => {
    const { ROLE_DISPLAY_NAMES, PLAYABLE_ROLES } = await import('@/constants/gameData');
    expect(PLAYABLE_ROLES.length).toBe(8);
    expect(PLAYABLE_ROLES).not.toContain('guide');
    expect(ROLE_DISPLAY_NAMES.colonel).toBe('Coronel');
    expect(ROLE_DISPLAY_NAMES.baron).toBe('Barão');
    expect(ROLE_DISPLAY_NAMES.guide).toBe('Guia de Mesa');
  });

  it('Vue Router deve resolver rotas de manual (/), online (/online) e sala (/game/:id)', async () => {
    const router = (await import('@/router')).default;
    await router.push('/');
    expect(router.currentRoute.value.name).toBe('home');

    await router.push('/online');
    expect(router.currentRoute.value.name).toBe('online');

    await router.push('/game/7K3F');
    expect(router.currentRoute.value.name).toBe('game');
    expect(router.currentRoute.value.params.id).toBe('7K3F');

    await router.push('/jogar/7K3F');
    expect(router.currentRoute.value.name).toBe('game');
    expect(router.currentRoute.value.params.id).toBe('7K3F');
  });
});

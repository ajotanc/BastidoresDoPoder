import { describe, it, expect } from 'vitest';
import {
  ROLE_CARDS,
  GAME_COINS,
  GENERAL_ACTIONS,
  SETUP_PLAYERS_TABLE,
  SUPPORT_CARDS_LENGTH,
  SUPPORT_CARDS_PER_ROLE,
  CARDS_LENGTH,
  ICON_LEGEND_ITEMS,
} from '@/constants/gameData';

describe('Constantes e Regras do Jogo', () => {
  it('deve conter 8 personagens e a carta de referência/guia', () => {
    const characterRoles = ROLE_CARDS.filter((c) => c.slug !== 'guide');
    expect(characterRoles).toHaveLength(CARDS_LENGTH);
    expect(CARDS_LENGTH).toBe(8);
  });

  it('deve ter 3 cópias de apoio por personagem, totalizando 24 cartas de apoio', () => {
    expect(SUPPORT_CARDS_PER_ROLE).toBe(3);
    expect(SUPPORT_CARDS_LENGTH).toBe(24);
    const characterRoles = ROLE_CARDS.filter((c) => c.slug !== 'guide');
    expect(characterRoles.length * SUPPORT_CARDS_PER_ROLE).toBe(SUPPORT_CARDS_LENGTH);
  });

  it('cada personagem jogável deve ter propriedades essenciais válidas', () => {
    const characterRoles = ROLE_CARDS.filter((c) => c.slug !== 'guide');
    for (const card of characterRoles) {
      expect(card.id).toBeTruthy();
      expect(card.slug).toBeTruthy();
      expect(card.name).toBeTruthy();
      expect(card.category).toBeTruthy();
      expect(card.copies).toBe('3 cópias');
      expect(card.characterSrc ?? card.iconSrc).toBeTruthy();
      expect(card.rules.length).toBeGreaterThan(0);
    }
  });

  it('deve possuir as 3 moedas oficiais (Contos)', () => {
    expect(GAME_COINS).toHaveLength(3);
    const slugs = GAME_COINS.map((c) => c.slug);
    expect(slugs).toEqual(['bronze', 'silver', 'gold']);

    const values = GAME_COINS.map((c) => c.value);
    expect(values).toEqual([1, 5, 10]);
  });

  it('deve conter as ações gerais obrigatórias', () => {
    const actionNames = GENERAL_ACTIONS.map((a) => a.name);
    expect(actionNames).toContain('Salário Oficial');
    expect(actionNames).toContain('Vaquinha Virtual');
    expect(actionNames).toContain('Impeachment comum');
    expect(actionNames).toContain('Impeachment definitivo');
  });

  it('deve cobrir a tabela de configuração de 3 a 8 jogadores', () => {
    expect(SETUP_PLAYERS_TABLE.length).toBe(6);
    for (const row of SETUP_PLAYERS_TABLE) {
      expect(row.totalDeckCards).toBe(SUPPORT_CARDS_LENGTH);
      expect(row.initialCoins).toBe(2);
      expect(row.cardsPerRole).toBe(SUPPORT_CARDS_PER_ROLE);
    }
  });

  it('ICON_LEGEND_ITEMS deve conter exclusivamente os 8 personagens sem o Guia de Mesa', () => {
    expect(ICON_LEGEND_ITEMS).toHaveLength(8);
    const roles = ICON_LEGEND_ITEMS.map((item) => item.role);
    expect(roles).not.toContain('Guia de Mesa');
  });
});

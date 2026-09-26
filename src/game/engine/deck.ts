import { PLAYABLE_ROLES } from '@/constants/gameData';
import type { CardRef } from '../models/gameState';

export { PLAYABLE_ROLES };

/**
 * Cria o baralho inicial completo com 24 cartas (3 cópias de cada personagem).
 */
export const createInitialDeck = (): CardRef[] => {
  const deck: CardRef[] = [];
  let cardCount = 1;

  for (const role of PLAYABLE_ROLES) {
    for (let copy = 1; copy <= 3; copy++) {
      deck.push({
        id: `card-${role}-${copy}-${cardCount++}`,
        roleSlug: role,
      });
    }
  }

  return shuffleDeck(deck);
};

/**
 * Embaralha as cartas usando algoritmo Fisher-Yates.
 */
export const shuffleDeck = (deck: CardRef[]): CardRef[] => {
  const result = [...deck];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = result[i];
    const target = result[j];
    if (temp && target) {
      result[i] = target;
      result[j] = temp;
    }
  }
  return result;
};

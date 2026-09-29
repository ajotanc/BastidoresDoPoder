import type { GameState, PrivatePlayerView, SupportCard } from '../models/gameState';
import type { RoleSlug } from '@/types/game';
import { PLAYABLE_ROLES, SUPPORT_CARDS_PER_ROLE } from '@/constants/gameData';

export const clamp = (value: number, min = 0, max = 1) => Math.max(min, Math.min(max, value));

/** Beliefs are reconstructed from the recent public feed, never from host secrets. */
export function evaluateTable(state: GameState, view: PrivatePlayerView) {
  const me = state.players[view.playerId]!;
  const hand = view.supports.filter(card => !card.isLost);
  const rivals = state.playerOrder.map(id => state.players[id]!).filter(p => p.isAlive && p.id !== me.id);
  const own = (role: RoleSlug) => hand.filter(card => card.roleSlug === role).length;
  const remaining = (role: RoleSlug) => Math.max(0, SUPPORT_CARDS_PER_ROLE - own(role) - state.discard.filter(card => card.roleSlug === role).length);
  const unknown = PLAYABLE_ROLES.reduce((sum, role) => sum + remaining(role), 0);
  const recent = (id: string) => state.history.filter(event => event.playerId === id);
  const claims = (id: string) => {
    const result: RoleSlug[] = [];
    for (const event of recent(id)) {
      if (event.type === 'PROVED_CARD_REPLACED' || event.type === 'SUPPORT_LOST' || event.type === 'BLUFF_EXPOSED' || (event.type === 'ACTION_RESOLVED' && event.actionType === 'exchange')) break;
      if (event.role && ['ACTION_DECLARED', 'BLOCK_DECLARED'].includes(event.type)) result.push(event.role);
    }
    return result;
  };
  const probability = (id: string, role: RoleSlug, claimed = false): number => {
    const copies = remaining(role);
    if (!copies) return 0;
    const supports = state.players[id]?.activeSupportCount ?? 0;
    let miss = 1;
    for (let n = 0; n < supports; n++) miss *= clamp((unknown - copies - n) / Math.max(1, unknown - n));
    const history = claims(id);
    const count = history.filter(r => r === role).length;
    let belief = 1 - miss;
    if (claimed || count) belief = Math.max(belief, 0.56 + Math.min(count, 3) * 0.09);
    if (new Set(history).size > supports) belief *= 0.72;
    const lies = recent(id).filter(e => e.type === 'BLUFF_EXPOSED').length;
    belief *= Math.pow(0.72, Math.min(lies, 3));
    return clamp(belief, 0, 0.95);
  };
  const threat = (id: string) => {
    const p = state.players[id]!;
    const order = state.playerOrder.filter(pid => state.players[pid]?.isAlive);
    const distance = (order.indexOf(id) - order.indexOf(me.id) + order.length) % order.length;
    return p.coins / 3 + p.activeSupportCount * 0.6 + (p.coins >= 7 ? 1.5 : 0) + (distance === 1 ? 0.5 : 0);
  };
  const attackValue = (id: string) => 5 + threat(id) * 0.7 + (state.players[id]!.activeSupportCount === 1 ? (rivals.length === 1 ? 22 : 7) : 0);
  const lossValue = me.activeSupportCount <= 1 ? 16 : 6;
  const challengeRisk = (role: RoleSlug, eligibleIds = rivals.map(p => p.id)) => {
    if (state.discard.filter(c => c.roleSlug === role).length >= SUPPORT_CARDS_PER_ROLE) return 1;
    let unchallenged = 1;
    for (const rival of rivals) {
      if (!eligibleIds.includes(rival.id)) continue;
      const challenges = recent(rival.id).filter(e => e.type === 'CHALLENGE_DECLARED').length;
      const myLies = recent(me.id).filter(e => e.type === 'BLUFF_EXPOSED').length;
      const consistent = claims(me.id).includes(role) ? -0.04 : 0;
      const rate = clamp(0.12 + challenges * 0.09 + myLies * 0.1 + consistent + (remaining(role) === 1 ? 0.1 : 0), 0.05, 0.75);
      unchallenged *= 1 - rate;
    }
    return 1 - unchallenged;
  };
  const roleValue = (role: RoleSlug) => {
    switch (role) {
      case 'baron': return me.coins < 7 ? 4.5 : 2.5;
      case 'executor': return me.coins >= 3 ? 5 : 3.5;
      case 'colonel': return 2 + Math.max(0, ...rivals.map(p => Math.min(p.coins, 2))) * 0.8;
      case 'lawyer': return 1.5 + Math.max(0, ...rivals.map(p => (p.coins >= 3 ? probability(p.id, 'executor') * 5 : 0)));
      case 'untouchable': return me.coins >= 3 && rivals.some(p => p.coins >= 7) ? 6 : 1.5;
      case 'marketer': return 2.4;
      case 'investigator': return me.coins >= 5 ? 1.5 + Math.max(0, ...rivals.flatMap(p => PLAYABLE_ROLES.map(r => probability(p.id, r)))) * 3 : 1.2;
      case 'coordinator': return rivals.length > 1 ? 2.8 : 1.7;
      default: return 0;
    }
  };
  const handValue = (cards: readonly SupportCard[]) => cards.reduce((sum, card, index) => sum + roleValue(card.roleSlug) * (cards.slice(0, index).some(c => c.roleSlug === card.roleSlug) ? 0.3 : 1), 0);
  return { me, hand, rivals, own, remaining, probability, threat, attackValue, lossValue, challengeRisk, roleValue, handValue };
}

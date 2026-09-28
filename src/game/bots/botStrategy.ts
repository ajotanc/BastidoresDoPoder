import type { ClientCommand } from '../models/commands';
import type { GameState, PrivatePlayerView, ActionType } from '../models/gameState';
import type { RoleSlug } from '@/types/game';
import { getEligibleBlockRoles } from '../engine/rules';
import { BOT_CHALLENGE_PROBABILITY } from '@/constants/gameConfig';
import { SUPPORT_CARDS_PER_ROLE } from '@/constants/gameData';

export function decisionPlayerId(state: GameState): string | undefined {
  if (state.phase === 'WAITING_ACTION') return state.activePlayerId;
  if (state.phase === 'WAITING_CARD_CHOICE' || state.phase === 'WAITING_EXCHANGE_CHOICE') return state.cardChoicePlayerId ?? undefined;
  if (['WAITING_CHALLENGE_ACTION', 'WAITING_BLOCK', 'WAITING_CHALLENGE_BLOCK'].includes(state.phase)) return state.responsePlayerIds[0];
  return undefined;
}

const cardValue: Record<RoleSlug, number> = {
  baron: 8, executor: 7, colonel: 6, lawyer: 5, untouchable: 4, marketer: 3, investigator: 2, coordinator: 1, guide: 0,
};

// Deliberately receives only public information and this bot's own hand.
export function chooseBotCommand(state: GameState, view: PrivatePlayerView, random = Math.random): ClientCommand | null {
  const id = view.playerId;
  const player = state.players[id];
  if (!player?.isAlive || decisionPlayerId(state) !== id) return null;
  const cards = view.supports.filter(card => !card.isLost);
  const has = (role: RoleSlug) => cards.some(card => card.roleSlug === role);
  const ranked = [...cards].sort((a, b) => cardValue[b.roleSlug] - cardValue[a.roleSlug]);
  if (state.phase === 'WAITING_CARD_CHOICE') {
    const card = ranked.at(-1);
    return card ? { type: 'CHOOSE_CARD', payload: { cardId: card.id } } : null;
  }
  if (state.phase === 'WAITING_EXCHANGE_CHOICE') {
    const returned = ranked.slice(-2);
    return returned.length === 2 ? { type: 'CHOOSE_EXCHANGE', payload: { returnedCardIds: [returned[0]!.id, returned[1]!.id] } } : null;
  }
  if (state.phase === 'WAITING_ACTION') {
    const rivals = state.playerOrder.map(other => state.players[other]).filter(other => other && other.id !== id && other.isAlive);
    const target = rivals[Math.floor(random() * rivals.length)];
    if (!target) return null;
    const action = (actionType: ActionType, targeted = false): ClientCommand => ({ type: 'DECLARE_ACTION', payload: { actionType, ...(targeted ? { targetPlayerId: target.id } : {}) } });
    if (player.coins >= 10) return action('definitiveImpeachment', true);
    if (player.coins >= 7) return action('commonImpeachment', true);
    if (has('executor') && player.coins >= 3) return action('execution', true);
    if (has('baron')) return action('slushFund');
    if (has('colonel') && target.coins > 0) return action('extortion', true);
    if (has('marketer') && random() < 0.2) return action('exchange');
    return action('salary');
  }
  const pending = state.pendingAction;
  if (!pending) return null;
  if (state.phase === 'WAITING_BLOCK') {
    const role = getEligibleBlockRoles(state, pending, id).find(has);
    if (role) return { type: 'DECLARE_BLOCK', payload: { claimedBlockRole: role } };
  } else {
    const onBlock = state.phase === 'WAITING_CHALLENGE_BLOCK';
    const role = onBlock ? pending.claimedBlockRole : pending.claimedRole;
    const knownCopies = role ? cards.filter(card => card.roleSlug === role).length + state.discard.filter(card => card.roleSlug === role).length : 0;
    if (role && (knownCopies >= SUPPORT_CARDS_PER_ROLE || random() < BOT_CHALLENGE_PROBABILITY)) {
      return { type: 'DECLARE_CHALLENGE', payload: { isChallengeOnBlock: onBlock } };
    }
  }
  return { type: 'PASS_RESPONSE', payload: { pass: true } };
}

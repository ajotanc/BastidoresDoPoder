import type { ActionType, GameState, PendingAction } from '../models/gameState';
import type { RoleSlug } from '@/types/game';

export const ACTION_TYPES: readonly ActionType[] = [
  'salary', 'crowdfunding', 'slushFund', 'extortion', 'execution', 'exchange',
  'searchWarrant', 'backroomDeal', 'commonImpeachment', 'definitiveImpeachment',
];

export const getBlockRoles = (action: ActionType): readonly RoleSlug[] => {
  switch (action) {
    case 'crowdfunding': return ['baron'];
    case 'extortion': return ['colonel', 'marketer'];
    case 'execution': return ['lawyer'];
    case 'searchWarrant': return ['lawyer', 'colonel'];
    case 'commonImpeachment': return ['untouchable'];
    default: return [];
  }
};

export const getEligibleBlockRoles = (state: GameState, pending: PendingAction, playerId: string): readonly RoleSlug[] => {
  const player = state.players[playerId];
  if (!player?.isAlive || playerId === pending.sourcePlayerId) return [];
  if (pending.actionType !== 'crowdfunding' && pending.targetPlayerId !== playerId) return [];
  if (pending.actionType === 'commonImpeachment' && player.coins < 3) return [];
  return getBlockRoles(pending.actionType);
};

export const clockwiseOpponents = (state: GameState, declarer: string): string[] => {
  const index = state.playerOrder.indexOf(declarer);
  return [...state.playerOrder.slice(index + 1), ...state.playerOrder.slice(0, index)]
    .filter(id => state.players[id]?.isAlive);
};

import type { ClientCommand } from './commands';
import { ACTION_TYPES } from '../engine/rules';
import { PLAYABLE_ROLES } from '@/constants/gameData';

export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
export const isIdentifier = (value: unknown): value is string =>
  typeof value === 'string' && /^[a-zA-Z0-9_-]{1,128}$/.test(value) &&
  !['__proto__', 'constructor', 'prototype'].includes(value);
const isRole = (value: unknown): boolean => PLAYABLE_ROLES.some(role => role === value);

export const isClientCommand = (value: unknown): value is ClientCommand => {
  if (!isRecord(value) || !isRecord(value.payload)) return false;
  const p = value.payload;
  switch (value.type) {
    case 'JOIN_ROOM': return typeof p.name === 'string' && p.name.trim().length > 0 &&
      p.name.length <= 60 && isRole(p.avatarSlug) && isIdentifier(p.reconnectToken);
    case 'RECONNECT': return isIdentifier(p.playerId) && isIdentifier(p.reconnectToken);
    case 'SET_READY': return typeof p.ready === 'boolean';
    case 'START_GAME': return p.settings === undefined;
    case 'DECLARE_ACTION': return ACTION_TYPES.some(action => action === p.actionType) &&
      (p.targetPlayerId === undefined || isIdentifier(p.targetPlayerId)) &&
      (p.secondaryPlayerId === undefined || isIdentifier(p.secondaryPlayerId)) &&
      (p.namedRole === undefined || isRole(p.namedRole));
    case 'DECLARE_BLOCK': return isRole(p.claimedBlockRole);
    case 'DECLARE_CHALLENGE': return typeof p.isChallengeOnBlock === 'boolean';
    case 'PASS_RESPONSE': return p.pass === true;
    case 'CHOOSE_CARD': return isIdentifier(p.cardId);
    case 'CHOOSE_EXCHANGE': return Array.isArray(p.returnedCardIds) && p.returnedCardIds.length === 2 &&
      p.returnedCardIds.every(isIdentifier) && p.returnedCardIds[0] !== p.returnedCardIds[1];
    default: return false;
  }
};

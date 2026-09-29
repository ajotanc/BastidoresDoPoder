import { createPlayerName, characterGender } from '@/utils/playerName';
import { MAX_BOTS_PER_ROOM } from '@/constants/gameConfig';
import { PLAYABLE_ROLES } from '../engine/deck';
import { executeCommand, type AuthoritativeGameState } from '../engine/gameEngine';

export function validateBotCount(count: number): void {
  if (!Number.isInteger(count) || count < 0 || count > MAX_BOTS_PER_ROOM) {
    throw new Error(`Escolha de 1 a ${MAX_BOTS_PER_ROOM} bots.`);
  }
}

export function addBots(initial: AuthoritativeGameState, count: number): AuthoritativeGameState {
  validateBotCount(count);
  let state = initial;
  for (let index = 0; index < count; index++) {
    const id = `bot-${crypto.randomUUID()}`;
    const avatarSlug = PLAYABLE_ROLES[index % PLAYABLE_ROLES.length]!;
    const result = executeCommand(state, { type: 'JOIN_ROOM', payload: {
      name: `${createPlayerName(characterGender(avatarSlug))} (Bot)`,
      avatarSlug, reconnectToken: crypto.randomUUID(),
    } }, id, crypto.randomUUID());
    if (result.rejection) throw new Error(result.rejection.description);
    state = result.nextAuthoritativeState;
    state.publicState.players[id] = { ...state.publicState.players[id]!, isBot: true };
    state = executeCommand(state, { type: 'SET_READY', payload: { ready: true } }, id, crypto.randomUUID()).nextAuthoritativeState;
  }
  return state;
}

import { describe, it, expect } from 'vitest';
import dayjs from 'dayjs';
import { resolveRoomSettings } from '@/game/models/roomSettings';
import { DEFAULT_GAME_SETTINGS } from '@/game/models/gameState';
import { createInitialAuthoritativeState, executeCommand } from '@/game/engine/gameEngine';
import { addBots } from '@/game/bots/createBots';
import { MIN_PLAYERS_TO_START } from '@/constants/gameConfig';

describe('Tempos compartilhados da sala', () => {
  it('usa os padrões quando os campos estão vazios e permite alterar um só', () => {
    expect(resolveRoomSettings({ actionSeconds: '', responseSeconds: ' ' })).toEqual(DEFAULT_GAME_SETTINGS);
    expect(resolveRoomSettings({ actionSeconds: 45 })).toMatchObject({ actionTimeoutMs: 45000, reactionTimeoutMs: DEFAULT_GAME_SETTINGS.reactionTimeoutMs });
  });
  it.each([0, -1, 1.5, NaN, Infinity, 3601, 'abc'])('rejeita o tempo inválido %s', value => {
    expect(() => resolveRoomSettings({ actionSeconds: value })).toThrow();
    expect(() => resolveRoomSettings({ responseSeconds: value })).toThrow();
  });
  it('publica os tempos e aplica prazos personalizados nas ações e respostas', () => {
    const settings = resolveRoomSettings({ actionSeconds: 45, responseSeconds: 12 });
    let state = addBots(createInitialAuthoritativeState('TIME', 'host', 'Host', 'baron', 'token', settings), MIN_PLAYERS_TO_START - 1);
    state = executeCommand(state, { type: 'START_GAME', payload: {} }, 'host', 'start').nextAuthoritativeState;
    expect(state.publicState.settings).toEqual(settings);
    expect(state.publicState.deadlineAt! - dayjs().valueOf()).toBeGreaterThan(44000);
    const result = executeCommand(state, { type: 'DECLARE_ACTION', payload: { actionType: 'slushFund' } }, 'host', 'action');
    expect(result.rejection).toBeUndefined();
    const responseDeadline = result.broadcastPublicState?.deadlineAt ?? 0;
    expect(responseDeadline - dayjs().valueOf()).toBeGreaterThan(11000);
    expect(responseDeadline - dayjs().valueOf()).toBeLessThanOrEqual(12000);
    expect(JSON.parse(JSON.stringify(result.broadcastPublicState)).settings).toEqual(settings);
    expect(settings.choiceTimeoutMs).toBe(12000);
    expect(settings.challengeTimeoutMs).toBe(12000);
  });
});

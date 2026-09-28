import { afterEach, describe, expect, it, vi } from 'vitest';
import { addBots, validateBotCount } from '@/game/bots/createBots';
import { chooseBotCommand, decisionPlayerId } from '@/game/bots/botStrategy';
import { BotController } from '@/game/bots/botController';
import { createInitialAuthoritativeState, executeCommand } from '@/game/engine/gameEngine';
import { BOT_DECISION_DELAY_MS, MAX_BOTS_PER_ROOM } from '@/constants/gameConfig';
import type { GameState, PrivatePlayerView } from '@/game/models/gameState';

const initial = () => createInitialAuthoritativeState('BOTS', 'host', 'Human', 'baron', 'token');
const setup = (count = 2) => {
  const lobby = addBots(initial(), count);
  return executeCommand(lobby, { type: 'START_GAME', payload: {} }, 'host', 'start').nextAuthoritativeState;
};
afterEach(() => vi.useRealTimers());

describe('Bots: cadastro e limites', () => {
  it('não muda a sala quando desativados e deixa bots conectados e prontos', () => {
    expect(addBots(initial(), 0).publicState.playerOrder).toEqual(['host']);
    const state = addBots(initial(), 2);
    const bots = Object.values(state.publicState.players).filter(p => p.isBot);
    expect(bots).toHaveLength(2);
    expect(bots.every(p => p.isReady && p.isConnected && p.name.endsWith('(Bot)'))).toBe(true);
    expect(executeCommand(state, { type: 'START_GAME', payload: {} }, 'host', 'start').rejection).toBeUndefined();
  });
  it.each([-1, 1.5, NaN, Infinity, MAX_BOTS_PER_ROOM + 1])('rejeita quantidade inválida %s', count => {
    expect(() => validateBotCount(count)).toThrow();
  });
  it('respeita a capacidade total da sala', () => {
    const state = addBots(initial(), MAX_BOTS_PER_ROOM);
    const result = executeCommand(state, { type: 'JOIN_ROOM', payload: { name: 'Extra', avatarSlug: 'baron', reconnectToken: 'extra' } }, 'extra', 'join');
    expect(result.rejection?.reason).toBe('ROOM_FULL');
  });
});

describe('Bots: regras e decisões sem acesso às mãos rivais', () => {
  it('obedece impeachment obrigatório e não age fora da vez', () => {
    const state = setup().publicState;
    state.players.host = { ...state.players.host!, coins: 10 };
    const view: PrivatePlayerView = { playerId: 'host', supports: [] };
    expect(chooseBotCommand(state, view, () => 0.5)).toMatchObject({ type: 'DECLARE_ACTION', payload: { actionType: 'definitiveImpeachment' } });
    expect(chooseBotCommand(state, { ...view, playerId: state.playerOrder[1]! })).toBeNull();
  });
  it('bloqueia somente com apoio próprio elegível e passa quando não possui', () => {
    const state = setup().publicState;
    const id = state.playerOrder[1]!;
    const reaction: GameState = { ...state, phase: 'WAITING_BLOCK', responsePlayerIds: [id], pendingAction: { actionType: 'execution', sourcePlayerId: 'host', targetPlayerId: id, costPaid: 3, claimedRole: 'executor' } };
    const view: PrivatePlayerView = { playerId: id, supports: [{ id: 'lawyer-card', roleSlug: 'lawyer', isLost: false }] };
    expect(chooseBotCommand(reaction, view)).toMatchObject({ type: 'DECLARE_BLOCK', payload: { claimedBlockRole: 'lawyer' } });
    expect(chooseBotCommand(reaction, { ...view, supports: [] })).toMatchObject({ type: 'PASS_RESPONSE' });
  });
  it('contesta uma alegação impossível pelas cartas conhecidas', () => {
    const state = setup().publicState;
    const id = state.playerOrder[1]!;
    const reaction: GameState = { ...state, phase: 'WAITING_CHALLENGE_ACTION', responsePlayerIds: [id], pendingAction: { actionType: 'slushFund', sourcePlayerId: 'host', costPaid: 0, claimedRole: 'baron' }, discard: [1, 2, 3].map(i => ({ id: `lost-${i}`, roleSlug: 'baron', lostByPlayerId: 'host', reason: 'lost' })) };
    expect(chooseBotCommand(reaction, { playerId: id, supports: [] }, () => 0.99)).toMatchObject({ type: 'DECLARE_CHALLENGE', payload: { isChallengeOnBlock: false } });
  });
  it('devolve exatamente duas cartas ativas e distintas na troca', () => {
    const state = setup().publicState;
    const view: PrivatePlayerView = { playerId: 'host', supports: [
      { id: 'a', roleSlug: 'baron', isLost: false }, { id: 'b', roleSlug: 'executor', isLost: false },
      { id: 'c', roleSlug: 'marketer', isLost: false }, { id: 'd', roleSlug: 'lawyer', isLost: false },
      { id: 'lost', roleSlug: 'coordinator', isLost: true },
    ] };
    expect(chooseBotCommand({ ...state, phase: 'WAITING_EXCHANGE_CHOICE', cardChoicePlayerId: 'host' }, view)).toEqual({ type: 'CHOOSE_EXCHANGE', payload: { returnedCardIds: ['d', 'c'] } });
  });
  it.each([1, 2, MAX_BOTS_PER_ROOM])('conclui partidas com %s bots sem comando inválido nem perder cartas', count => {
    let seed = 19 + count;
    const random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
    vi.spyOn(Math, 'random').mockImplementation(random);
    try {
      let state = setup(count);
      for (let step = 0; step < 2000 && state.publicState.phase !== 'FINISHED'; step++) {
        const id = decisionPlayerId(state.publicState)!;
        const command = chooseBotCommand(state.publicState, { playerId: id, supports: state.privateHands[id]! }, random);
        expect(command, state.publicState.phase).not.toBeNull();
        const result = executeCommand(state, command!, id, `step-${step}`);
        expect(result.rejection).toBeUndefined();
        state = result.nextAuthoritativeState;
        const cardIds = [...state.deck, ...Object.values(state.privateHands).flat().filter(card => !card.isLost), ...state.publicState.discard].map(card => card.id);
        expect(cardIds).toHaveLength(24);
        expect(new Set(cardIds).size).toBe(24);
      }
      expect(state.publicState.phase).toBe('FINISHED');
      expect(state.publicState.winnerPlayerId).toBeTruthy();
    } finally { vi.restoreAllMocks(); }
  });
});

describe('BotController', () => {
  it('aguarda a vez, cancela decisão obsoleta e para ao encerrar ou destruir', () => {
    vi.useFakeTimers();
    const state = setup().publicState;
    const act = vi.fn();
    const controller = new BotController(act);
    controller.update(state);
    vi.advanceTimersByTime(BOT_DECISION_DELAY_MS * 2);
    expect(act).not.toHaveBeenCalled();
    const botState = { ...state, activePlayerId: state.playerOrder[1]! };
    controller.update(botState);
    controller.update(state);
    vi.advanceTimersByTime(BOT_DECISION_DELAY_MS);
    expect(act).not.toHaveBeenCalled();
    controller.update(botState);
    vi.advanceTimersByTime(BOT_DECISION_DELAY_MS);
    expect(act).toHaveBeenCalledExactlyOnceWith(botState.activePlayerId);
    controller.update(botState);
    controller.update({ ...botState, phase: 'FINISHED' });
    vi.advanceTimersByTime(BOT_DECISION_DELAY_MS);
    expect(act).toHaveBeenCalledTimes(1);
    controller.update(botState);
    controller.stop();
    vi.advanceTimersByTime(BOT_DECISION_DELAY_MS);
    expect(act).toHaveBeenCalledTimes(1);
  });
});

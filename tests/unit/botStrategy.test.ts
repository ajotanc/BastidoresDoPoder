import { describe, expect, it } from 'vitest';
import { createInitialAuthoritativeState } from '@/game/engine/gameEngine';
import { chooseBotCommand } from '@/game/bots/botStrategy';
import { evaluateTable } from '@/game/bots/botEvaluation';
import { BOT_DIFFICULTY_PROFILES } from '@/game/bots/botDifficulty';
import type { GameState, PrivatePlayerView, GameEvent } from '@/game/models/gameState';
import type { RoleSlug } from '@/types/game';

function table(roles: RoleSlug[] = ['executor', 'colonel'], coins = 2, opponents = 1) {
  const base = createInitialAuthoritativeState('TEST', 'me', 'Me', 'baron', 'token').publicState;
  const players: GameState['players'] = { ...base.players, me: { ...base.players.me!, coins, activeSupportCount: roles.length } };
  const ids = Array.from({ length: opponents }, (_, i) => `r${i}`);
  for (const id of ids) players[id] = { ...players.me!, id, name: id, coins: 2, activeSupportCount: 2 };
  const state: GameState = { ...base, phase: 'WAITING_ACTION', players, playerOrder: ['me', ...ids], history: [] };
  const view: PrivatePlayerView = { playerId: 'me', supports: roles.map((roleSlug, i) => ({ id: `card-${i}`, roleSlug, isLost: false })) };
  return { state, view };
}
const event = (type: string, playerId: string, role?: RoleSlug): GameEvent => ({ id: `${type}-${playerId}`, timestamp: 0, importance: 'normal', message: '', type, playerId, role });
const steady = () => 0.99;

describe('Táticas do nível difícil', () => {
  it('garante a vitória com impeachment em vez de arriscar execução bloqueável', () => {
    const { state, view } = table(['executor', 'baron'], 7);
    state.players.r0 = { ...state.players.r0!, activeSupportCount: 1, coins: 2 };
    expect(chooseBotCommand(state, view, steady, 'hard')).toMatchObject({ payload: { actionType: 'commonImpeachment', targetPlayerId: 'r0' } });
  });
  it('preserva a Advogada contra um Executor declarado ao perder um apoio', () => {
    const { state, view } = table(['lawyer', 'baron'], 2);
    state.players.r0 = { ...state.players.r0!, coins: 3 };
    expect(chooseBotCommand({ ...state, history: [event('ACTION_DECLARED', 'r0', 'executor')], phase: 'WAITING_CARD_CHOICE', cardChoicePlayerId: 'me' }, view, steady, 'hard')).toMatchObject({ payload: { cardId: 'card-1' } });
  });
  it('prefere tirar moedas que habilitam um ataque a roubar um rival mais rico', () => {
    const { state, view } = table(['colonel', 'lawyer'], 0, 2);
    state.players.r0 = { ...state.players.r0!, coins: 10 };
    state.players.r1 = { ...state.players.r1!, coins: 12 };
    expect(chooseBotCommand(state, view, steady, 'hard')).toMatchObject({ payload: { actionType: 'extortion', targetPlayerId: 'r0' } });
  });
  it('considera o risco extra de blefar um novo cargo incompatível com suas alegações', () => {
    const { state, view } = table(['executor']);
    const before = evaluateTable(state, view, BOT_DIFFICULTY_PROFILES.hard).challengeRisk('baron');
    expect(evaluateTable({ ...state, history: [event('ACTION_DECLARED', 'me', 'colonel')] }, view, BOT_DIFFICULTY_PROFILES.hard).challengeRisk('baron')).toBeGreaterThan(before);
  });
  it('evita uma contestação que pode perder os dois apoios contra execução', () => {
    const { state, view } = table(['baron', 'coordinator']);
    const reaction: GameState = { ...state, history: [event('BLUFF_EXPOSED', 'r0')], phase: 'WAITING_CHALLENGE_ACTION', responsePlayerIds: ['me'], pendingAction: { actionType: 'execution', sourcePlayerId: 'r0', targetPlayerId: 'me', claimedRole: 'executor', costPaid: 3 } };
    expect(chooseBotCommand(reaction, view, steady, 'intermediate')).toMatchObject({ type: 'DECLARE_CHALLENGE' });
    expect(chooseBotCommand(reaction, view, steady, 'hard')).toMatchObject({ type: 'PASS_RESPONSE' });
  });
});

describe('Decisões estratégicas', () => {
  it('prefere execução barata quando poupar moedas tem maior benefício', () => {
    const { state, view } = table(['executor', 'baron'], 7, 2);
    state.players.r0 = { ...state.players.r0!, coins: 9 };
    expect(chooseBotCommand(state, view, steady)).toMatchObject({ type: 'DECLARE_ACTION', payload: { actionType: 'execution', targetPlayerId: 'r0' } });
  });
  it('prefere garantir a vitória quando o último rival não pode pagar a defesa', () => {
    const { state, view } = table(['executor', 'baron'], 7);
    state.players.r0 = { ...state.players.r0!, activeSupportCount: 1, coins: 2 };
    expect(chooseBotCommand(state, view, steady)).toMatchObject({ payload: { actionType: 'commonImpeachment', targetPlayerId: 'r0' } });
  });
  it('prioriza o adversário com moedas para atacar, não um alvo aleatório', () => {
    const { state, view } = table(['baron', 'executor'], 10, 2);
    state.players.r1 = { ...state.players.r1!, coins: 10 };
    expect(chooseBotCommand(state, view, steady)).toMatchObject({ payload: { actionType: 'definitiveImpeachment', targetPlayerId: 'r1' } });
  });
  it('extorque o rival com moedas e ignora o sem dinheiro', () => {
    const { state, view } = table(['colonel', 'lawyer'], 2, 2);
    state.players.r0 = { ...state.players.r0!, coins: 0 };
    state.players.r1 = { ...state.players.r1!, coins: 6 };
    expect(chooseBotCommand(state, view, steady)).toMatchObject({ payload: { actionType: 'extortion', targetPlayerId: 'r1' } });
  });
  it('blefa Caixa 2 quando o ganho compensa o risco', () => {
    const { state, view } = table(['colonel', 'executor'], 0);
    state.players.r0 = { ...state.players.r0!, coins: 0 };
    expect(chooseBotCommand(state, view, () => 0)).toMatchObject({ payload: { actionType: 'slushFund' } });
  });
  it('evita o mesmo blefe de renda quando arriscaria seu último apoio', () => {
    const { state, view } = table(['executor'], 0);
    state.players.r0 = { ...state.players.r0!, coins: 0 };
    expect(chooseBotCommand(state, view, () => 0)).not.toMatchObject({ payload: { actionType: 'slushFund' } });
  });
  it('blefa defesa para tentar sobreviver a um ataque letal', () => {
    const { state, view } = table(['baron'], 0);
    const reaction: GameState = { ...state, phase: 'WAITING_BLOCK', responsePlayerIds: ['me'], pendingAction: { actionType: 'execution', sourcePlayerId: 'r0', targetPlayerId: 'me', costPaid: 3 } };
    expect(chooseBotCommand(reaction, view, steady)).toMatchObject({ type: 'DECLARE_BLOCK', payload: { claimedBlockRole: 'lawyer' } });
  });
  it('não blefa um cargo cujas três cópias já estão públicas', () => {
    const { state, view } = table(['baron'], 0);
    const reaction: GameState = { ...state, phase: 'WAITING_BLOCK', responsePlayerIds: ['me'], pendingAction: { actionType: 'execution', sourcePlayerId: 'r0', targetPlayerId: 'me', costPaid: 3 }, discard: [1, 2, 3].map(i => ({ id: `lost-${i}`, roleSlug: 'lawyer', lostByPlayerId: 'r0', reason: '' })) };
    expect(chooseBotCommand(reaction, view, steady)).toMatchObject({ type: 'PASS_RESPONSE' });
  });
  it('preserva defesa verdadeira em vez de contestar e arriscar a sobrevivência', () => {
    const { state, view } = table(['lawyer']);
    const reaction: GameState = { ...state, phase: 'WAITING_CHALLENGE_ACTION', responsePlayerIds: ['me'], pendingAction: { actionType: 'execution', sourcePlayerId: 'r0', targetPlayerId: 'me', claimedRole: 'executor', costPaid: 3 } };
    expect(chooseBotCommand(reaction, view, steady)).toMatchObject({ type: 'PASS_RESPONSE' });
  });
  it('mantém diversidade útil em vez de dois Barões na troca', () => {
    const { state, view } = table(['baron', 'baron', 'executor', 'coordinator'], 3);
    state.players.me = { ...state.players.me!, activeSupportCount: 2 };
    const result = chooseBotCommand({ ...state, phase: 'WAITING_EXCHANGE_CHOICE', cardChoicePlayerId: 'me' }, view, steady);
    expect(result?.type).toBe('CHOOSE_EXCHANGE');
    if (result?.type === 'CHOOSE_EXCHANGE') {
      const kept = view.supports.filter(c => !result.payload.returnedCardIds.includes(c.id)).map(c => c.roleSlug);
      expect(kept.sort()).toEqual(['baron', 'executor']);
    }
  });
});

describe('Inferências apenas com informação pública', () => {
  it('diferencia a leitura de histórico entre os três níveis', () => {
    const { state, view } = table();
    const history = [...Array.from({ length: 15 }, () => event('TURN_CHANGED', 'me')), event('ACTION_DECLARED', 'r0', 'baron')];
    const easy = evaluateTable({ ...state, history }, view, BOT_DIFFICULTY_PROFILES.easy);
    const intermediate = evaluateTable({ ...state, history }, view, BOT_DIFFICULTY_PROFILES.intermediate);
    const hard = evaluateTable({ ...state, history }, view, BOT_DIFFICULTY_PROFILES.hard);
    expect(hard.probability('r0', 'baron')).toBeGreaterThan(intermediate.probability('r0', 'baron'));
    expect(easy.probability('r0', 'baron')).toBe(intermediate.probability('r0', 'baron'));
    const recentClaim = { ...state, history: [event('ACTION_DECLARED', 'r0', 'baron')] };
    expect(evaluateTable(recentClaim, view, BOT_DIFFICULTY_PROFILES.intermediate).probability('r0', 'baron')).toBeGreaterThan(evaluateTable(recentClaim, view, BOT_DIFFICULTY_PROFILES.easy).probability('r0', 'baron'));
  });
  it('não aumenta o risco de blefe por um terceiro que não pode contestar', () => {
    const { state, view } = table(['executor', 'colonel'], 2, 2);
    const base = evaluateTable(state, view).challengeRisk('baron', ['r0']);
    const withThird = { ...state, history: Array.from({ length: 5 }, () => event('CHALLENGE_DECLARED', 'r1', 'baron')) };
    expect(evaluateTable(withThird, view).challengeRisk('baron', ['r0'])).toBe(base);
    expect(evaluateTable(withThird, view).challengeRisk('baron')).toBeGreaterThan(base);
  });
  it('lembra alegações e esquece a carta depois de comprovação ou troca', () => {
    const { state, view } = table();
    const claim = event('ACTION_DECLARED', 'r0', 'baron');
    const base = evaluateTable(state, view).probability('r0', 'baron');
    expect(evaluateTable({ ...state, history: [claim] }, view).probability('r0', 'baron')).toBeGreaterThan(base);
    for (const reset of [event('PROVED_CARD_REPLACED', 'r0'), event('SUPPORT_LOST', 'r0'), { ...event('ACTION_RESOLVED', 'r0'), actionType: 'exchange' as const }]) {
      expect(evaluateTable({ ...state, history: [reset, claim] }, view).probability('r0', 'baron')).toBe(base);
    }
  });
  it('fica mais desconfiado de quem foi pego blefando', () => {
    const { state, view } = table();
    const honest = evaluateTable(state, view).probability('r0', 'baron', true);
    const liar = evaluateTable({ ...state, history: [event('BLUFF_EXPOSED', 'r0', 'baron')] }, view).probability('r0', 'baron', true);
    expect(liar).toBeLessThan(honest);
  });
  it('evita blefar contra jogadores que contestam frequentemente', () => {
    const { state, view } = table();
    const usual = evaluateTable(state, view).challengeRisk('baron');
    const suspicious = evaluateTable({ ...state, history: Array.from({ length: 4 }, () => event('CHALLENGE_DECLARED', 'r0', 'baron')) }, view).challengeRisk('baron');
    expect(suspicious).toBeGreaterThan(usual);
  });
});

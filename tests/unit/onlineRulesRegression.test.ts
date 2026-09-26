import { describe, it, expect } from 'vitest';
import { createInitialAuthoritativeState, executeCommand, executeTimeout, type AuthoritativeGameState } from '@/game/engine/gameEngine';
import { createInitialDeck, PLAYABLE_ROLES } from '@/game/engine/deck';
import type { ClientCommand } from '@/game/models/commands';
import type { ActionType } from '@/game/models/gameState';
import type { RoleSlug } from '@/types/game';

const run = (s: AuthoritativeGameState, command: ClientCommand, id = 'a') => {
  const result = executeCommand(s, command, id, crypto.randomUUID());
  expect(result.rejection).toBeUndefined();
  return result.nextAuthoritativeState;
};
const pass = (s: AuthoritativeGameState) => run(s, { type: 'PASS_RESPONSE', payload: { pass: true } }, s.publicState.responsePlayerIds[0]);
const passWindow = (s: AuthoritativeGameState) => {
  const phase = s.publicState.phase;
  while (s.publicState.phase === phase && s.publicState.responsePlayerIds.length) s = pass(s);
  return s;
};
const choose = (s: AuthoritativeGameState) => {
  const id = s.publicState.cardChoicePlayerId!;
  return run(s, { type: 'CHOOSE_CARD', payload: { cardId: s.privateHands[id]!.find(card => !card.isLost)!.id } }, id);
};
const action = (s: AuthoritativeGameState, actionType: ActionType) => run(s, {
  type: 'DECLARE_ACTION', payload: { actionType, targetPlayerId: 'b', namedRole: 'baron' },
});
function setup(hands: RoleSlug[][] = [['executor', 'coordinator'], ['baron', 'marketer'], ['colonel', 'investigator']]) {
  let s = createInitialAuthoritativeState('AUDIT', 'a', 'Ana', 'executor', 'token-a');
  for (let i = 1; i < hands.length; i++) {
    const id = String.fromCharCode(97 + i);
    s = run(s, { type: 'JOIN_ROOM', payload: { name: id, avatarSlug: 'baron', reconnectToken: `token-${id}` } }, id);
    s = run(s, { type: 'SET_READY', payload: { ready: true } }, id);
  }
  s = run(s, { type: 'START_GAME', payload: {} });
  const deck = createInitialDeck();
  hands.forEach((roles, i) => {
    const id = String.fromCharCode(97 + i);
    s.privateHands[id] = roles.map(role => {
      const index = deck.findIndex(card => card.roleSlug === role);
      expect(index).toBeGreaterThanOrEqual(0);
      return { ...deck.splice(index, 1)[0]!, isLost: false };
    });
    s.publicState.players[id] = { ...s.publicState.players[id]!, coins: 7, activeSupportCount: roles.length };
  });
  s.deck = deck;
  s.publicState = { ...s.publicState, deckCount: deck.length };
  return s;
}

describe('Regressões das regras online', () => {
  it('passa somente a oportunidade do jogador atual e rejeita fora de ordem', () => {
    let s = action(setup(), 'execution');
    const original = JSON.stringify(s.publicState);
    for (const id of ['a', 'c', 'unknown']) {
      expect(executeCommand(s, { type: 'PASS_RESPONSE', payload: { pass: true } }, id, 'bad').rejection).toBeDefined();
    }
    expect(JSON.stringify(s.publicState)).toBe(original);
    s = pass(s);
    expect(s.publicState.phase).toBe('WAITING_CHALLENGE_ACTION');
    expect(s.publicState.responsePlayerIds).toEqual(['c']);
    expect(executeCommand(s, { type: 'DECLARE_CHALLENGE', payload: { isChallengeOnBlock: false } }, 'b', 'late').rejection).toBeDefined();
    s = pass(s);
    expect(s.publicState.phase).toBe('WAITING_BLOCK');
    expect(s.publicState.responsePlayerIds).toEqual(['b']);
  });

  it.each(['b', 'c'])('preserva defesa quando %s perde desafio contra Executor verdadeiro', challenger => {
    let s = action(setup(), 'execution');
    if (challenger === 'c') s = pass(s);
    s = run(s, { type: 'DECLARE_CHALLENGE', payload: { isChallengeOnBlock: false } }, challenger);
    s = choose(s);
    expect(s.publicState.phase).toBe('WAITING_BLOCK');
    expect(s.publicState.responsePlayerIds).toEqual(['b']);
    expect(s.publicState.players[challenger]!.activeSupportCount).toBe(1);
    s = run(s, { type: 'DECLARE_BLOCK', payload: { claimedBlockRole: 'lawyer' } }, 'b');
    s = passWindow(s);
    expect(s.publicState.phase).toBe('WAITING_ACTION');
    expect(s.publicState.players.b!.activeSupportCount).toBe(challenger === 'b' ? 1 : 2);
  });

  it.each([['execution', 'lawyer'], ['commonImpeachment', 'untouchable']] as const)(
    'bloqueio falso de %s não cancela a segunda perda', (attack, defense) => {
      let s = action(setup(), attack);
      if (s.publicState.phase === 'WAITING_CHALLENGE_ACTION') s = passWindow(s);
      s = run(s, { type: 'DECLARE_BLOCK', payload: { claimedBlockRole: defense } }, 'b');
      s = pass(s); // C tem prioridade antes de Ana.
      s = run(s, { type: 'DECLARE_CHALLENGE', payload: { isChallengeOnBlock: true } }, 'a');
      s = choose(s);
      expect(s.publicState.players.b!.activeSupportCount).toBe(0);
      expect(s.publicState.players.b!.isAlive).toBe(false);
      expect(s.publicState.activePlayerId).toBe('c');
      expect(s.publicState.players.a!.coins).toBe(attack === 'execution' ? 4 : 0);
      expect(s.publicState.players.b!.coins).toBe(defense === 'untouchable' ? 4 : 7);
    });

  it('bloqueio verdadeiro cancela o ataque, mas o desafiante perde apoio', () => {
    let s = passWindow(action(setup([['executor', 'baron'], ['lawyer', 'baron'], ['colonel', 'marketer']]), 'execution'));
    s = run(s, { type: 'DECLARE_BLOCK', payload: { claimedBlockRole: 'lawyer' } }, 'b');
    s = run(s, { type: 'DECLARE_CHALLENGE', payload: { isChallengeOnBlock: true } }, 'c');
    s = choose(s);
    expect(s.publicState.players.b!.activeSupportCount).toBe(2);
    expect(s.publicState.players.c!.activeSupportCount).toBe(1);
    expect(s.publicState.phase).toBe('WAITING_ACTION');
  });

  it('ação falsa é cancelada sem reembolsar o custo', () => {
    let s = action(setup([['baron', 'marketer'], ['lawyer', 'colonel'], ['investigator', 'executor']]), 'execution');
    s = run(s, { type: 'DECLARE_CHALLENGE', payload: { isChallengeOnBlock: false } }, 'b');
    s = choose(s);
    expect(s.publicState.players.a!.coins).toBe(4);
    expect(s.publicState.players.a!.activeSupportCount).toBe(1);
    expect(s.publicState.players.b!.activeSupportCount).toBe(2);
    expect(s.publicState.phase).toBe('WAITING_ACTION');
  });

  it('encerra imediatamente ao restar um vivo, antes da reposição ou efeito', () => {
    let s = action(setup([['executor', 'baron'], ['marketer']]), 'execution');
    const hand = s.privateHands.a;
    s = run(s, { type: 'DECLARE_CHALLENGE', payload: { isChallengeOnBlock: false } }, 'b');
    expect(s.publicState.phase).toBe('FINISHED');
    expect(s.publicState.deadlineAt).toBeNull();
    expect(s.publicState.pendingAction).toBeNull();
    expect(s.privateHands.a).toEqual(hand);
  });

  it('alvo eliminado no desafio não é atacado de novo', () => {
    let s = action(setup([['executor', 'baron'], ['marketer'], ['colonel', 'lawyer']]), 'execution');
    s = run(s, { type: 'DECLARE_CHALLENGE', payload: { isChallengeOnBlock: false } }, 'b');
    expect(s.publicState.phase).toBe('WAITING_ACTION');
    expect(s.publicState.players.b!.lostCards).toHaveLength(1);
    expect(s.publicState.activePlayerId).toBe('c');
  });

  it('cancela Acordo para ambos se beneficiário for eliminado no desafio', () => {
    let s = action(setup([['coordinator', 'executor'], ['baron'], ['marketer', 'colonel']]), 'backroomDeal');
    s = run(s, { type: 'DECLARE_CHALLENGE', payload: { isChallengeOnBlock: false } }, 'b');
    expect(s.publicState.players.a!.coins).toBe(7);
    expect(s.publicState.players.b!.coins).toBe(7);
    expect(s.publicState.phase).toBe('WAITING_ACTION');
  });

  it('rejeita beneficiário ausente, próprio, morto e inexistente', () => {
    const s = setup();
    s.publicState.players.c = { ...s.publicState.players.c!, isAlive: false };
    for (const targetPlayerId of [undefined, 'a', 'c', 'unknown']) {
      expect(executeCommand(s, { type: 'DECLARE_ACTION', payload: { actionType: 'backroomDeal', targetPlayerId } }, 'a', 'bad').rejection).toBeDefined();
    }
  });

  it('não permite bloquear a própria Vaquinha ou pular prioridade', () => {
    let s = action(setup(), 'crowdfunding');
    for (const id of ['a', 'c']) expect(executeCommand(s, { type: 'DECLARE_BLOCK', payload: { claimedBlockRole: 'baron' } }, id, 'bad').rejection).toBeDefined();
    s = pass(s);
    expect(s.publicState.phase).toBe('WAITING_BLOCK');
    s = run(s, { type: 'DECLARE_BLOCK', payload: { claimedBlockRole: 'baron' } }, 'c');
    s = passWindow(s);
    expect(s.publicState.players.a!.coins).toBe(7);
  });

  it('Intocável sem C$3 não abre defesa; definitivo nunca abre reação', () => {
    const base = setup();
    base.publicState.players.b = { ...base.publicState.players.b!, coins: 2 };
    expect(action(base, 'commonImpeachment').publicState.phase).toBe('WAITING_CARD_CHOICE');
    base.publicState.players.a = { ...base.publicState.players.a!, coins: 10 };
    const s = action(base, 'definitiveImpeachment');
    expect(s.publicState.phase).toBe('WAITING_CARD_CHOICE');
    expect(s.publicState.responsePlayerIds).toEqual([]);
  });

  it('Mandado perde somente uma cópia do personagem e rejeita palpite ausente', () => {
    const base = setup([['investigator', 'executor'], ['baron', 'baron'], ['lawyer', 'marketer']]);
    const invalid = executeCommand(base, { type: 'DECLARE_ACTION', payload: { actionType: 'searchWarrant', targetPlayerId: 'b' } }, 'a', 'bad');
    expect(invalid.rejection).toBeDefined();
    expect(base.publicState.players.a!.coins).toBe(7);
    let s = passWindow(action(base, 'searchWarrant'));
    s = passWindow(s);
    expect(s.publicState.players.b!.activeSupportCount).toBe(1);
    expect(s.publicState.players.b!.lostCards[0]!.roleSlug).toBe('baron');
  });

  it('troca conserva 24 cartas e não devolve apoios perdidos', () => {
    const base = setup();
    const lost = base.privateHands.a![0]!;
    base.privateHands.a = base.privateHands.a!.map(card => ({ ...card, isLost: card.id === lost.id }));
    base.publicState.players.a = { ...base.publicState.players.a!, activeSupportCount: 1 };
    let s = passWindow(action(base, 'exchange'));
    expect(s.privateHands.a!.filter(card => !card.isLost)).toHaveLength(3);
    s = executeTimeout(s, s.publicState.deadlineAt!).nextAuthoritativeState;
    expect(s.privateHands.a!.filter(card => !card.isLost)).toHaveLength(1);
    expect(s.privateHands.a!.find(card => card.id === lost.id)?.isLost).toBe(true);
    const cards = [...s.deck, ...Object.values(s.privateHands).flat()];
    expect(new Set(cards.map(card => card.id)).size).toBe(24);
    for (const role of PLAYABLE_ROLES) expect(cards.filter(card => card.roleSlug === role)).toHaveLength(3);
  });

  it('timeout passa só um respondente, escolhe carta e executa impeachment obrigatório', () => {
    let s = action(setup(), 'execution');
    s = executeTimeout(s, s.publicState.deadlineAt!).nextAuthoritativeState;
    expect(s.publicState.responsePlayerIds).toEqual(['c']);
    s = executeTimeout(s, s.publicState.deadlineAt!).nextAuthoritativeState;
    expect(s.publicState.phase).toBe('WAITING_BLOCK');
    s = executeTimeout(s, s.publicState.deadlineAt!).nextAuthoritativeState;
    expect(s.publicState.phase).toBe('WAITING_CARD_CHOICE');
    s = executeTimeout(s, s.publicState.deadlineAt!).nextAuthoritativeState;
    expect(s.publicState.players.b!.activeSupportCount).toBe(1);
    s.publicState.players.b = { ...s.publicState.players.b!, coins: 10 };
    s = executeTimeout(s, s.publicState.deadlineAt!).nextAuthoritativeState;
    expect(s.publicState.pendingAction?.actionType).toBe('definitiveImpeachment');
    expect(s.publicState.players.b!.coins).toBe(0);
  });

  it('timeout antes do deadline não muda estado; turno comum recebe salário', () => {
    const s = setup();
    expect(executeTimeout(s, s.publicState.deadlineAt! - 1).nextAuthoritativeState).toBe(s);
    const next = executeTimeout(s, s.publicState.deadlineAt!).nextAuthoritativeState;
    expect(next.publicState.players.a!.coins).toBe(8);
    expect(next.publicState.activePlayerId).toBe('b');
  });

  const matrix: [ActionType, RoleSlug[]][] = [
    ['salary', []], ['crowdfunding', ['baron']], ['slushFund', []], ['extortion', ['colonel', 'marketer']],
    ['execution', ['lawyer']], ['exchange', []], ['searchWarrant', ['lawyer', 'colonel']],
    ['backroomDeal', []], ['commonImpeachment', ['untouchable']], ['definitiveImpeachment', []],
  ];
  for (const [type, allowed] of matrix) it.each(PLAYABLE_ROLES)(`${type}: elegibilidade de %s`, role => {
    const base = setup();
    if (type === 'definitiveImpeachment') base.publicState.players.a = { ...base.publicState.players.a!, coins: 10 };
    let s = action(base, type);
    if (s.publicState.phase === 'WAITING_CHALLENGE_ACTION') s = passWindow(s);
    const result = executeCommand(s, { type: 'DECLARE_BLOCK', payload: { claimedBlockRole: role } }, 'b', 'matrix');
    expect(!result.rejection).toBe(allowed.includes(role));
  });
});

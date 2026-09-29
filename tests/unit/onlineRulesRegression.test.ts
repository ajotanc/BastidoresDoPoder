import { describe, it, expect, vi } from 'vitest';
import { createInitialAuthoritativeState, executeCommand, executeTimeout, finishTurn, type AuthoritativeGameState } from '@/game/engine/gameEngine';
import { createInitialDeck, PLAYABLE_ROLES } from '@/game/engine/deck';
import type { ClientCommand } from '@/game/models/commands';
import type { ActionType } from '@/game/models/gameState';
import type { RoleSlug } from '@/types/game';

// Keep the two-player endgame fixtures independent of the production lobby minimum.
vi.mock('@/constants/gameConfig', async importOriginal => ({
  ...await importOriginal<typeof import('@/constants/gameConfig')>(), MIN_PLAYERS_TO_START: 2,
}));

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
  it('publica somente os apoios restantes do vencedor ao encerrar por saída', () => {
    let s = setup([['executor', 'baron'], ['marketer']]);
    expect(s.publicState.winnerSupports).toBeUndefined();
    s = run(s, { type: 'LEAVE_ROOM', payload: {} }, 'b');
    expect(s.publicState.phase).toBe('FINISHED');
    expect(s.publicState.winnerSupports).toEqual(s.privateHands.a!.filter(card => !card.isLost).map(({ id, roleSlug }) => ({ id, roleSlug })));
    expect(s.publicState.discard).toHaveLength(1);
    expect(s.publicState.players.a!.activeSupportCount).toBe(2);
    expect(s.publicState.history.filter(event => event.type === 'WINNER_SUPPORTS_AVAILABLE')).toHaveLength(1);
    expect(finishTurn(s).broadcastPublicState.history.filter(event => event.type === 'WINNER_SUPPORTS_AVAILABLE')).toHaveLength(1);
  });
  it('não publica apoios quando a sessão termina sem vencedor', () => {
    const s = setup();
    for (const player of Object.values(s.publicState.players)) s.publicState.players[player.id] = { ...player, isAlive: false };
    expect(finishTurn(s).broadcastPublicState.winnerSupports).toEqual([]);
  });
  it('impeachment de 7 só admite defesa e contestação da defesa; o de 10 não admite reação', () => {
    let common = action(setup(), 'commonImpeachment');
    expect(common.publicState.phase).toBe('WAITING_BLOCK');
    expect(common.publicState.responsePlayerIds).toEqual(['b']);
    expect(executeCommand(common, { type: 'DECLARE_CHALLENGE', payload: { isChallengeOnBlock: false } }, 'b', 'direct').rejection).toBeDefined();
    common = run(common, { type: 'DECLARE_BLOCK', payload: { claimedBlockRole: 'untouchable' } }, 'b');
    expect(common.publicState.players.b!.coins).toBe(4);
    expect(common.publicState.phase).toBe('WAITING_CHALLENGE_BLOCK');
    expect(common.publicState.responsePlayerIds).toEqual(['c', 'a']);
    common = pass(common);
    expect(executeCommand(common, { type: 'DECLARE_CHALLENGE', payload: { isChallengeOnBlock: true } }, 'a', 'defense').rejection).toBeUndefined();

    const base = setup();
    base.publicState.players.a = { ...base.publicState.players.a!, coins: 10 };
    const definitive = action(base, 'definitiveImpeachment');
    expect(definitive.publicState.phase).toBe('WAITING_CARD_CHOICE');
    expect(definitive.publicState.responsePlayerIds).toEqual([]);
    for (const id of ['a', 'b', 'c']) {
      for (const command of [
        { type: 'DECLARE_BLOCK', payload: { claimedBlockRole: 'untouchable' } },
        { type: 'DECLARE_CHALLENGE', payload: { isChallengeOnBlock: false } },
        { type: 'DECLARE_CHALLENGE', payload: { isChallengeOnBlock: true } },
      ] as const) expect(executeCommand(definitive, command, id, 'denied').rejection).toBeDefined();
    }
  });
  it.each(['execution', 'extortion', 'searchWarrant', 'backroomDeal'] as const)('%s direcionada permite contestação por terceiro', actionType => {
    let s = run(setup(), { type: 'DECLARE_ACTION', payload: { actionType, targetPlayerId: 'c', namedRole: 'baron' } });
    expect(s.publicState.responsePlayerIds).toEqual(['b', 'c']);
    s = run(s, { type: 'DECLARE_CHALLENGE', payload: { isChallengeOnBlock: false } }, 'b');
    expect(s.publicState.phase).toBe('WAITING_CARD_CHOICE');
    expect(s.publicState.cardChoicePlayerId).toBe(['execution', 'backroomDeal'].includes(actionType) ? 'b' : 'a');
  });
  it.each(['slushFund', 'exchange'] as const)('%s sem alvo permite que qualquer adversário conteste na sua oportunidade', actionType => {
    let s = action(setup(), actionType);
    expect(s.publicState.responsePlayerIds).toEqual(['b', 'c']);
    s = pass(s);
    expect(s.publicState.responsePlayerIds).toEqual(['c']);
    s = run(s, { type: 'DECLARE_CHALLENGE', payload: { isChallengeOnBlock: false } }, 'c');
    expect(s.publicState.phase).not.toBe('WAITING_CHALLENGE_ACTION');
  });
  it.each([['execution', 'lawyer'], ['extortion', 'colonel'], ['searchWarrant', 'lawyer'], ['commonImpeachment', 'untouchable']] as const)('qualquer terceiro pode contestar defesa contra %s', (actionType, role) => {
    let s = action(setup(), actionType);
    if (s.publicState.phase === 'WAITING_CHALLENGE_ACTION') s = passWindow(s);
    s = run(s, { type: 'DECLARE_BLOCK', payload: { claimedBlockRole: role } }, 'b');
    expect(s.publicState.responsePlayerIds).toEqual(['c', 'a']);
    s = run(s, { type: 'DECLARE_CHALLENGE', payload: { isChallengeOnBlock: true } }, 'c');
    expect(s.publicState.cardChoicePlayerId).toBe('b');
  });
  it.each([
    ['slushFund', 'baron'], ['extortion', 'colonel'], ['execution', 'executor'],
    ['exchange', 'marketer'], ['searchWarrant', 'investigator'], ['backroomDeal', 'coordinator'],
  ] as const)('comprovar %s substitui o apoio imediatamente e conserva todas as cartas', (actionType, role) => {
    let s = action(setup([[role, 'untouchable'], ['lawyer', 'baron'], ['colonel', 'marketer']]), actionType);
    const original = s;
    const proved = s.privateHands.a![0]!;
    const other = s.privateHands.a![1]!;
    const deckIds = s.deck.map(card => card.id);
    s = run(s, { type: 'DECLARE_CHALLENGE', payload: { isChallengeOnBlock: false } }, 'b');
    expect(s.publicState.phase).toBe('WAITING_CARD_CHOICE');
    expect(s.privateHands.a![0]!.id).not.toBe(proved.id);
    expect(deckIds).toContain(s.privateHands.a![0]!.id);
    expect(s.privateHands.a![1]).toEqual(other);
    expect(s.deck).toContainEqual({ id: proved.id, roleSlug: proved.roleSlug });
    expect(s.deck).toHaveLength(deckIds.length);
    expect(s.publicState.players.a!.activeSupportCount).toBe(2);
    expect(s.publicState.discard).toHaveLength(0);
    expect(JSON.stringify(s.publicState)).not.toContain(s.privateHands.a![0]!.id);
    expect(original.privateHands.a![0]).toEqual(proved);
    const cards = [...s.deck, ...Object.values(s.privateHands).flat()];
    expect(cards).toHaveLength(24);
    expect(new Set(cards.map(card => card.id)).size).toBe(24);
    expect(s.publicState.history.filter(event => event.type === 'PROVED_CARD_REPLACED')).toHaveLength(1);
    s = choose(s);
    expect(s.publicState.history.filter(event => event.type === 'PROVED_CARD_REPLACED')).toHaveLength(1);
  });

  it.each([
    ['crowdfunding', 'baron'], ['extortion', 'colonel'], ['extortion', 'marketer'],
    ['execution', 'lawyer'], ['searchWarrant', 'lawyer'], ['searchWarrant', 'colonel'],
    ['commonImpeachment', 'untouchable'],
  ] as const)('comprovar bloqueio de %s com %s também substitui o apoio', (actionType, role) => {
    let s = action(setup([['executor', 'coordinator'], [role, 'investigator'], ['baron', 'marketer']]), actionType);
    if (s.publicState.phase === 'WAITING_CHALLENGE_ACTION') s = passWindow(s);
    const proved = s.privateHands.b![0]!;
    s = run(s, { type: 'DECLARE_BLOCK', payload: { claimedBlockRole: role } }, 'b');
    s = run(s, { type: 'DECLARE_CHALLENGE', payload: { isChallengeOnBlock: true } }, 'c');
    const replacement = s.privateHands.b![0]!;
    expect(replacement.id).not.toBe(proved.id);
    expect(s.deck).toContainEqual({ id: proved.id, roleSlug: proved.roleSlug });
    expect(s.publicState.players.b!.activeSupportCount).toBe(2);
    expect(s.publicState.pendingAction).toBeNull();
    s = choose(s);
    expect(s.privateHands.b![0]).toEqual(replacement);
    expect(s.publicState.phase).toBe('WAITING_ACTION');
  });

  it('abandono do contestador não impede a substituição já realizada', () => {
    let s = action(setup([['baron', 'executor'], ['lawyer', 'marketer'], ['colonel', 'investigator']]), 'slushFund');
    const provedId = s.privateHands.a![0]!.id;
    s = run(s, { type: 'DECLARE_CHALLENGE', payload: { isChallengeOnBlock: false } }, 'b');
    s = run(s, { type: 'LEAVE_ROOM', payload: {} }, 'b');
    expect(s.privateHands.a!.some(card => card.id === provedId)).toBe(false);
    expect(s.deck.some(card => card.id === provedId)).toBe(true);
  });
  it.each(['execution', 'commonImpeachment', 'definitiveImpeachment'] as const)('saída do alvo durante %s limpa a ação e passa o turno', actionType => {
    let s = setup();
    s.publicState.players.a = { ...s.publicState.players.a!, coins: 10 };
    if (actionType !== 'definitiveImpeachment') s.publicState.players.a = { ...s.publicState.players.a!, coins: 7 };
    s = action(s, actionType);
    s = run(s, { type: 'LEAVE_ROOM', payload: {} }, 'b');
    expect(s.publicState.phase).toBe('WAITING_ACTION');
    expect(s.publicState.activePlayerId).toBe('c');
    expect(s.publicState.pendingAction).toBeNull();
    expect(s.publicState.cardChoicePlayerId).toBeNull();
    expect(s.publicState.discard).toHaveLength(2);
  });

  it('saída durante troca devolve as cartas compradas e revela somente os apoios originais', () => {
    let s = setup();
    const initialDeck = s.deck.length;
    const original = s.privateHands.a!.map(card => card.id);
    s = run(s, { type: 'DECLARE_ACTION', payload: { actionType: 'exchange' } });
    s = passWindow(s);
    expect(s.privateHands.a).toHaveLength(4);
    s = run(s, { type: 'LEAVE_ROOM', payload: {} });
    expect(s.deck).toHaveLength(initialDeck);
    expect(s.publicState.discard.map(card => card.id).sort()).toEqual(original.sort());
    expect(s.publicState.activePlayerId).toBe('b');
    const all = [...s.deck, ...Object.values(s.privateHands).flat()];
    expect(new Set(all.map(card => card.id)).size).toBe(24);
    expect(all).toHaveLength(24);
  });

  it('saída de quem responderia remove a espera sem pular o próximo participante', () => {
    let s = run(setup(), { type: 'DECLARE_ACTION', payload: { actionType: 'crowdfunding' } });
    s = run(s, { type: 'LEAVE_ROOM', payload: {} }, 'b');
    expect(s.publicState.responsePlayerIds).toEqual(['c']);
    s = pass(s);
    expect(s.publicState.players.a!.coins).toBe(9);
    expect(s.publicState.activePlayerId).toBe('c');
  });

  it('abandono não duplica cartas que já estavam perdidas', () => {
    let s = setup();
    s.publicState.players.a = { ...s.publicState.players.a!, coins: 10 };
    s = action(s, 'definitiveImpeachment');
    s = choose(s);
    s = run(s, { type: 'LEAVE_ROOM', payload: {} }, 'b');
    s = run(s, { type: 'LEAVE_ROOM', payload: {} }, 'b');
    expect(s.publicState.discard).toHaveLength(2);
    expect(s.publicState.players.b!.lostCards).toHaveLength(2);
  });
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
    s = pass(s);
    expect(s.publicState.phase).toBe('WAITING_BLOCK');
    expect(executeCommand(s, { type: 'DECLARE_CHALLENGE', payload: { isChallengeOnBlock: false } }, 'b', 'late').rejection).toBeDefined();
    expect(s.publicState.phase).toBe('WAITING_BLOCK');
    expect(s.publicState.responsePlayerIds).toEqual(['b']);
  });

  it('preserva defesa quando o alvo perde desafio contra Executor verdadeiro', () => {
    const challenger = 'b';
    let s = action(setup(), 'execution');
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
      s = pass(s);
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
    s = pass(s);
    s = run(s, { type: 'DECLARE_CHALLENGE', payload: { isChallengeOnBlock: true } }, 'a');
    s = choose(s);
    expect(s.publicState.players.b!.activeSupportCount).toBe(2);
    expect(s.publicState.players.a!.activeSupportCount).toBe(1);
    expect(s.publicState.players.c!.activeSupportCount).toBe(2);
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

  it('repõe a carta comprovada e encerra ao restar um vivo sem aplicar o ataque', () => {
    let s = action(setup([['executor', 'baron'], ['marketer']]), 'execution');
    const hand = s.privateHands.a;
    s = run(s, { type: 'DECLARE_CHALLENGE', payload: { isChallengeOnBlock: false } }, 'b');
    expect(s.publicState.phase).toBe('FINISHED');
    expect(s.publicState.deadlineAt).toBeNull();
    expect(s.publicState.pendingAction).toBeNull();
    expect(s.privateHands.a![0]!.id).not.toBe(hand![0]!.id);
    expect(s.publicState.winnerSupports).toEqual(s.privateHands.a!.filter(card => !card.isLost).map(({ id, roleSlug }) => ({ id, roleSlug })));
    expect(s.deck.some(card => card.id === hand![0]!.id)).toBe(true);
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
    expect(s.publicState.phase).toBe('WAITING_CHALLENGE_ACTION');
    s = executeTimeout(s, s.publicState.deadlineAt!).nextAuthoritativeState;
    expect(s.publicState.responsePlayerIds).toEqual(['b']);
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



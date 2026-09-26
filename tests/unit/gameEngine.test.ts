import { describe, it, expect } from 'vitest';
import {
  createInitialAuthoritativeState,
  executeCommand,
} from '@/game/engine/gameEngine';

describe('GameEngine - Engine Autoritativa de Bastidores do Poder', () => {
  it('deve inicializar a sala em LOBBY com o Host', () => {
    const state = createInitialAuthoritativeState('7k3f', 'host-1', 'Presidente', 'colonel', 'token-123');

    expect(state.publicState.phase).toBe('LOBBY');
    expect(state.publicState.roomCode).toBe('7K3F');
    expect(state.publicState.playerOrder).toEqual(['host-1']);
    expect(state.publicState.players['host-1']?.name).toBe('Presidente');
  });

  it('deve permitir entrada de novos jogadores no LOBBY e iniciar a partida', () => {
    let state = createInitialAuthoritativeState('7k3f', 'host-1', 'Presidente', 'colonel', 'token-123');

    // Jogador 2 entra
    const joinResult = executeCommand(
      state,
      {
        type: 'JOIN_ROOM',
        payload: { name: 'Senador', avatarSlug: 'baron', reconnectToken: 'token-456' },
      },
      'player-2',
      'msg-1'
    );
    state = joinResult.nextAuthoritativeState;
    expect(state.publicState.playerOrder).toHaveLength(2);
    expect(state.publicState.players['player-2']?.name).toBe('Senador');

    state = executeCommand(state, { type: 'SET_READY', payload: { ready: true } }, 'player-2', 'ready').nextAuthoritativeState;
    // Iniciar jogo
    const startResult = executeCommand(
      state,
      {
        type: 'START_GAME',
        payload: {},
      },
      'host-1',
      'msg-2'
    );
    state = startResult.nextAuthoritativeState;

    expect(state.publicState.phase).toBe('WAITING_ACTION');
    expect(state.publicState.turn).toBe(1);
    expect(state.privateHands['host-1']).toHaveLength(2);
    expect(state.privateHands['player-2']).toHaveLength(2);
    expect(state.publicState.players['host-1']?.coins).toBe(2);
    expect(state.publicState.players['player-2']?.coins).toBe(2);
  });

  it('deve processar Salário Oficial adicionando C$ 1 e passando o turno', () => {
    let state = createInitialAuthoritativeState('7k3f', 'host-1', 'Presidente', 'colonel', 'token-1');
    state = executeCommand(
      state,
      { type: 'JOIN_ROOM', payload: { name: 'Senador', avatarSlug: 'baron', reconnectToken: 'token-2' } },
      'player-2',
      'msg-1'
    ).nextAuthoritativeState;
    state = executeCommand(state, { type: 'SET_READY', payload: { ready: true } }, 'player-2', 'ready').nextAuthoritativeState;
    state = executeCommand(state, { type: 'START_GAME', payload: {} }, 'host-1', 'msg-2').nextAuthoritativeState;

    const actionResult = executeCommand(
      state,
      {
        type: 'DECLARE_ACTION',
        payload: { actionType: 'salary' },
      },
      'host-1',
      'msg-3'
    );

    const nextState = actionResult.nextAuthoritativeState;
    expect(nextState.publicState.players['host-1']?.coins).toBe(3);
    // Turno passou para o player-2
    expect(nextState.publicState.activePlayerId).toBe('player-2');
    expect(nextState.publicState.turn).toBe(2);
  });

  it('deve forçar Impeachment Definitivo se o jogador começar o turno com C$ 10 ou mais', () => {
    let state = createInitialAuthoritativeState('7k3f', 'host-1', 'Presidente', 'colonel', 'token-1');
    state = executeCommand(
      state,
      { type: 'JOIN_ROOM', payload: { name: 'Senador', avatarSlug: 'baron', reconnectToken: 'token-2' } },
      'player-2',
      'msg-1'
    ).nextAuthoritativeState;
    state = executeCommand(state, { type: 'SET_READY', payload: { ready: true } }, 'player-2', 'ready').nextAuthoritativeState;
    state = executeCommand(state, { type: 'START_GAME', payload: {} }, 'host-1', 'msg-2').nextAuthoritativeState;

    // Força 10 moedas para o host
    const playerHost = state.publicState.players['host-1'];
    if (playerHost) {
      state.publicState.players['host-1'] = { ...playerHost, coins: 10 };
    }

    // Tentar salário com 10 contos deve ser rejeitado
    const rejectResult = executeCommand(
      state,
      {
        type: 'DECLARE_ACTION',
        payload: { actionType: 'salary' },
      },
      'host-1',
      'msg-reject'
    );

    expect(rejectResult.rejection?.reason).toBe('MUST_IMPEACH_OVER_10');
  });

  it('deve desmascarar blefe quando jogador declarar ação sem ter a carta de apoio', () => {
    let state = createInitialAuthoritativeState('7k3f', 'host-1', 'Presidente', 'colonel', 'token-1');
    state = executeCommand(
      state,
      { type: 'JOIN_ROOM', payload: { name: 'Senador', avatarSlug: 'baron', reconnectToken: 'token-2' } },
      'player-2',
      'msg-1'
    ).nextAuthoritativeState;
    state = executeCommand(state, { type: 'SET_READY', payload: { ready: true } }, 'player-2', 'ready').nextAuthoritativeState;
    state = executeCommand(state, { type: 'START_GAME', payload: {} }, 'host-1', 'msg-2').nextAuthoritativeState;

    // Define mão do host explicitamente sem Barão (apenas Coronel e Advogada)
    state.privateHands['host-1'] = [
      { id: 'c1', roleSlug: 'colonel', isLost: false },
      { id: 'c2', roleSlug: 'lawyer', isLost: false },
    ];

    // Host declara Caixa 2 (alega Barão)
    state = executeCommand(
      state,
      {
        type: 'DECLARE_ACTION',
        payload: { actionType: 'slushFund' },
      },
      'host-1',
      'msg-act'
    ).nextAuthoritativeState;

    expect(state.publicState.phase).toBe('WAITING_CHALLENGE_ACTION');

    // Jogador 2 grita Fake News!
    const challengeResult = executeCommand(
      state,
      {
        type: 'DECLARE_CHALLENGE',
        payload: { isChallengeOnBlock: false },
      },
      'player-2',
      'msg-chal'
    );

    const challengeState = challengeResult.nextAuthoritativeState;
    // O host foi pego no blefe e deve perder 1 carta
    expect(challengeState.publicState.phase).toBe('WAITING_CARD_CHOICE');
    expect(challengeState.publicState.cardChoicePlayerId).toBe('host-1');
  });

  it('deve processar Impeachment Comum (C$ 7) sem bloqueio fazendo o alvo perder apoio e avançando o turno sem loop', () => {
    let state = createInitialAuthoritativeState('7k3f', 'host-1', 'Presidente', 'colonel', 'token-1');
    state = executeCommand(
      state,
      { type: 'JOIN_ROOM', payload: { name: 'Senador', avatarSlug: 'baron', reconnectToken: 'token-2' } },
      'player-2',
      'msg-1'
    ).nextAuthoritativeState;
    state = executeCommand(state, { type: 'SET_READY', payload: { ready: true } }, 'player-2', 'ready').nextAuthoritativeState;
    state = executeCommand(state, { type: 'START_GAME', payload: {} }, 'host-1', 'msg-2').nextAuthoritativeState;

    // Dá 7 moedas para o host
    const hostPlayer = state.publicState.players['host-1'];
    if (hostPlayer) {
      state.publicState.players['host-1'] = { ...hostPlayer, coins: 7 };
    }
    // A vítima tem saldo para a defesa, mas escolhe não bloquear.
    state.publicState.players['player-2'] = { ...state.publicState.players['player-2']!, coins: 3 };

    // Host declara Impeachment Comum de C$ 7 contra player-2
    state = executeCommand(
      state,
      {
        type: 'DECLARE_ACTION',
        payload: { actionType: 'commonImpeachment', targetPlayerId: 'player-2' },
      },
      'host-1',
      'msg-impeach'
    ).nextAuthoritativeState;

    // Abre janela de bloqueio para o alvo
    expect(state.publicState.phase).toBe('WAITING_BLOCK');
    expect(state.publicState.players['host-1']?.coins).toBe(0); // 7 moedas debitadas

    // Player 2 passa (não bloqueia)
    state = executeCommand(
      state,
      {
        type: 'PASS_RESPONSE',
        payload: { pass: true },
      },
      'player-2',
      'msg-pass'
    ).nextAuthoritativeState;

    // Player 2 agora deve escolher qual carta perder
    expect(state.publicState.phase).toBe('WAITING_CARD_CHOICE');
    expect(state.publicState.cardChoicePlayerId).toBe('player-2');

    const cardToLose = state.privateHands['player-2']?.[0]?.id || '';
    state = executeCommand(
      state,
      {
        type: 'CHOOSE_CARD',
        payload: { cardId: cardToLose },
      },
      'player-2',
      'msg-choose'
    ).nextAuthoritativeState;

    // Player 2 perdeu exatamente 1 apoio e o turno avançou limpo para player-2
    expect(state.publicState.players['player-2']?.activeSupportCount).toBe(1);
    expect(state.publicState.players['player-2']?.lostCards).toHaveLength(1);
    expect(state.publicState.phase).toBe('WAITING_ACTION');
    expect(state.publicState.activePlayerId).toBe('player-2');
    expect(state.publicState.turn).toBe(2);
    expect(state.publicState.pendingAction).toBeNull();
  });

  it('deve permitir que o Intocável bloqueie o Impeachment Comum pagando C$ 3', () => {
    let state = createInitialAuthoritativeState('7k3f', 'host-1', 'Presidente', 'colonel', 'token-1');
    state = executeCommand(
      state,
      { type: 'JOIN_ROOM', payload: { name: 'Senador', avatarSlug: 'baron', reconnectToken: 'token-2' } },
      'player-2',
      'msg-1'
    ).nextAuthoritativeState;
    state = executeCommand(state, { type: 'SET_READY', payload: { ready: true } }, 'player-2', 'ready').nextAuthoritativeState;
    state = executeCommand(state, { type: 'START_GAME', payload: {} }, 'host-1', 'msg-2').nextAuthoritativeState;

    // Dá 7 moedas para o host e 3 moedas para o player-2
    const hostPlayer = state.publicState.players['host-1'];
    const p2 = state.publicState.players['player-2'];
    if (hostPlayer && p2) {
      state.publicState.players['host-1'] = { ...hostPlayer, coins: 7 };
      state.publicState.players['player-2'] = { ...p2, coins: 3 };
    }

    // Host declara Impeachment Comum contra player-2
    state = executeCommand(
      state,
      {
        type: 'DECLARE_ACTION',
        payload: { actionType: 'commonImpeachment', targetPlayerId: 'player-2' },
      },
      'host-1',
      'msg-impeach'
    ).nextAuthoritativeState;

    expect(state.publicState.phase).toBe('WAITING_BLOCK');

    // Player 2 declara bloqueio alegando Intocável
    state = executeCommand(
      state,
      {
        type: 'DECLARE_BLOCK',
        payload: { claimedBlockRole: 'untouchable' },
      },
      'player-2',
      'msg-block'
    ).nextAuthoritativeState;

    // C$ 3 debitados do player-2
    expect(state.publicState.players['player-2']?.coins).toBe(0);
    expect(state.publicState.phase).toBe('WAITING_CHALLENGE_BLOCK');

    // Host aceita o bloqueio (passa sem contestar)
    state = executeCommand(
      state,
      {
        type: 'PASS_RESPONSE',
        payload: { pass: true },
      },
      'host-1',
      'msg-pass-block'
    ).nextAuthoritativeState;

    // Ataque bloqueado com sucesso, ninguém perdeu apoio e o turno avançou
    expect(state.publicState.players['player-2']?.activeSupportCount).toBe(2);
    expect(state.publicState.phase).toBe('WAITING_ACTION');
    expect(state.publicState.activePlayerId).toBe('player-2');
    expect(state.publicState.pendingAction).toBeNull();
  });

  it('deve garantir rigorosamente que existem exatamente 3 cartas de cada um dos 8 personagens (24 cartas no total)', () => {
    let state = createInitialAuthoritativeState('test-room', 'p1', 'Player 1', 'colonel', 'tok-1');
    state = executeCommand(
      state,
      { type: 'JOIN_ROOM', payload: { name: 'Player 2', avatarSlug: 'baron', reconnectToken: 'tok-2' } },
      'p2',
      'msg-join'
    ).nextAuthoritativeState;

    state = executeCommand(state, { type: 'SET_READY', payload: { ready: true } }, 'p2', 'ready').nextAuthoritativeState;
    state = executeCommand(state, { type: 'START_GAME', payload: {} }, 'p1', 'msg-start').nextAuthoritativeState;

    // Função auxiliar para contar todas as cartas no ecossistema
    const countAllCardsByRole = () => {
      const counts: Record<string, number> = {};

      // 1. Cartas no baralho
      for (const card of state.deck) {
        counts[card.roleSlug] = (counts[card.roleSlug] || 0) + 1;
      }

      // 2. Cartas nas mãos dos jogadores
      for (const playerId of Object.keys(state.privateHands)) {
        const hand = state.privateHands[playerId] || [];
        for (const card of hand) {
          counts[card.roleSlug] = (counts[card.roleSlug] || 0) + 1;
        }
      }

      // 3. Cartas perdidas/reveladas
      for (const playerId of Object.keys(state.publicState.players)) {
        const lost = state.publicState.players[playerId]?.lostCards || [];
        for (const card of lost) {
          counts[card.roleSlug] = (counts[card.roleSlug] || 0) + 1;
        }
      }

      return counts;
    };

    const counts = countAllCardsByRole();
    const roles = ['colonel', 'executor', 'untouchable', 'lawyer', 'baron', 'marketer', 'investigator', 'coordinator'];

    // 24 cartas totais: 4 distribuídas para 2 jogadores (2 cada) + 20 restantes no baralho
    expect(state.deck.length).toBe(20);
    expect(state.privateHands['p1']?.length).toBe(2);
    expect(state.privateHands['p2']?.length).toBe(2);

    let totalCards = 0;
    for (const role of roles) {
      expect(counts[role]).toBe(3);
      totalCards += counts[role] || 0;
    }
    expect(totalCards).toBe(24);
  });

  it('deve eliminar automaticamente o jogador que tem apenas 1 carta restante ao não bloquear uma Execução de Apoio', () => {
    let state = createInitialAuthoritativeState('ROOM-EXEC', 'p1', 'Jorge', 'executor', 'tok-1');
    state = executeCommand(state, { type: 'JOIN_ROOM', payload: { name: 'Ajota', avatarSlug: 'colonel', reconnectToken: 'tok-2' } }, 'p2', 'c-join').nextAuthoritativeState;
    state = executeCommand(state, { type: 'SET_READY', payload: { ready: true } }, 'p2', 'c-r2').nextAuthoritativeState;
    state = executeCommand(state, { type: 'START_GAME', payload: {} }, 'p1', 'c-start').nextAuthoritativeState;

    // Ajusta Jorge com moedas suficientes e Ajota com apenas 1 carta ativa restante
    const p1 = state.publicState.players['p1']!;
    const p2 = state.publicState.players['p2']!;
    const p2Hand = state.privateHands['p2']!;
    state.privateHands['p2'] = [
      { ...p2Hand[0]!, isLost: true },
      { ...p2Hand[1]!, isLost: false },
    ];
    state.publicState = {
      ...state.publicState,
      activePlayerId: 'p1',
      phase: 'WAITING_ACTION',
      players: {
        ...state.publicState.players,
        p1: { ...p1, coins: 5 },
        p2: { ...p2, coins: 3, activeSupportCount: 1 },
      },
    };

    // Jorge declara Execução de Apoio contra Ajota
    const actionResult = executeCommand(
      state,
      {
        type: 'DECLARE_ACTION',
        payload: {
          actionType: 'execution',
          targetPlayerId: 'p2',
        },
      },
      'p1',
      'c-exec'
    );
    state = actionResult.nextAuthoritativeState;
    expect(state.publicState.phase).toBe('WAITING_CHALLENGE_ACTION');

    // Ninguém contesta a alegação de Executor de Jorge -> avança para WAITING_BLOCK
    const passChallengeResult = executeCommand(
      state,
      { type: 'PASS_RESPONSE', payload: { pass: true } },
      'p2',
      'c-pass-ch'
    );
    state = passChallengeResult.nextAuthoritativeState;
    expect(state.publicState.phase).toBe('WAITING_BLOCK');

    // Ajota decide "Não Bloquear" (emite PASS_RESPONSE)
    const passBlockResult = executeCommand(
      state,
      { type: 'PASS_RESPONSE', payload: { pass: true } },
      'p2',
      'c-pass-bl'
    );

    // O comando NÃO deve ser rejeitado com INVALID_PHASE
    expect(passBlockResult.rejection).toBeUndefined();
    state = passBlockResult.nextAuthoritativeState;

    // Ajota perdeu o último apoio, é eliminado, e como era uma partida de 2 jogadores, Jorge vence!
    expect(state.publicState.players['p2']?.isAlive).toBe(false);
    expect(state.publicState.players['p2']?.activeSupportCount).toBe(0);
    expect(state.publicState.phase).toBe('FINISHED');
    expect(state.publicState.winnerPlayerId).toBe('p1');
  });
});


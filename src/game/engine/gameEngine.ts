import type { RoleSlug } from '@/types/game';
import type {
  GameState,
  PublicPlayerState,
  PrivatePlayerView,
  SupportCard,
  CardRef,
  RevealedCard,
  GameEvent,
  ActionType,
  PendingAction,
  GameSettings,
} from '../models/gameState';
import { DEFAULT_GAME_SETTINGS, MIN_PLAYERS_TO_START, MAX_PLAYERS_PER_ROOM } from '../models/gameState';
import type {
  ClientCommand,
  CommandReject,
  ActionIntent,
  BlockIntent,
  ChallengeIntent,
} from '../models/commands';
import { createInitialDeck, shuffleDeck } from './deck';
import { SUPPORT_CARDS_PER_ROLE, ROLE_DISPLAY_NAMES } from '@/constants/gameData';
import { PLAYABLE_ROLES } from './deck';
import { clockwiseOpponents, getBlockRoles, getEligibleBlockRoles } from './rules';
import { isClientCommand } from '../models/validation';

/**
 * Estado privado do jogo mantido exclusivamente no Host autoritativo.
 */
export interface AuthoritativeGameState {
  publicState: GameState;
  privateHands: Record<string, SupportCard[]>;
  deck: CardRef[];
  settings: GameSettings;
  reconnectTokens: Record<string, string>;
  privateNotices: Record<string, string>;
  playersPassedResponse: Set<string>;
  lossContinuation?: {
    next: 'block' | 'resolve' | 'end';
    provedCard?: { playerId: string; cardId: string };
  };
}

/**
 * Resultado da execução de um comando na engine.
 */
export interface EngineExecutionResult {
  nextAuthoritativeState: AuthoritativeGameState;
  broadcastPublicState: GameState;
  privateUpdates: Record<string, PrivatePlayerView>;
  rejection?: CommandReject;
}

/**
 * Cria o estado autoritativo inicial da sala.
 */
export const createInitialAuthoritativeState = (
  roomCode: string,
  hostPlayerId: string,
  hostName: string,
  hostAvatarSlug: RoleSlug,
  hostReconnectToken: string,
  settings: GameSettings = DEFAULT_GAME_SETTINGS
): AuthoritativeGameState => {
  const initialPlayer: PublicPlayerState = {
    id: hostPlayerId,
    name: hostName,
    avatarSlug: hostAvatarSlug,
    coins: settings.initialCoins,
    activeSupportCount: 0,
    lostCards: [],
    isAlive: true,
    isReady: true,
    isConnected: true,
  };

  const initialEvent: GameEvent = {
    id: `ev-${Date.now()}-init`,
    timestamp: Date.now(),
    type: 'ROOM_CREATED',
    message: `Gabinete oficial da sala ${roomCode.toUpperCase()} estabelecido por ${hostName}.`,
    importance: 'normal',
  };

  const publicState: GameState = {
    gameId: `game-${roomCode}-${Date.now()}`,
    roomCode: roomCode.toUpperCase(),
    revision: 1,
    phase: 'LOBBY',
    turn: 0,
    activePlayerId: hostPlayerId,
    playerOrder: [hostPlayerId],
    players: {
      [hostPlayerId]: initialPlayer,
    },
    deckCount: SUPPORT_CARDS_PER_ROLE,
    discard: [],
    pendingAction: null,
    deadlineAt: null,
    winnerPlayerId: null,
    history: [initialEvent],
    cardChoicePlayerId: null,
    cardChoiceReason: null,
    responsePlayerIds: [],
  };

  return {
    publicState,
    privateHands: {
      [hostPlayerId]: [],
    },
    deck: [],
    settings,
    reconnectTokens: {
      [hostPlayerId]: hostReconnectToken,
    },
    privateNotices: {},
    playersPassedResponse: new Set<string>(),
  };
};

/**
 * Mapeia o cargo necessário para declarar uma ação específica.
 */
export const getRequiredRoleForAction = (actionType: ActionType): RoleSlug | undefined => {
  switch (actionType) {
    case 'slushFund':
      return 'baron';
    case 'extortion':
      return 'colonel';
    case 'execution':
      return 'executor';
    case 'exchange':
      return 'marketer';
    case 'searchWarrant':
      return 'investigator';
    case 'backroomDeal':
      return 'coordinator';
    default:
      return undefined;
  }
};

/**
 * Custo em Contos (C$) para declarar a ação.
 */
export const getActionCost = (actionType: ActionType): number => {
  switch (actionType) {
    case 'execution':
      return 3;
    case 'searchWarrant':
      return 5;
    case 'commonImpeachment':
      return 7;
    case 'definitiveImpeachment':
      return 10;
    default:
      return 0;
  }
};

/**
 * Nomes amigáveis para exibição de eventos.
 */
export const getActionDisplayName = (actionType: ActionType): string => {
  switch (actionType) {
    case 'salary':
      return 'Salário Oficial (+C$ 1)';
    case 'crowdfunding':
      return 'Vaquinha Virtual (+C$ 2)';
    case 'slushFund':
      return 'Caixa 2 (+C$ 3)';
    case 'extortion':
      return 'Extorsão (toma até C$ 2)';
    case 'execution':
      return 'Execução de Apoio (C$ 3)';
    case 'exchange':
      return 'Troca de Cartas (Marqueteira)';
    case 'searchWarrant':
      return 'Mandado de Busca (C$ 5)';
    case 'backroomDeal':
      return 'Acordo de Bastidor (+C$ 2 / +C$ 1)';
    case 'commonImpeachment':
      return 'Impeachment Comum (C$ 7)';
    case 'definitiveImpeachment':
      return 'Impeachment Definitivo (C$ 10)';
  }
};

export const getRoleDisplayName = (slug: RoleSlug): string => {
  return ROLE_DISPLAY_NAMES[slug] ?? slug;
};

/**
 * Função pura central da Engine autoritativa: executa um comando e produz o próximo estado.
 */
export const executeCommand = (
  currentState: AuthoritativeGameState,
  command: ClientCommand,
  senderPlayerId: string,
  messageId: string
): EngineExecutionResult => {
  // Clona estruturas básicas para imutabilidade segura
  const state: AuthoritativeGameState = {
    publicState: {
      ...currentState.publicState,
      players: { ...currentState.publicState.players },
      history: [...currentState.publicState.history],
      discard: [...currentState.publicState.discard],
    },
    privateHands: { ...currentState.privateHands },
    deck: [...currentState.deck],
    settings: { ...currentState.settings },
    reconnectTokens: { ...currentState.reconnectTokens },
    privateNotices: { ...currentState.privateNotices },
    playersPassedResponse: new Set(currentState.playersPassedResponse),
    lossContinuation: currentState.lossContinuation,
  };

  const createRejection = (reason: CommandReject['reason'], description: string): EngineExecutionResult => {
    return {
      nextAuthoritativeState: currentState,
      broadcastPublicState: currentState.publicState,
      privateUpdates: {},
      rejection: {
        messageId,
        reason,
        description,
      },
    };
  };

  const addEvent = (message: string, importance: GameEvent['importance'] = 'normal', type = 'ACTION'): void => {
    const event: GameEvent = {
      id: `ev-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: Date.now(),
      type,
      message,
      importance,
    };
    state.publicState = {
      ...state.publicState,
      history: [event, ...state.publicState.history.slice(0, 49)],
    };
  };

  const getPrivateView = (pId: string): PrivatePlayerView => {
    return {
      playerId: pId,
      supports: state.privateHands[pId] || [],
      searchResultNotice: state.privateNotices[pId],
    };
  };

  const getAllPrivateUpdates = (): Record<string, PrivatePlayerView> => {
    const updates: Record<string, PrivatePlayerView> = {};
    for (const pId of Object.keys(state.publicState.players)) {
      updates[pId] = getPrivateView(pId);
    }
    return updates;
  };

  if (!isClientCommand(command)) return createRejection('INVALID_COMMAND', 'Comando inválido.');
  if (['DECLARE_CHALLENGE', 'DECLARE_BLOCK', 'PASS_RESPONSE'].includes(command.type) &&
      state.publicState.responsePlayerIds[0] !== senderPlayerId) {
    return createRejection('NOT_ELIGIBLE_TO_REACT', 'Aguarde sua oportunidade de resposta em sentido horário.');
  }

  switch (command.type) {
    case 'JOIN_ROOM': {
      if (state.publicState.phase !== 'LOBBY') {
        return createRejection('INVALID_PHASE', 'A partida já iniciou. Não é possível entrar.');
      }
      const { name, avatarSlug, reconnectToken } = command.payload;
      const existingPlayer = state.publicState.players[senderPlayerId];
      if (existingPlayer) return createRejection('UNAUTHORIZED', 'Jogador já registrado. Use reconexão.');
      if (state.publicState.playerOrder.length >= MAX_PLAYERS_PER_ROOM) {
        return createRejection('ROOM_FULL', 'A sala comporta no máximo oito jogadores.');
      }

      if (!existingPlayer) {
        state.publicState.players[senderPlayerId] = {
          id: senderPlayerId,
          name,
          avatarSlug,
          coins: state.settings.initialCoins,
          activeSupportCount: 0,
          lostCards: [],
          isAlive: true,
          isReady: false,
          isConnected: true,
        };
        state.publicState = {
          ...state.publicState,
          playerOrder: [...state.publicState.playerOrder, senderPlayerId],
          revision: state.publicState.revision + 1,
        };
        state.privateHands[senderPlayerId] = [];
        state.reconnectTokens[senderPlayerId] = reconnectToken;
        addEvent(`${name} adentrou as negociações da sala.`, 'normal', 'PLAYER_JOINED');
      }
      return {
        nextAuthoritativeState: state,
        broadcastPublicState: state.publicState,
        privateUpdates: getAllPrivateUpdates(),
      };
    }

    case 'SET_READY': {
      if (state.publicState.phase !== 'LOBBY') {
        return createRejection('INVALID_PHASE', 'Fase atual não permite alterar status.');
      }
      const player = state.publicState.players[senderPlayerId];
      if (!player) return createRejection('INVALID_TARGET', 'Jogador não localizado.');

      state.publicState.players[senderPlayerId] = {
        ...player,
        isReady: command.payload.ready,
      };
      state.publicState = {
        ...state.publicState,
        revision: state.publicState.revision + 1,
      };
      return {
        nextAuthoritativeState: state,
        broadcastPublicState: state.publicState,
        privateUpdates: getAllPrivateUpdates(),
      };
    }

    case 'START_GAME': {
      if (senderPlayerId !== state.publicState.playerOrder[0]) {
        return createRejection('UNAUTHORIZED', 'Somente o host pode iniciar a partida.');
      }
      if (state.publicState.phase !== 'LOBBY') {
        return createRejection('INVALID_PHASE', 'A partida já foi iniciada.');
      }
      const totalPlayers = state.publicState.playerOrder.length;
      if (totalPlayers < MIN_PLAYERS_TO_START) {
        return createRejection('INVALID_TARGET', `São necessários ao menos ${MIN_PLAYERS_TO_START} jogadores para iniciar.`);
      }
      if (state.publicState.playerOrder.some(id => !state.publicState.players[id]?.isReady || !state.publicState.players[id]?.isConnected)) {
        return createRejection('INVALID_PHASE', 'Todos devem estar conectados e prontos.');
      }

      // Distribuição de 2 cartas de apoio e moedas iniciais
      const deck = createInitialDeck();
      for (const pId of state.publicState.playerOrder) {
        const c1 = deck.pop();
        const c2 = deck.pop();
        const hand: SupportCard[] = [];
        if (c1) hand.push({ id: c1.id, roleSlug: c1.roleSlug, isLost: false });
        if (c2) hand.push({ id: c2.id, roleSlug: c2.roleSlug, isLost: false });

        state.privateHands[pId] = hand;
        const p = state.publicState.players[pId];
        if (p) {
          state.publicState.players[pId] = {
            ...p,
            activeSupportCount: hand.length,
            coins: state.settings.initialCoins,
          };
        }
      }

      const firstPlayerId = state.publicState.playerOrder[0] || senderPlayerId;
      state.deck = deck;
      state.publicState = {
        ...state.publicState,
        phase: 'WAITING_ACTION',
        turn: 1,
        activePlayerId: firstPlayerId,
        deckCount: deck.length,
        deadlineAt: Date.now() + state.settings.actionTimeoutMs,
        revision: state.publicState.revision + 1,
      };

      const firstPlayer = state.publicState.players[firstPlayerId];
      addEvent(`A disputa pelo poder começou! Turno 1 aberto com ${firstPlayer?.name || 'Primeiro Jogador'}.`, 'breaking', 'GAME_STARTED');

      return {
        nextAuthoritativeState: state,
        broadcastPublicState: state.publicState,
        privateUpdates: getAllPrivateUpdates(),
      };
    }

    case 'DECLARE_ACTION': {
      if (state.publicState.phase !== 'WAITING_ACTION') {
        return createRejection('INVALID_PHASE', 'Não é momento de declarar ação.');
      }
      if (state.publicState.activePlayerId !== senderPlayerId) {
        return createRejection('NOT_YOUR_TURN', 'Aguarde o seu turno para agir.');
      }

      const player = state.publicState.players[senderPlayerId];
      if (!player || !player.isAlive) {
        return createRejection('PLAYER_NOT_ALIVE', 'Jogador não está ativo na mesa.');
      }

      const intent = command.payload as ActionIntent;
      const cost = getActionCost(intent.actionType);

      // Regra de ouro: se começou o turno com 10 ou mais contos, é obrigatório Impeachment Definitivo
      if (player.coins >= 10 && intent.actionType !== 'definitiveImpeachment') {
        return createRejection(
          'MUST_IMPEACH_OVER_10',
          'Com C$ 10 ou mais, é obrigatório declarar Impeachment Definitivo!'
        );
      }

      if (player.coins < cost) {
        return createRejection('INSUFFICIENT_FUNDS', `Fundos insuficientes para esta ação (requer C$ ${cost}).`);
      }

      // Validação de alvos se aplicável
      const needsTarget = ['extortion', 'execution', 'searchWarrant', 'backroomDeal', 'commonImpeachment', 'definitiveImpeachment'].includes(intent.actionType);
      if (needsTarget) {
        if (!intent.targetPlayerId || intent.targetPlayerId === senderPlayerId) {
          return createRejection('INVALID_TARGET', 'Alvo adversário inválido.');
        }
        const target = state.publicState.players[intent.targetPlayerId];
        if (!target || !target.isAlive) {
          return createRejection('INVALID_TARGET', 'O alvo escolhido não está mais na disputa.');
        }
      }

      if (intent.actionType === 'searchWarrant' && (!intent.namedRole || !PLAYABLE_ROLES.includes(intent.namedRole))) {
        return createRejection('INVALID_TARGET', 'Nomeie um personagem válido para o Mandado.');
      }

      // Debita custo imediatamente
      if (cost > 0) {
        state.publicState.players[senderPlayerId] = {
          ...player,
          coins: player.coins - cost,
        };
      }

      const claimedRole = getRequiredRoleForAction(intent.actionType);
      const pending: PendingAction = {
        actionType: intent.actionType,
        sourcePlayerId: senderPlayerId,
        targetPlayerId: needsTarget ? intent.targetPlayerId : undefined,
        claimedRole,
        namedRole: intent.actionType === 'searchWarrant' ? intent.namedRole : undefined,
        costPaid: cost,
      };

      state.publicState = {
        ...state.publicState,
        pendingAction: pending,
      };
      state.playersPassedResponse.clear();

      const actionLabel = getActionDisplayName(intent.actionType);
      const targetName = intent.targetPlayerId ? state.publicState.players[intent.targetPlayerId]?.name : '';
      const targetTxt = targetName ? ` contra ${targetName}` : '';
      addEvent(`${player.name} declarou ${actionLabel}${targetTxt}.`, 'alert', 'ACTION_DECLARED');

      // Se a ação alega cargo de personagem (Caixa 2, Extorsão, Execução, Troca, Mandado, Acordo), abre contestação ("Fake News!")
      if (claimedRole) {
        return openResponseWindow(state, 'WAITING_CHALLENGE_ACTION', senderPlayerId);
      }

      // Se é Vaquinha Virtual, pode ser bloqueada por Barão
      if (intent.actionType === 'crowdfunding') {
        return advanceAfterActionChallengeWindow(state);
      }

      // Se é Impeachment Comum (C$ 7), abre janela de bloqueio exclusivo para o alvo alegar Intocável (pagando C$ 3)
      if (intent.actionType === 'commonImpeachment') {
        return advanceAfterActionChallengeWindow(state);
      }

      // Ações sem contestação nem bloqueio (Salário Oficial, Impeachment Definitivo) resolvem imediatamente
      return resolveApprovedAction(state);
    }

    case 'DECLARE_CHALLENGE': {
      const intent = command.payload as ChallengeIntent;
      const isBlockChallenge = intent.isChallengeOnBlock;

      if (!isBlockChallenge && state.publicState.phase !== 'WAITING_CHALLENGE_ACTION') {
        return createRejection('INVALID_PHASE', 'Não há declaração de ação aberta para contestar.');
      }
      if (isBlockChallenge && state.publicState.phase !== 'WAITING_CHALLENGE_BLOCK') {
        return createRejection('INVALID_PHASE', 'Não há bloqueio aberto para contestar.');
      }

      const pending = state.publicState.pendingAction;
      if (!pending) return createRejection('WINDOW_CLOSED', 'Nenhuma ação pendente.');

      const challenger = state.publicState.players[senderPlayerId];
      if (!challenger || !challenger.isAlive) {
        return createRejection('PLAYER_NOT_ALIVE', 'Apenas jogadores ativos podem contestar.');
      }

      const suspectPlayerId = isBlockChallenge ? pending.blockedByPlayerId : pending.sourcePlayerId;
      if (!suspectPlayerId || suspectPlayerId === senderPlayerId) {
        return createRejection('INVALID_TARGET', 'Você não pode contestar sua própria alegação.');
      }

      const claimedRole = isBlockChallenge ? pending.claimedBlockRole : pending.claimedRole;
      if (!claimedRole) {
        return createRejection('INVALID_PHASE', 'Esta ação/bloqueio não envolve alegação de personagem.');
      }

      const suspectName = state.publicState.players[suspectPlayerId]?.name || 'Jogador';
      addEvent(
        `🚨 FAKE NEWS! ${challenger.name} contestou a alegação de ${getRoleDisplayName(claimedRole)} de ${suspectName}!`,
        'breaking',
        'CHALLENGE_DECLARED'
      );

      // Verificação no estado privado do host
      const suspectHand = state.privateHands[suspectPlayerId] || [];
      const matchingCard = suspectHand.find((c) => !c.isLost && c.roleSlug === claimedRole);

      if (matchingCard) {
        // VERDADEIRO! O desafiado realmente tinha o cargo alegado
        addEvent(`Comprovado! ${suspectName} provou possuir ${getRoleDisplayName(claimedRole)}.`, 'alert', 'CHALLENGE_PROVED');

        // A reposição só ocorre depois da perda, se a partida continuar.
        state.lossContinuation = {
          next: isBlockChallenge ? 'end' : 'block',
          provedCard: { playerId: suspectPlayerId, cardId: matchingCard.id },
        };

        // O desafiante perde 1 apoio
        addEvent(`${challenger.name} falhou na contestação e perderá 1 Apoio!`, 'alert', 'CHALLENGE_FAILED');

        if (isBlockChallenge) {
          // Se o bloqueio era verdadeiro, o bloqueio teve sucesso. O impeachment/ataque foi evitado!
          state.publicState = {
            ...state.publicState,
            pendingAction: null,
          };
          return prepareCardLoss(state, senderPlayerId, `Perdeu contestação contra o bloqueio de ${suspectName}`);
        } else {
          // Se a ação principal era verdadeira, o desafiante perde o apoio e a ação segue
          return prepareCardLoss(state, senderPlayerId, `Perdeu contestação contra ${suspectName}`);
        }
      } else {
        // BLEFE DESMASCARADO! O desafiado não tinha a carta alegada
        addEvent(`Blefe desmascarado! ${suspectName} mentiu sobre ter ${getRoleDisplayName(claimedRole)}!`, 'breaking', 'BLUFF_EXPOSED');

        if (isBlockChallenge) {
          // Se o bloqueio era mentira, o bloqueador mentiroso perde 1 apoio pelo blefe
          // E como o bloqueio falhou, a ação do atacante é resolvida!
          state.publicState = {
            ...state.publicState,
            pendingAction: {
              ...pending,
              blockedByPlayerId: undefined,
              claimedBlockRole: undefined,
            },
          };
          state.lossContinuation = { next: 'resolve' };
          return prepareCardLoss(state, suspectPlayerId, 'Tentativa de bloqueio ilegítima desmascarada');
        } else {
          // Se era a ação principal que era blefe, a ação é totalmente anulada!
          state.publicState = {
            ...state.publicState,
            pendingAction: null,
          };
          return prepareCardLoss(state, suspectPlayerId, 'Ação ilegítima cancelada');
        }
      }
    }

    case 'DECLARE_BLOCK': {
      if (state.publicState.phase !== 'WAITING_BLOCK') {
        return createRejection('INVALID_PHASE', 'Não há janela de bloqueio aberta.');
      }
      const pending = state.publicState.pendingAction;
      if (!pending) return createRejection('WINDOW_CLOSED', 'Nenhuma ação pendente.');

      const blocker = state.publicState.players[senderPlayerId];
      if (!blocker || !blocker.isAlive) {
        return createRejection('PLAYER_NOT_ALIVE', 'Jogador não está ativo.');
      }

      const intent = command.payload as BlockIntent;
      const claimedBlockRole = intent.claimedBlockRole;

      if (!getEligibleBlockRoles(state.publicState, pending, senderPlayerId).includes(claimedBlockRole)) {
        return createRejection('NOT_ELIGIBLE_TO_REACT', 'Defesa, alvo ou saldo inválido.');
      }
      if (pending.actionType === 'commonImpeachment') {
        state.publicState.players[senderPlayerId] = { ...blocker, coins: blocker.coins - 3 };
      }
      state.publicState = {
        ...state.publicState,
        pendingAction: { ...pending, blockedByPlayerId: senderPlayerId, claimedBlockRole },
      };

      addEvent(
        `🛡️ BLOQUEIO! ${blocker.name} alegou ${getRoleDisplayName(claimedBlockRole)} para bloquear a ação!`,
        'alert',
        'BLOCK_DECLARED'
      );

      return openResponseWindow(state, 'WAITING_CHALLENGE_BLOCK', senderPlayerId);
    }

    case 'PASS_RESPONSE': {
      state.playersPassedResponse.add(senderPlayerId);
      state.publicState = {
        ...state.publicState,
        responsePlayerIds: state.publicState.responsePlayerIds.slice(1),
        revision: state.publicState.revision + 1,
        deadlineAt: Date.now() + responseDuration(state),
      };
      if (state.publicState.responsePlayerIds.length) return engineResult(state);
      if (state.publicState.phase === 'WAITING_CHALLENGE_ACTION') return advanceAfterActionChallengeWindow(state);
      if (state.publicState.phase === 'WAITING_BLOCK') return resolveApprovedAction(state);
      return finishTurn(state);
    }

    case 'CHOOSE_CARD': {
      if (state.publicState.phase !== 'WAITING_CARD_CHOICE') {
        return createRejection('INVALID_PHASE', 'Não há descarte ou perda de apoio pendente.');
      }
      if (state.publicState.cardChoicePlayerId !== senderPlayerId) {
        return createRejection('NOT_YOUR_TURN', 'Outro jogador deve selecionar a carta.');
      }

      const { cardId } = command.payload;
      const hand = state.privateHands[senderPlayerId] || [];
      const card = hand.find((c) => c.id === cardId && !c.isLost);

      if (!card) {
        return createRejection('INVALID_TARGET', 'Carta de apoio não encontrada ou já eliminada.');
      }

      // Marca carta como perdida e revela publicamente
      const updatedHand = hand.map((c) => (c.id === cardId ? { ...c, isLost: true } : c));
      state.privateHands[senderPlayerId] = updatedHand;

      const player = state.publicState.players[senderPlayerId];
      const activeCount = updatedHand.filter((c) => !c.isLost).length;

      const revealed: RevealedCard = {
        id: card.id,
        roleSlug: card.roleSlug,
        lostByPlayerId: senderPlayerId,
        reason: state.publicState.cardChoiceReason || 'Eliminação de Apoio',
      };

      if (player) {
        state.publicState.players[senderPlayerId] = {
          ...player,
          activeSupportCount: activeCount,
          lostCards: [...player.lostCards, revealed],
          isAlive: activeCount > 0,
        };
      }

      state.publicState = {
        ...state.publicState,
        discard: [revealed, ...state.publicState.discard],
        cardChoicePlayerId: null,
        cardChoiceReason: null,
      };

      addEvent(
        `💥 APOIO PERDIDO! ${player?.name || 'Jogador'} perdeu o apoio de ${getRoleDisplayName(card.roleSlug)}.`,
        'breaking',
        'SUPPORT_LOST'
      );

      if (activeCount === 0) {
        addEvent(`⛔ ELIMINAÇÃO! ${player?.name || 'Jogador'} perdeu todos os apoios e está fora do jogo!`, 'breaking', 'PLAYER_ELIMINATED');
      }

      // Verifica condição de vitória imediatamente
      const remainingAlive = state.publicState.playerOrder.filter((id) => state.publicState.players[id]?.isAlive);
      if (remainingAlive.length <= 1) {
        const winnerId = remainingAlive[0] || null;
        const winnerName = winnerId ? state.publicState.players[winnerId]?.name : 'Vencedor';
        state.publicState = {
          ...state.publicState,
          phase: 'FINISHED',
          pendingAction: null,
          deadlineAt: null,
          responsePlayerIds: [],
          winnerPlayerId: winnerId,
          revision: state.publicState.revision + 1,
        };
        addEvent(`🏆 VITÓRIA POLÍTICA! ${winnerName} assumiu o controle absoluto dos Bastidores do Poder!`, 'breaking', 'GAME_FINISHED');
        state.lossContinuation = undefined;
        return engineResult(state);
      }

      const continuation = state.lossContinuation;
      state.lossContinuation = undefined;
      if (continuation?.provedCard) {
        const { playerId, cardId } = continuation.provedCard;
        const hand = state.privateHands[playerId] || [];
        const proved = hand.find(card => card.id === cardId && !card.isLost);
        if (proved) {
          state.deck = shuffleDeck([...state.deck, { id: proved.id, roleSlug: proved.roleSlug }]);
          const replacement = state.deck.pop()!;
          state.privateHands[playerId] = hand.map(card => card.id === cardId ? { ...replacement, isLost: false } : card);
        }
      }
      if (continuation?.next === 'block') return advanceAfterActionChallengeWindow(state);
      if (continuation?.next === 'resolve') return resolveApprovedAction(state);
      return finishTurn(state);
    }

    case 'CHOOSE_EXCHANGE': {
      if (state.publicState.phase !== 'WAITING_EXCHANGE_CHOICE') {
        return createRejection('INVALID_PHASE', 'Não há troca de cartas em andamento.');
      }
      if (state.publicState.cardChoicePlayerId !== senderPlayerId) {
        return createRejection('NOT_YOUR_TURN', 'Outro jogador está executando a troca.');
      }

      const { returnedCardIds } = command.payload;
      if (!returnedCardIds || returnedCardIds.length !== 2) {
        return createRejection('INVALID_TARGET', 'Você deve selecionar exatamente 2 cartas para devolver.');
      }

      const hand = state.privateHands[senderPlayerId] || [];
      const cardsToReturn: CardRef[] = [];
      const keptHand: SupportCard[] = [];

      for (const card of hand) {
        if (!card.isLost && (card.id === returnedCardIds[0] || card.id === returnedCardIds[1])) {
          cardsToReturn.push({ id: card.id, roleSlug: card.roleSlug });
        } else {
          keptHand.push(card);
        }
      }

      if (cardsToReturn.length !== 2) {
        return createRejection('INVALID_TARGET', 'As cartas selecionadas para devolução são inválidas.');
      }

      // Devolve exatamente 2 cartas ao baralho e reembaralha (conserva estritamente 24 cartas, 3 de cada)
      state.deck.push(...cardsToReturn);
      state.deck = shuffleDeck(state.deck);
      state.privateHands[senderPlayerId] = keptHand;

      const player = state.publicState.players[senderPlayerId];
      if (player) {
        state.publicState.players[senderPlayerId] = {
          ...player,
          activeSupportCount: keptHand.filter((c) => !c.isLost).length,
        };
      }

      state.publicState = {
        ...state.publicState,
        deckCount: state.deck.length,
        pendingAction: null,
        cardChoicePlayerId: null,
        cardChoiceReason: null,
      };

      addEvent(`${player?.name || 'Jogador'} devolveu 2 cartas e reembaralhou o baralho central.`, 'normal');
      return finishTurn(state);
    }

    default:
      return createRejection('INVALID_COMMAND', 'Comando não executável pela engine.');
  }
};

/**
 * Avança após a janela de contestação da ação principal.
 */
const advanceAfterActionChallengeWindow = (state: AuthoritativeGameState): EngineExecutionResult => {
  const pending = state.publicState.pendingAction;
  if (!pending) return finishTurn(state);

  if (pending.targetPlayerId && !state.publicState.players[pending.targetPlayerId]?.isAlive) return finishTurn(state);
  if (getBlockRoles(pending.actionType).length) return openResponseWindow(state, 'WAITING_BLOCK', pending.sourcePlayerId);
  return resolveApprovedAction(state);
};

/**
 * Aplica os efeitos da ação aprovada (após passar por contestações e bloqueios).
 */
const resolveApprovedAction = (state: AuthoritativeGameState): EngineExecutionResult => {
  const pending = state.publicState.pendingAction;
  if (!pending) return finishTurn(state);

  const source = state.publicState.players[pending.sourcePlayerId];
  if (!source?.isAlive) return finishTurn(state);
  if (pending.targetPlayerId && !state.publicState.players[pending.targetPlayerId]?.isAlive) return finishTurn(state);

  const addEvent = (msg: string, importance: GameEvent['importance'] = 'normal'): void => {
    state.publicState = {
      ...state.publicState,
      history: [
        {
          id: `ev-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          timestamp: Date.now(),
          type: 'ACTION_RESOLVED',
          message: msg,
          importance,
        },
        ...state.publicState.history.slice(0, 49),
      ],
    };
  };

  switch (pending.actionType) {
    case 'salary': {
      state.publicState.players[pending.sourcePlayerId] = {
        ...source,
        coins: source.coins + 1,
      };
      addEvent(`${source.name} recebeu C$ 1 do Salário Oficial.`, 'normal');
      state.publicState = { ...state.publicState, pendingAction: null };
      return finishTurn(state);
    }

    case 'crowdfunding': {
      state.publicState.players[pending.sourcePlayerId] = {
        ...source,
        coins: source.coins + 2,
      };
      addEvent(`${source.name} arrecadou C$ 2 com a Vaquinha Virtual.`, 'normal');
      state.publicState = { ...state.publicState, pendingAction: null };
      return finishTurn(state);
    }

    case 'slushFund': {
      state.publicState.players[pending.sourcePlayerId] = {
        ...source,
        coins: source.coins + 3,
      };
      addEvent(`${source.name} embolsou C$ 3 do Caixa 2.`, 'alert');
      state.publicState = { ...state.publicState, pendingAction: null };
      return finishTurn(state);
    }

    case 'extortion': {
      if (pending.targetPlayerId) {
        const target = state.publicState.players[pending.targetPlayerId];
        if (target && target.isAlive) {
          const stolen = Math.min(target.coins, 2);
          state.publicState.players[pending.targetPlayerId] = {
            ...target,
            coins: target.coins - stolen,
          };
          state.publicState.players[pending.sourcePlayerId] = {
            ...source,
            coins: source.coins + stolen,
          };
          addEvent(`${source.name} extorquiu C$ ${stolen} de ${target.name}.`, 'alert');
        }
      }
      state.publicState = { ...state.publicState, pendingAction: null };
      return finishTurn(state);
    }

    case 'backroomDeal': {
      if (!pending.targetPlayerId || !state.publicState.players[pending.targetPlayerId]?.isAlive) return finishTurn(state);
      state.publicState.players[pending.sourcePlayerId] = {
        ...source,
        coins: source.coins + 2,
      };
      if (pending.targetPlayerId) {
        const partner = state.publicState.players[pending.targetPlayerId];
        if (partner && partner.isAlive) {
          state.publicState.players[pending.targetPlayerId] = {
            ...partner,
            coins: partner.coins + 1,
          };
          addEvent(`${source.name} fechou acordo: +C$ 2 para si e +C$ 1 para ${partner.name}.`, 'normal');
        }
      }
      state.publicState = { ...state.publicState, pendingAction: null };
      return finishTurn(state);
    }

    case 'exchange': {
      const pId = pending.sourcePlayerId;
      const hand = state.privateHands[pId] || [];
      const drawn: SupportCard[] = [];

      const c1 = state.deck.pop();
      if (c1) drawn.push({ id: c1.id, roleSlug: c1.roleSlug, isLost: false });
      const c2 = state.deck.pop();
      if (c2) drawn.push({ id: c2.id, roleSlug: c2.roleSlug, isLost: false });

      // Adiciona as 2 cartas compradas temporariamente para o jogador selecionar 2 para devolver
      state.privateHands[pId] = [...hand, ...drawn];
      state.publicState = {
        ...state.publicState,
        deckCount: state.deck.length,
        phase: 'WAITING_EXCHANGE_CHOICE',
        cardChoicePlayerId: pId,
        cardChoiceReason: 'Troca da Marqueteira: escolha 2 cartas para devolver ao baralho central.',
        deadlineAt: Date.now() + state.settings.choiceTimeoutMs,
        revision: state.publicState.revision + 1,
      };

      addEvent(`${source.name} comprou 2 cartas do baralho e está selecionando 2 para devolver.`, 'alert');

      return {
        nextAuthoritativeState: state,
        broadcastPublicState: state.publicState,
        privateUpdates: getAuthoritativePrivateUpdates(state),
      };
    }

    case 'execution':
    case 'commonImpeachment':
    case 'definitiveImpeachment': {
      if (pending.targetPlayerId) {
        const target = state.publicState.players[pending.targetPlayerId];
        if (target && target.isAlive) {
          // Mantém pendingAction para identificar a razão e limpa após CHOOSE_CARD
          return prepareCardLoss(state, pending.targetPlayerId, `Ataque de ${source.name} (${getActionDisplayName(pending.actionType)})`);
        }
      }
      state.publicState = { ...state.publicState, pendingAction: null };
      return finishTurn(state);
    }

    case 'searchWarrant': {
      if (pending.targetPlayerId && pending.namedRole) {
        const target = state.publicState.players[pending.targetPlayerId];
        const targetHand = state.privateHands[pending.targetPlayerId] || [];
        const hasNamedRole = targetHand.some((c) => !c.isLost && c.roleSlug === pending.namedRole);
        state.privateNotices[pending.sourcePlayerId] = hasNamedRole
          ? `Mandado: encontrado ${getRoleDisplayName(pending.namedRole)} em ${target?.name}. Um apoio foi perdido.`
          : `Mandado contra ${target?.name}: nada encontrado.`;

        if (hasNamedRole) {
          addEvent(`Mandado de Busca bem-sucedido! ${target?.name} possuía ${getRoleDisplayName(pending.namedRole)} e perderá o apoio.`, 'breaking');
          const targetCard = targetHand.find((c) => !c.isLost && c.roleSlug === pending.namedRole);
          if (targetCard) {
            const updatedHand = targetHand.map((c) => (c.id === targetCard.id ? { ...c, isLost: true } : c));
            state.privateHands[pending.targetPlayerId] = updatedHand;
            const remaining = updatedHand.filter((c) => !c.isLost).length;

            const revealed: RevealedCard = {
              id: targetCard.id,
              roleSlug: targetCard.roleSlug,
              lostByPlayerId: pending.targetPlayerId,
              reason: 'Mandado de Busca apreendeu o apoio',
            };

            if (target) {
              state.publicState.players[pending.targetPlayerId] = {
                ...target,
                activeSupportCount: remaining,
                lostCards: [...target.lostCards, revealed],
                isAlive: remaining > 0,
              };
            }
            state.publicState = {
              ...state.publicState,
              discard: [revealed, ...state.publicState.discard],
            };
          }
        } else {
          addEvent(`Mandado de Busca infrutífero: ${target?.name} não possuía o apoio investigado.`, 'normal');
        }
      }
      state.publicState = { ...state.publicState, pendingAction: null };
      return finishTurn(state);
    }

    default:
      state.publicState = { ...state.publicState, pendingAction: null };
      return finishTurn(state);
  }
};

/**
 * Prepara a fase de perda de carta para o jogador especificado.
 */
const prepareCardLoss = (
  state: AuthoritativeGameState,
  targetPlayerId: string,
  reason: string
): EngineExecutionResult => {
  const hand = state.privateHands[targetPlayerId] || [];
  const activeCards = hand.filter((c) => !c.isLost);

  if (activeCards.length === 0) {
    return finishTurn(state);
  }

  // Define a fase e alvos de perda de carta ANTES de qualquer execução
  state.publicState = {
    ...state.publicState,
    phase: 'WAITING_CARD_CHOICE',
    responsePlayerIds: [],
    cardChoicePlayerId: targetPlayerId,
    cardChoiceReason: reason,
    deadlineAt: Date.now() + state.settings.choiceTimeoutMs,
    revision: state.publicState.revision + 1,
  };

  if (activeCards.length === 1 && activeCards[0]) {
    // Se só tem 1 carta ativa, perde automaticamente
    return executeCommand(
      state,
      {
        type: 'CHOOSE_CARD',
        payload: { cardId: activeCards[0].id },
      },
      targetPlayerId,
      `auto-loss-${Date.now()}`
    );
  }

  return {
    nextAuthoritativeState: state,
    broadcastPublicState: state.publicState,
    privateUpdates: getAuthoritativePrivateUpdates(state),
  };
};

/**
 * Finaliza o turno atual e passa para o próximo jogador vivo.
 */
export const finishTurn = (state: AuthoritativeGameState): EngineExecutionResult => {
  state.lossContinuation = undefined;
  state.publicState = { ...state.publicState, responsePlayerIds: [], cardChoicePlayerId: null, cardChoiceReason: null };
  const alivePlayers = state.publicState.playerOrder.filter((id) => state.publicState.players[id]?.isAlive);

  if (alivePlayers.length <= 1) {
    const winnerId = alivePlayers[0] || null;
    state.publicState = {
      ...state.publicState,
      phase: 'FINISHED',
      winnerPlayerId: winnerId,
      pendingAction: null,
      deadlineAt: null,
      revision: state.publicState.revision + 1,
    };
    return {
      nextAuthoritativeState: state,
      broadcastPublicState: state.publicState,
      privateUpdates: getAuthoritativePrivateUpdates(state),
    };
  }

  // Encontra o próximo jogador vivo
  const currentIdx = state.publicState.playerOrder.indexOf(state.publicState.activePlayerId);
  let nextIdx = (currentIdx + 1) % state.publicState.playerOrder.length;

  while (!state.publicState.players[state.publicState.playerOrder[nextIdx] || '']?.isAlive) {
    nextIdx = (nextIdx + 1) % state.publicState.playerOrder.length;
  }

  const nextPlayerId = state.publicState.playerOrder[nextIdx] || alivePlayers[0] || '';
  const nextPlayer = state.publicState.players[nextPlayerId];

  state.publicState = {
    ...state.publicState,
    phase: 'WAITING_ACTION',
    turn: state.publicState.turn + 1,
    activePlayerId: nextPlayerId,
    pendingAction: null,
    cardChoicePlayerId: null,
    cardChoiceReason: null,
    deadlineAt: Date.now() + state.settings.actionTimeoutMs,
    revision: state.publicState.revision + 1,
    history: [
      {
        id: `ev-${Date.now()}-turn-${state.publicState.turn + 1}`,
        timestamp: Date.now(),
        type: 'TURN_CHANGED',
        message: `Turno ${state.publicState.turn + 1}: a vez é de ${nextPlayer?.name || 'Jogador'}.`,
        importance: 'normal',
      },
      ...state.publicState.history.slice(0, 49),
    ],
  };
  state.playersPassedResponse.clear();

  return {
    nextAuthoritativeState: state,
    broadcastPublicState: state.publicState,
    privateUpdates: getAuthoritativePrivateUpdates(state),
  };
};

const getAuthoritativePrivateUpdates = (state: AuthoritativeGameState): Record<string, PrivatePlayerView> => {
  const updates: Record<string, PrivatePlayerView> = {};
  for (const pId of Object.keys(state.publicState.players)) {
    updates[pId] = {
      playerId: pId,
      supports: state.privateHands[pId] || [],
      searchResultNotice: state.privateNotices[pId],
    };
  }
  return updates;
};

const engineResult = (state: AuthoritativeGameState): EngineExecutionResult => ({
  nextAuthoritativeState: state,
  broadcastPublicState: state.publicState,
  privateUpdates: getAuthoritativePrivateUpdates(state),
});

const responseDuration = (state: AuthoritativeGameState): number =>
  state.publicState.phase === 'WAITING_BLOCK' ? state.settings.reactionTimeoutMs : state.settings.challengeTimeoutMs;

const openResponseWindow = (
  state: AuthoritativeGameState,
  phase: 'WAITING_BLOCK' | 'WAITING_CHALLENGE_ACTION' | 'WAITING_CHALLENGE_BLOCK',
  declarer: string,
): EngineExecutionResult => {
  const pending = state.publicState.pendingAction;
  const eligible = clockwiseOpponents(state.publicState, declarer).filter(id =>
    phase !== 'WAITING_BLOCK' || (pending && getEligibleBlockRoles(state.publicState, pending, id).length > 0));
  state.playersPassedResponse.clear();
  state.publicState = {
    ...state.publicState, phase, responsePlayerIds: eligible,
    revision: state.publicState.revision + 1,
  };
  if (!eligible.length) {
    if (phase === 'WAITING_BLOCK') return resolveApprovedAction(state);
    if (phase === 'WAITING_CHALLENGE_ACTION') return advanceAfterActionChallengeWindow(state);
    return finishTurn(state);
  }
  state.publicState = { ...state.publicState, deadlineAt: Date.now() + responseDuration(state) };
  return engineResult(state);
};

/** Entrada exclusiva do host; não é um comando aceito pela rede. */
export const executeTimeout = (state: AuthoritativeGameState, now = Date.now()): EngineExecutionResult => {
  const pub = state.publicState;
  if (!pub.deadlineAt || now < pub.deadlineAt || pub.phase === 'FINISHED') return engineResult(state);
  const run = (command: ClientCommand, id: string) => executeCommand(state, command, id, `timeout-${now}`);
  const responder = pub.responsePlayerIds[0];
  if (responder) return run({ type: 'PASS_RESPONSE', payload: { pass: true } }, responder);
  if (pub.phase === 'WAITING_ACTION') {
    const mustImpeach = (pub.players[pub.activePlayerId]?.coins ?? 0) >= 10;
    return run({ type: 'DECLARE_ACTION', payload: {
      actionType: mustImpeach ? 'definitiveImpeachment' : 'salary',
      targetPlayerId: mustImpeach ? clockwiseOpponents(pub, pub.activePlayerId)[0] : undefined,
    } }, pub.activePlayerId);
  }
  const id = pub.cardChoicePlayerId;
  const cards = id ? (state.privateHands[id] || []).filter(card => !card.isLost) : [];
  if (id && pub.phase === 'WAITING_CARD_CHOICE' && cards[0]) {
    return run({ type: 'CHOOSE_CARD', payload: { cardId: cards[0].id } }, id);
  }
  if (id && pub.phase === 'WAITING_EXCHANGE_CHOICE' && cards.length >= 2) {
    // Devolve as duas cartas recém-compradas, preservando a mão anterior.
    return run({ type: 'CHOOSE_EXCHANGE', payload: { returnedCardIds: [cards[cards.length - 2]!.id, cards[cards.length - 1]!.id] } }, id);
  }
  return engineResult(state);
};

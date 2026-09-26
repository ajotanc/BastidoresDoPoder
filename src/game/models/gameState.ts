import type { RoleSlug } from '@/types/game';

/**
 * Fases da máquina de estados do jogo Bastidores do Poder.
 */
export type GamePhase =
  | 'LOBBY'
  | 'DEALING'
  | 'TURN_START'
  | 'WAITING_ACTION'
  | 'ACTION_DECLARED'
  | 'WAITING_CHALLENGE_ACTION'
  | 'WAITING_BLOCK'
  | 'WAITING_CHALLENGE_BLOCK'
  | 'RESOLVING_CHALLENGE'
  | 'RESOLVING_ACTION'
  | 'WAITING_CARD_CHOICE'
  | 'WAITING_EXCHANGE_CHOICE'
  | 'TURN_END'
  | 'FINISHED';

/**
 * Identificador e referência de uma carta no baralho ou mão.
 */
export interface CardRef {
  readonly id: string;
  readonly roleSlug: RoleSlug;
}

/**
 * Carta de apoio em posse de um jogador (privada até ser perdida).
 */
export interface SupportCard {
  readonly id: string;
  readonly roleSlug: RoleSlug;
  readonly isLost: boolean;
}

/**
 * Carta revelada publicamente (descartada ou eliminada).
 */
export interface RevealedCard {
  readonly id: string;
  readonly roleSlug: RoleSlug;
  readonly lostByPlayerId: string;
  readonly reason: string;
}

/**
 * Estado público de um jogador na mesa (visível a todos).
 */
export interface PublicPlayerState {
  readonly id: string;
  readonly name: string;
  readonly avatarSlug: RoleSlug;
  readonly coins: number;
  readonly activeSupportCount: number;
  readonly lostCards: readonly RevealedCard[];
  readonly isAlive: boolean;
  readonly isReady: boolean;
  readonly isConnected: boolean;
}

/**
 * Ação declarada pendente de resolução ou contestação.
 */
export type ActionType =
  | 'salary'
  | 'crowdfunding'
  | 'slushFund'
  | 'extortion'
  | 'execution'
  | 'exchange'
  | 'searchWarrant'
  | 'backroomDeal'
  | 'commonImpeachment'
  | 'definitiveImpeachment';

export interface PendingAction {
  readonly actionType: ActionType;
  readonly sourcePlayerId: string;
  readonly targetPlayerId?: string;
  readonly claimedRole?: RoleSlug;
  readonly namedRole?: RoleSlug;
  readonly secondaryPlayerId?: string;
  readonly costPaid: number;
  readonly blockedByPlayerId?: string;
  readonly claimedBlockRole?: RoleSlug;
  readonly challengedByPlayerId?: string;
  readonly isChallengingBlock?: boolean;
}

/**
 * Evento do feed de notícias do jogo.
 */
export interface GameEvent {
  readonly id: string;
  readonly timestamp: number;
  readonly type: string;
  readonly message: string;
  readonly importance: 'normal' | 'alert' | 'breaking';
}

/**
 * Configurações da partida.
 */
export interface GameSettings {
  readonly actionTimeoutMs: number;
  readonly reactionTimeoutMs: number;
  readonly challengeTimeoutMs: number;
  readonly choiceTimeoutMs: number;
  readonly initialCoins: number;
}

export const MIN_PLAYERS_TO_START = 2;
export const MAX_PLAYERS_PER_ROOM = 8;

export const DEFAULT_GAME_SETTINGS: GameSettings = {
  actionTimeoutMs: 45000,
  reactionTimeoutMs: 12000,
  challengeTimeoutMs: 10000,
  choiceTimeoutMs: 20000,
  initialCoins: 2,
};

/**
 * Estado público autoritativo do jogo compartilhado pelo Host.
 */
export interface GameState {
  readonly gameId: string;
  readonly roomCode: string;
  readonly revision: number;
  readonly phase: GamePhase;
  readonly turn: number;
  readonly activePlayerId: string;
  readonly playerOrder: readonly string[];
  readonly players: Record<string, PublicPlayerState>;
  readonly deckCount: number;
  readonly discard: readonly RevealedCard[];
  readonly pendingAction: PendingAction | null;
  readonly deadlineAt: number | null;
  readonly winnerPlayerId: string | null;
  readonly history: readonly GameEvent[];
  readonly cardChoicePlayerId: string | null;
  readonly cardChoiceReason: string | null;
  readonly responsePlayerIds: readonly string[];
}

/**
 * Visão estritamente privada enviada apenas para o jogador autorizado.
 */
export interface PrivatePlayerView {
  readonly playerId: string;
  readonly supports: readonly SupportCard[];
  readonly selectableCards?: readonly CardRef[];
  readonly searchResultNotice?: string;
}

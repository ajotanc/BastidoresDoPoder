import type { RoleSlug } from '@/types/game';
import type { ActionType, GameSettings } from './gameState';

/**
 * Razões de rejeição de um comando enviado pelo cliente.
 */
export type CommandRejectReason =
  | 'NOT_YOUR_TURN'
  | 'INVALID_PHASE'
  | 'WINDOW_CLOSED'
  | 'INSUFFICIENT_FUNDS'
  | 'INVALID_TARGET'
  | 'STALE_STATE'
  | 'PLAYER_NOT_ALIVE'
  | 'MUST_IMPEACH_OVER_10'
  | 'NOT_ELIGIBLE_TO_REACT'
  | 'INVALID_COMMAND'
  | 'UNAUTHORIZED'
  | 'ROOM_FULL';

export interface CommandReject {
  readonly messageId: string;
  readonly reason: CommandRejectReason;
  readonly description: string;
}

export interface JoinPayload {
  readonly name: string;
  readonly avatarSlug: RoleSlug;
  readonly reconnectToken: string;
}

export interface ActionIntent {
  readonly actionType: ActionType;
  readonly targetPlayerId?: string;
  readonly namedRole?: RoleSlug;
  readonly secondaryPlayerId?: string;
}

export interface BlockIntent {
  readonly claimedBlockRole: RoleSlug;
}

export interface ChallengeIntent {
  readonly isChallengeOnBlock: boolean;
}

export interface ResponseIntent {
  readonly pass: true;
}

export interface CardChoicePayload {
  readonly cardId: string;
}

export interface ExchangeChoicePayload {
  readonly returnedCardIds: readonly [string, string];
}

export interface ReconnectPayload {
  readonly playerId: string;
  readonly reconnectToken: string;
}

export interface HostStartGamePayload {
  readonly settings?: Partial<GameSettings>;
}

/**
 * União estrita de todos os comandos que um jogador pode emitir.
 */
export type ClientCommand =
  | { readonly type: 'JOIN_ROOM'; readonly payload: JoinPayload }
  | { readonly type: 'SET_READY'; readonly payload: { readonly ready: boolean } }
  | { readonly type: 'START_GAME'; readonly payload: HostStartGamePayload }
  | { readonly type: 'DECLARE_ACTION'; readonly payload: ActionIntent }
  | { readonly type: 'DECLARE_BLOCK'; readonly payload: BlockIntent }
  | { readonly type: 'DECLARE_CHALLENGE'; readonly payload: ChallengeIntent }
  | { readonly type: 'PASS_RESPONSE'; readonly payload: ResponseIntent }
  | { readonly type: 'CHOOSE_CARD'; readonly payload: CardChoicePayload }
  | { readonly type: 'CHOOSE_EXCHANGE'; readonly payload: ExchangeChoicePayload }
  | { readonly type: 'RECONNECT'; readonly payload: ReconnectPayload };

/**
 * Envelope para empacotamento com controle de versão e timestamp.
 */
export interface Envelope<T> {
  readonly protocol: 1;
  readonly messageId: string;
  readonly roomCode: string;
  readonly playerId: string;
  readonly revision?: number;
  readonly sentAt: number;
  readonly data: T;
}

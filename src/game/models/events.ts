import type { GameState, PrivatePlayerView } from './gameState';
import type { CommandReject } from './commands';

/**
 * Mensagens transmitidas pelo Host pela rede PeerJS.
 */
export type HostServerMessage =
  | { readonly type: 'ROOM_SNAPSHOT'; readonly state: GameState }
  | { readonly type: 'PRIVATE_VIEW'; readonly view: PrivatePlayerView }
  | { readonly type: 'COMMAND_REJECTED'; readonly reject: CommandReject }
  | { readonly type: 'COMMAND_ACK'; readonly messageId: string; readonly revision: number }
  | { readonly type: 'HEARTBEAT_ACK'; readonly timestamp: number };

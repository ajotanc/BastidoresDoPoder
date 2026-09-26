import type { Envelope, ClientCommand } from '@/game/models/commands';
import type { HostServerMessage } from '@/game/models/events';
import { isClientCommand, isIdentifier, isRecord } from '@/game/models/validation';

export type WireMessageFromClient = Envelope<ClientCommand>;
export type WireMessageFromHost = HostServerMessage;

/**
 * Validador de tipo seguro para comandos vindos do cliente.
 */
export const isClientEnvelope = (data: unknown): data is WireMessageFromClient => {
  if (typeof data !== 'object' || data === null) return false;
  const obj = data as Record<string, unknown>;
  return (
    obj.protocol === 1 &&
    isIdentifier(obj.messageId) &&
    typeof obj.roomCode === 'string' &&
    obj.roomCode.length <= 32 &&
    isIdentifier(obj.playerId) &&
    typeof obj.sentAt === 'number' && Number.isFinite(obj.sentAt) &&
    (obj.revision === undefined || (Number.isSafeInteger(obj.revision) && Number(obj.revision) >= 1)) &&
    isClientCommand(obj.data)
  );
};

/**
 * Validador de tipo seguro para mensagens vindas do host.
 */
export const isHostServerMessage = (data: unknown): data is WireMessageFromHost => {
  if (typeof data !== 'object' || data === null) return false;
  const obj = data as Record<string, unknown>;
  switch (obj.type) {
    case 'ROOM_SNAPSHOT': return isRecord(obj.state) && Number.isSafeInteger(obj.state.revision) &&
      isRecord(obj.state.players) && Array.isArray(obj.state.playerOrder) && Array.isArray(obj.state.responsePlayerIds);
    case 'PRIVATE_VIEW': return isRecord(obj.view) && isIdentifier(obj.view.playerId) && Array.isArray(obj.view.supports);
    case 'COMMAND_REJECTED': return isRecord(obj.reject) && typeof obj.reject.description === 'string' && typeof obj.reject.reason === 'string';
    case 'COMMAND_ACK': return typeof obj.messageId === 'string' && Number.isSafeInteger(obj.revision);
    case 'HEARTBEAT_ACK': return typeof obj.timestamp === 'number';
    default: return false;
  }
};

import Peer, { type DataConnection } from 'peerjs';
import type { GameState, PrivatePlayerView } from '@/game/models/gameState';
import type { ClientCommand } from '@/game/models/commands';
import { roomCodeToPeerId } from '../room/roomCode';
import { isHostServerMessage, type WireMessageFromClient } from './protocol';
import { PEER_SERVER_CONFIG } from './peerConfig';

export interface ClientCallbacks {
  onStateChange: (state: GameState) => void;
  onPrivateViewChange: (view: PrivatePlayerView) => void;
  onError: (errorMessage: string) => void;
  onConnected: () => void;
  onDisconnected: () => void;
}

export class PeerClient {
  private peer: Peer | null = null;
  private connection: DataConnection | null = null;
  private callbacks: ClientCallbacks;
  private revision: number | undefined;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private lastMessageAt = 0;
  private destroyed = false;
  public readonly roomCode: string;
  public readonly playerId: string;

  constructor(roomCode: string, playerId: string, callbacks: ClientCallbacks) {
    this.roomCode = roomCode;
    this.playerId = playerId;
    this.callbacks = callbacks;
  }

  public connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      const peer = new Peer(PEER_SERVER_CONFIG);
      this.peer = peer;
      const connectionTimeout = setTimeout(() => {
        this.destroy();
        reject(new Error('O host não respondeu à conexão.'));
      }, 10000);

      peer.on('open', () => {
        this.peer = peer;
        const hostPeerId = roomCodeToPeerId(this.roomCode);
        const conn = peer.connect(hostPeerId, { reliable: true });

        conn.on('open', () => {
          clearTimeout(connectionTimeout);
          this.connection = conn;
          this.lastMessageAt = Date.now();
          this.heartbeatTimer = setInterval(() => {
            if (Date.now() - this.lastMessageAt > 15000) { conn.close(); return; }
            if (conn.open) conn.send({ type: 'HEARTBEAT' });
          }, 5000);
          this.callbacks.onConnected();
          resolve();
        });

        conn.on('data', (data) => {
          if (isHostServerMessage(data)) {
            this.lastMessageAt = Date.now();
            if (data.type === 'ROOM_SNAPSHOT') {
              if (this.revision !== undefined && data.state.revision < this.revision) return;
              this.revision = data.state.revision;
              this.callbacks.onStateChange(data.state);
            } else if (data.type === 'PRIVATE_VIEW') {
              if (data.view.playerId === this.playerId) this.callbacks.onPrivateViewChange(data.view);
            } else if (data.type === 'COMMAND_REJECTED') {
              this.callbacks.onError(`${data.reject.reason}: ${data.reject.description}`);
            }
          }
        });

        conn.on('close', () => {
          this.connection = null;
          if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
          if (!this.destroyed) this.callbacks.onDisconnected();
        });

        conn.on('error', (err) => {
          clearTimeout(connectionTimeout);
          const message = err.message || 'Erro de conexão com o Host da sala';
          this.callbacks.onError(message);
          conn.close();
          reject(err);
        });
      });

      peer.on('error', (err) => {
        clearTimeout(connectionTimeout);
        const message = err.message || 'Erro no cliente PeerJS';
        this.callbacks.onError(message);
        reject(err);
      });
    });
  }

  public sendCommand(command: ClientCommand): void {
    if (!this.connection || !this.connection.open) {
      this.callbacks.onError('Sem conexão ativa com o Host da sala.');
      return;
    }

    const envelope: WireMessageFromClient = {
      protocol: 1,
      messageId: `cli-msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      roomCode: this.roomCode,
      playerId: this.playerId,
      sentAt: Date.now(),
      revision: this.revision,
      data: command,
    };

    this.connection.send(envelope);
  }

  public destroy(): void {
    this.destroyed = true;
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    if (this.connection) {
      this.connection.close();
      this.connection = null;
    }
    if (this.peer) {
      this.peer.destroy();
      this.peer = null;
    }
  }
}

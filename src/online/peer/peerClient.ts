import { HEARTBEAT_INTERVAL_MS, HEARTBEAT_TIMEOUT_MS, CONNECTION_TIMEOUT_MS } from '@/constants/gameConfig';
import { sendPeerMessage, createPeerMessageReader } from './jsonTransport';
import dayjs from 'dayjs';
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
  private cancelConnect: (() => void) | null = null;
  private leaveTimer: ReturnType<typeof setTimeout> | null = null;
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
      }, CONNECTION_TIMEOUT_MS);

      this.cancelConnect = () => { clearTimeout(connectionTimeout); reject(new Error('Conexão encerrada.')); };

      peer.on('open', () => {
        if (this.destroyed) return;
        this.peer = peer;
        const hostPeerId = roomCodeToPeerId(this.roomCode);
        // BinaryPack transforma undefined em null, inclusive em campos opcionais
        // de ações. JSON preserva o contrato do protocolo omitindo esses campos.
        const conn = peer.connect(hostPeerId, { reliable: true, serialization: 'json' });

        conn.on('open', () => {
          if (this.destroyed) { conn.close(); return; }
          this.connection = conn;
          this.lastMessageAt = dayjs().valueOf();
          let lastHeartbeatCheck = this.lastMessageAt;
          this.heartbeatTimer = setInterval(() => {
            const now = dayjs().valueOf();
            // Timers suspensos não comprovam falha de rede. Ao retomar,
            // primeiro envia uma sondagem e aguarda a resposta do host.
            if (now - lastHeartbeatCheck > HEARTBEAT_TIMEOUT_MS) this.lastMessageAt = now;
            lastHeartbeatCheck = now;
            if (now - this.lastMessageAt > HEARTBEAT_TIMEOUT_MS) { conn.close(); return; }
            if (conn.open) sendPeerMessage(conn, { type: 'HEARTBEAT' });
          }, HEARTBEAT_INTERVAL_MS);
          this.callbacks.onConnected();
        });

        const readMessage = createPeerMessageReader();
        conn.on('data', (raw) => {
          const data = readMessage(raw);
          if (data === undefined) return;
          if (this.destroyed) {
            if (isHostServerMessage(data) && data.type === 'COMMAND_ACK') this.destroy();
            return;
          }
          if (isHostServerMessage(data)) {
            this.lastMessageAt = dayjs().valueOf();
            if (data.type === 'ROOM_SNAPSHOT') {
              clearTimeout(connectionTimeout);
              this.cancelConnect = null;
              resolve();
              if (this.revision !== undefined && data.state.revision < this.revision) return;
              this.revision = data.state.revision;
              this.callbacks.onStateChange(data.state);
            } else if (data.type === 'PRIVATE_VIEW') {
              if (data.view.playerId === this.playerId) this.callbacks.onPrivateViewChange(data.view);
            } else if (data.type === 'COMMAND_REJECTED') {
              const message = `${data.reject.reason}: ${data.reject.description}`;
              reject(new Error(message));
              this.callbacks.onError(message);
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
      messageId: `cli-msg-${dayjs().valueOf()}-${Math.random().toString(36).substring(2, 6)}`,
      roomCode: this.roomCode,
      playerId: this.playerId,
      sentAt: dayjs().valueOf(),
      ...(this.revision === undefined ? {} : { revision: this.revision }),
      data: command,
    };

    sendPeerMessage(this.connection, envelope);
  }

  public leaveRoom(): void {
    this.destroyed = true; // Uma saída voluntária não deve disparar reconexão.
    this.sendCommand({ type: 'LEAVE_ROOM', payload: {} });
    // Mantém o canal aberto enquanto o PeerJS transmite a mensagem.
    this.leaveTimer = setTimeout(() => this.destroy(), 1000);
  }

  public destroy(): void {
    this.destroyed = true;
    this.cancelConnect?.();
    this.cancelConnect = null;
    if (this.leaveTimer) clearTimeout(this.leaveTimer);
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

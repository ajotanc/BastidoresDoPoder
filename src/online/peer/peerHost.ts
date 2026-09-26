import Peer, { type DataConnection } from 'peerjs';
import type { RoleSlug } from '@/types/game';
import type { GameState, PrivatePlayerView } from '@/game/models/gameState';
import type { ClientCommand, CommandReject, Envelope } from '@/game/models/commands';
import { createInitialAuthoritativeState, executeCommand, executeTimeout, type AuthoritativeGameState, type EngineExecutionResult } from '@/game/engine/gameEngine';
import { roomCodeToPeerId } from '../room/roomCode';
import { isClientEnvelope, type WireMessageFromHost } from './protocol';
import { isRecord } from '@/game/models/validation';
import { PEER_SERVER_CONFIG } from './peerConfig';

export const RECONNECT_GRACE_MS = 60_000;
export const HEARTBEAT_INTERVAL_MS = 5_000;
export const HEARTBEAT_TIMEOUT_MS = 15_000;
export interface HostCallbacks {
  onStateChange: (state: GameState) => void;
  onPrivateViewChange: (view: PrivatePlayerView) => void;
  onError: (errorMessage: string) => void;
  onReady: (roomCode: string) => void;
}

export class PeerHost {
  private peer: Peer | null = null;
  private connections = new Set<DataConnection>();
  private playerConnections = new Map<string, DataConnection>();
  private lastSeen = new Map<DataConnection, number>();
  private reconnectUntil = new Map<string, number>();
  private processed = new Map<string, Set<string>>();
  private authoritativeState: AuthoritativeGameState;
  private timeoutTimer: ReturnType<typeof setTimeout> | null = null;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private destroyed = false;

  constructor(
    public readonly roomCode: string,
    public readonly hostPlayerId: string,
    hostName: string,
    hostAvatarSlug: RoleSlug,
    hostReconnectToken: string,
    private callbacks: HostCallbacks,
  ) {
    this.authoritativeState = createInitialAuthoritativeState(roomCode, hostPlayerId, hostName, hostAvatarSlug, hostReconnectToken);
  }

  public init(): Promise<string> {
    return new Promise((resolve, reject) => {
      const peer = new Peer(roomCodeToPeerId(this.roomCode), PEER_SERVER_CONFIG);
      this.peer = peer;
      peer.on('open', id => {
        this.callbacks.onReady(this.roomCode);
        this.emitLocalState();
        this.heartbeatTimer = setInterval(() => {
          for (const conn of this.connections) {
            if (Date.now() - (this.lastSeen.get(conn) ?? 0) > HEARTBEAT_TIMEOUT_MS) {
              this.disconnect(conn);
              conn.close();
            }
          }
          this.removeExpiredLobbyPlayers();
        }, HEARTBEAT_INTERVAL_MS);
        resolve(id);
      });
      peer.on('connection', conn => this.handleIncomingConnection(conn));
      peer.on('error', err => { this.callbacks.onError(err.message); reject(err); });
    });
  }

  private handleIncomingConnection(conn: DataConnection): void {
    conn.on('open', () => {
      this.connections.add(conn);
      this.lastSeen.set(conn, Date.now());
    });
    conn.on('data', data => {
      if (this.destroyed || !this.connections.has(conn)) return;
      this.lastSeen.set(conn, Date.now());
      if (isRecord(data) && data.type === 'HEARTBEAT') {
        conn.send({ type: 'HEARTBEAT_ACK', timestamp: Date.now() });
        return;
      }
      if (!isClientEnvelope(data)) {
        this.reject(conn, isRecord(data) && typeof data.messageId === 'string' ? data.messageId : 'invalid', 'INVALID_COMMAND', 'Mensagem inválida.');
        return;
      }
      this.handleEnvelope(conn, data);
    });
    conn.on('close', () => this.disconnect(conn));
    conn.on('error', () => this.disconnect(conn));
  }

  private disconnect(conn: DataConnection): void {
    this.connections.delete(conn);
    this.lastSeen.delete(conn);
    if (this.destroyed) return;
    for (const [id, current] of this.playerConnections) {
      if (current !== conn) continue;
      this.playerConnections.delete(id);
      this.reconnectUntil.set(id, Date.now() + RECONNECT_GRACE_MS);
      this.setConnected(id, false);
      this.broadcastPublicState();
    }
  }

  private setConnected(id: string, connected: boolean): void {
    const pub = this.authoritativeState.publicState;
    const player = pub.players[id];
    if (!player) return;
    this.authoritativeState.publicState = { ...pub, revision: pub.revision + 1,
      players: { ...pub.players, [id]: { ...player, isConnected: connected } } };
  }

  private removeExpiredLobbyPlayers(): void {
    if (this.authoritativeState.publicState.phase !== 'LOBBY') return;
    for (const [id, deadline] of this.reconnectUntil) {
      if (Date.now() <= deadline) continue;
      const pub = this.authoritativeState.publicState;
      const players = { ...pub.players };
      delete players[id];
      delete this.authoritativeState.privateHands[id];
      delete this.authoritativeState.reconnectTokens[id];
      delete this.authoritativeState.privateNotices[id];
      this.reconnectUntil.delete(id);
      this.processed.delete(id);
      this.authoritativeState.publicState = { ...pub, players,
        playerOrder: pub.playerOrder.filter(playerId => playerId !== id), revision: pub.revision + 1 };
      this.broadcastPublicState();
    }
  }

  private handleEnvelope(conn: DataConnection, envelope: Envelope<ClientCommand>): void {
    const { playerId: id, messageId, data: command } = envelope;
    const reject = (reason: CommandReject['reason'], description: string) => this.reject(conn, messageId, reason, description);
    if (envelope.roomCode.toUpperCase() !== this.roomCode.toUpperCase()) return reject('UNAUTHORIZED', 'Sala incorreta.');
    if (id === this.hostPlayerId) return reject('UNAUTHORIZED', 'A identidade do host é local.');
    const boundId = [...this.playerConnections].find(([, connection]) => connection === conn)?.[0];
    if (boundId && boundId !== id) return reject('UNAUTHORIZED', 'Conexão vinculada a outro jogador.');

    if (command.type === 'RECONNECT') {
      const deadline = this.reconnectUntil.get(id);
      if (command.payload.playerId !== id || this.authoritativeState.reconnectTokens[id] !== command.payload.reconnectToken ||
          (!this.playerConnections.has(id) && (!deadline || Date.now() > deadline))) {
        return reject('UNAUTHORIZED', 'Credenciais ou prazo de reconexão inválidos.');
      }
      const old = this.playerConnections.get(id);
      this.playerConnections.set(id, conn);
      this.reconnectUntil.delete(id);
      if (old && old !== conn) { this.connections.delete(old); this.lastSeen.delete(old); old.close(); }
      this.setConnected(id, true);
      this.broadcastPublicState();
      this.sendPrivateView(id);
      conn.send({ type: 'COMMAND_ACK', messageId, revision: this.authoritativeState.publicState.revision });
      return;
    }

    if (command.type === 'JOIN_ROOM') {
      if (boundId || Object.hasOwn(this.authoritativeState.publicState.players, id)) return reject('UNAUTHORIZED', 'Identidade já registrada.');
    } else {
      if (this.playerConnections.get(id) !== conn) return reject('UNAUTHORIZED', 'Conexão não autenticada.');
      if (this.processed.get(id)?.has(messageId)) {
        conn.send({ type: 'COMMAND_ACK', messageId, revision: this.authoritativeState.publicState.revision });
        return;
      }
      // Atualiza um deadline vencido antes de considerar uma intenção recebida com atraso.
      if (this.authoritativeState.publicState.deadlineAt !== null && Date.now() >= this.authoritativeState.publicState.deadlineAt) this.handleTimeoutExpiry();
      if (envelope.revision !== this.authoritativeState.publicState.revision) {
        conn.send({ type: 'ROOM_SNAPSHOT', state: this.authoritativeState.publicState });
        return reject('STALE_STATE', 'A mesa mudou. Confira o estado atual e tente novamente.');
      }
    }
    const result = executeCommand(this.authoritativeState, command, id, messageId);
    if (result.rejection) return this.reject(conn, messageId, result.rejection.reason, result.rejection.description);
    if (command.type === 'JOIN_ROOM') this.playerConnections.set(id, conn);
    const ids = this.processed.get(id) ?? new Set<string>();
    ids.add(messageId);
    if (ids.size > 1024) ids.delete(ids.values().next().value!);
    this.processed.set(id, ids);
    this.applyResult(result);
    conn.send({ type: 'COMMAND_ACK', messageId, revision: this.authoritativeState.publicState.revision });
  }

  public executeLocalHostCommand(command: ClientCommand, messageId = crypto.randomUUID()): void {
    if (this.destroyed) return;
    const deadline = this.authoritativeState.publicState.deadlineAt;
    if (deadline !== null && Date.now() >= deadline) { this.handleTimeoutExpiry(); return; }
    const result = executeCommand(this.authoritativeState, command, this.hostPlayerId, messageId);
    if (result.rejection) { this.callbacks.onError(result.rejection.description); return; }
    this.applyResult(result);
  }

  private reject(conn: DataConnection, messageId: string, reason: CommandReject['reason'], description: string): void {
    if (conn.open) conn.send({ type: 'COMMAND_REJECTED', reject: { messageId, reason, description } });
  }

  private applyResult(result: EngineExecutionResult): void {
    this.authoritativeState = result.nextAuthoritativeState;
    this.schedulePhaseTimeout();
    this.broadcastPublicState();
    for (const id of this.playerConnections.keys()) this.sendPrivateView(id);
  }

  private sendPrivateView(id: string): void {
    const conn = this.playerConnections.get(id);
    if (conn?.open) conn.send({ type: 'PRIVATE_VIEW', view: {
      playerId: id, supports: this.authoritativeState.privateHands[id] || [],
      searchResultNotice: this.authoritativeState.privateNotices[id],
    } });
  }

  private broadcastPublicState(): void {
    const message: WireMessageFromHost = { type: 'ROOM_SNAPSHOT', state: this.authoritativeState.publicState };
    for (const conn of this.playerConnections.values()) if (conn.open) conn.send(message);
    this.emitLocalState();
  }

  private emitLocalState(): void {
    this.callbacks.onStateChange(this.authoritativeState.publicState);
    this.callbacks.onPrivateViewChange({ playerId: this.hostPlayerId, supports: this.authoritativeState.privateHands[this.hostPlayerId] || [],
      searchResultNotice: this.authoritativeState.privateNotices[this.hostPlayerId] });
  }

  private schedulePhaseTimeout(): void {
    if (this.timeoutTimer) clearTimeout(this.timeoutTimer);
    this.timeoutTimer = null;
    const { deadlineAt, phase } = this.authoritativeState.publicState;
    if (this.destroyed || !deadlineAt || phase === 'FINISHED') return;
    this.timeoutTimer = setTimeout(() => this.handleTimeoutExpiry(), Math.max(1, deadlineAt - Date.now()));
  }

  private handleTimeoutExpiry(): void {
    if (!this.destroyed) this.applyResult(executeTimeout(this.authoritativeState));
  }

  public destroy(): void {
    this.destroyed = true;
    if (this.timeoutTimer) clearTimeout(this.timeoutTimer);
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    for (const conn of this.connections) conn.close();
    this.connections.clear();
    this.playerConnections.clear();
    this.peer?.destroy();
    this.peer = null;
  }
}

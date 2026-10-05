import { randomUUID } from '@/utils/uuid';
import { buildResultSummary } from '@/game/resultSummary';
import { validCheckpoint, type HostCheckpoint } from '../room/hostRecovery';
import { createDiscordConversation } from '../room/discordConversation';
import { resolveRoomSettings, type RoomTimingInput } from '@/game/models/roomSettings';
import { DEFAULT_BOT_DIFFICULTY, type BotDifficulty } from '@/game/bots/botDifficulty';
import { RECONNECT_GRACE_MS, HEARTBEAT_INTERVAL_MS, HEARTBEAT_TIMEOUT_MS, CONNECTION_TIMEOUT_MS } from '@/constants/gameConfig';
import { sendPeerMessage, createPeerMessageReader } from './jsonTransport';
import dayjs from 'dayjs';
import Peer, { type DataConnection } from 'peerjs';
import type { RoleSlug } from '@/types/game';
import type { GameState, PrivatePlayerView } from '@/game/models/gameState';
import type { ClientCommand, CommandReject, Envelope } from '@/game/models/commands';
import { createInitialAuthoritativeState, executeCommand, executeTimeout, type AuthoritativeGameState, type EngineExecutionResult } from '@/game/engine/gameEngine';
import { roomCodeToPeerId } from '../room/roomCode';
import { isClientEnvelope, type WireMessageFromHost } from './protocol';
import { isRecord } from '@/game/models/validation';
import { PEER_SERVER_CONFIG } from './peerConfig';
import { addBots } from '@/game/bots/createBots';
import { chooseBotCommand } from '@/game/bots/botStrategy';
import { BotController } from '@/game/bots/botController';

export { RECONNECT_GRACE_MS, HEARTBEAT_INTERVAL_MS, HEARTBEAT_TIMEOUT_MS } from '@/constants/gameConfig';
export interface HostCallbacks {
  onStateChange: (state: GameState) => void;
  onPrivateViewChange: (view: PrivatePlayerView) => void;
  onError: (errorMessage: string) => void;
  onReady: (roomCode: string) => void;
  onCheckpoint?: (checkpoint: HostCheckpoint) => void;
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
  private initTimer: ReturnType<typeof setTimeout> | null = null;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private destroyed = false;
  private restoring = false;
  private closing = false;
  private announcedGames = new Set<string>();
  private resumeNotBefore = 0;
  private restoredSavedAt = 0;
  private resumeTimer: ReturnType<typeof setTimeout> | null = null;
  private bots = new BotController(id => {
    if (this.destroyed) return;
    const state = this.authoritativeState;
    if (state.publicState.deadlineAt !== null && dayjs().valueOf() >= state.publicState.deadlineAt) {
      this.handleTimeoutExpiry();
      return;
    }
    const command = chooseBotCommand(state.publicState, { playerId: id, supports: state.privateHands[id] ?? [] }, Math.random, this.botDifficulty);
    if (command) this.applyResult(executeCommand(state, command, id, randomUUID()));
  });

  constructor(
    public readonly roomCode: string,
    public readonly hostPlayerId: string,
    hostName: string,
    hostAvatarSlug: RoleSlug | undefined,
    hostReconnectToken: string,
    private callbacks: HostCallbacks,
    hostAvatarImage?: string,
    botCount = 0,
    private readonly botDifficulty: BotDifficulty = DEFAULT_BOT_DIFFICULTY,
    timing: RoomTimingInput = {},
    private readonly discordEnabled = false,
    checkpoint?: HostCheckpoint,
  ) {
    this.authoritativeState = createInitialAuthoritativeState(roomCode, hostPlayerId, hostName, hostAvatarSlug, hostReconnectToken, resolveRoomSettings(timing), hostAvatarImage);
    this.authoritativeState = addBots(this.authoritativeState, botCount);
    this.authoritativeState.publicState = { ...this.authoritativeState.publicState, botDifficulty };
    if (checkpoint) {
      if (!validCheckpoint(checkpoint) || checkpoint.roomCode !== roomCode || checkpoint.hostPlayerId !== hostPlayerId) throw new Error('O salvamento está expirado ou é incompatível.');
      this.authoritativeState = structuredClone(checkpoint.state);
      this.conversationSessionId = checkpoint.conversationSessionId;
      this.processed = new Map(checkpoint.processed.map(([id, ids]) => [id, new Set(ids)]));
      this.restoring = true;
      this.restoredSavedAt = checkpoint.savedAt;
      const pub = this.authoritativeState.publicState;
      // Store remaining duration until the signaling connection is ready.
      this.authoritativeState.publicState = { ...pub, deadlineAt: pub.deadlineAt === null ? null : Math.max(1000, pub.deadlineAt - checkpoint.savedAt) };
    }
  }

  private conversationSessionId: string = randomUUID();

  public async prepareConversation(): Promise<void> {
    const conversationState = this.authoritativeState.publicState.discordConversation;
    if (!this.discordEnabled || this.destroyed || conversationState?.status === 'loading' || (conversationState?.retryAt ?? 0) > Date.now() || (conversationState?.status === 'ready' && (conversationState.expiresAt ?? 0) > Date.now())) return;
    this.authoritativeState.publicState = { ...this.authoritativeState.publicState, discordConversation: { status: 'loading' } };
    this.broadcastPublicState();
    const conversation = await createDiscordConversation(this.roomCode, this.conversationSessionId);
    if (this.destroyed) return;
    this.authoritativeState.publicState = { ...this.authoritativeState.publicState, discordConversation: conversation };
    this.broadcastPublicState();
    void this.publishResult();
  }

  public async publishResult(): Promise<void> {
    const state = this.authoritativeState.publicState;
    const summary = buildResultSummary(state);
    if (!summary || this.closing || this.destroyed || this.announcedGames.has(state.gameId)) return;
    this.announcedGames.add(state.gameId);
    this.authoritativeState.publicState = { ...state, discordResultStatus: 'sending' };
    this.broadcastPublicState();
    let sent = false;
    try {
      const response = await fetch('/.netlify/functions/discord-result', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ summary }), signal: AbortSignal.timeout(30000) });
      const result: unknown = response.ok ? await response.json() : null;
      sent = typeof result === 'object' && result !== null && 'sent' in result && result.sent === true;
    } catch { /* The result remains available locally when Discord is unavailable. */ }
    if (this.destroyed || this.authoritativeState.publicState.gameId !== state.gameId) return;
    this.authoritativeState.publicState = { ...this.authoritativeState.publicState, discordResultStatus: sent ? 'sent' : 'error' };
    this.broadcastPublicState();
  }

  public startRematch(): void {
    const previous = this.authoritativeState;
    const pub = previous.publicState;
    if (this.destroyed || pub.phase !== 'FINISHED' || !pub.winnerPlayerId) return;
    const host = pub.players[this.hostPlayerId]!;
    const next = createInitialAuthoritativeState(this.roomCode, host.id, host.name, host.avatarSlug, previous.reconnectTokens[host.id]!, previous.settings, host.avatarImage);
    const ids = pub.playerOrder.filter(id => id === host.id || pub.players[id]?.isBot || pub.players[id]?.isConnected);
    next.publicState = { ...next.publicState, revision: pub.revision + 1, botDifficulty: this.botDifficulty, discordConversation: pub.discordConversation,
      playerOrder: ids, players: Object.fromEntries(ids.map(id => [id, { ...pub.players[id]!, coins: previous.settings.initialCoins, activeSupportCount: 0, lostCards: [], isAlive: true, isReady: id === host.id || !!pub.players[id]!.isBot }])) };
    if (pub.winnerPlayerId && ids.includes(pub.winnerPlayerId)) next.preferredFirstPlayerId = pub.winnerPlayerId;
    next.privateHands = Object.fromEntries(ids.map(id => [id, []]));
    next.reconnectTokens = Object.fromEntries(ids.filter(id => previous.reconnectTokens[id]).map(id => [id, previous.reconnectTokens[id]!]));
    this.processed.clear();
    this.reconnectUntil.clear();
    this.authoritativeState = next;
    this.schedulePhaseTimeout();
    this.bots.update(next.publicState);
    this.broadcastPublicState();
    for (const id of this.playerConnections.keys()) this.sendPrivateView(id);
  }

  public init(): Promise<string> {
    return new Promise((resolve, reject) => {
      const peer = new Peer(roomCodeToPeerId(this.roomCode), PEER_SERVER_CONFIG);
      this.peer = peer;
      this.initTimer = setTimeout(() => { this.destroy(); reject(new Error('Não foi possível abrir a mesa. Aguarde alguns segundos e tente novamente.')); }, CONNECTION_TIMEOUT_MS);
      peer.on('open', id => {
        if (this.destroyed) return;
        if (this.initTimer) clearTimeout(this.initTimer);
        if (this.restoring) this.resumeSavedState();
        this.callbacks.onReady(this.roomCode);
        this.emitLocalState();
        let lastHeartbeatCheck = dayjs().valueOf();
        this.heartbeatTimer = setInterval(() => {
          const now = dayjs().valueOf();
          const elapsed = now - lastHeartbeatCheck;
          lastHeartbeatCheck = now;
          if (elapsed > HEARTBEAT_TIMEOUT_MS) {
            // O próprio host ficou suspenso. Dê um novo intervalo para a rede
            // responder, em vez de interpretar todos os canais como mortos.
            for (const conn of this.connections) this.lastSeen.set(conn, now);
            for (const [id, deadline] of this.reconnectUntil) {
              this.reconnectUntil.set(id, deadline + elapsed - HEARTBEAT_INTERVAL_MS);
            }
            // Retoma a fase vencida mesmo se o callback do setTimeout ainda não rodou.
            if (this.authoritativeState.publicState.deadlineAt !== null && now >= this.authoritativeState.publicState.deadlineAt) {
              this.handleTimeoutExpiry();
            }
          }
          for (const conn of this.connections) {
            if (now - (this.lastSeen.get(conn) ?? 0) > HEARTBEAT_TIMEOUT_MS) {
              this.disconnect(conn);
              conn.close();
            }
          }
          this.removeExpiredPlayers();
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
      this.lastSeen.set(conn, dayjs().valueOf());
    });
    const readMessage = createPeerMessageReader();
    conn.on('data', raw => {
      const data = readMessage(raw);
      if (data === undefined) return;
      if (this.destroyed || !this.connections.has(conn)) return;
      this.lastSeen.set(conn, dayjs().valueOf());
      if (isRecord(data) && data.type === 'HEARTBEAT') {
        sendPeerMessage(conn, { type: 'HEARTBEAT_ACK', timestamp: dayjs().valueOf() });
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
      if (!this.authoritativeState.reconnectTokens[id]) continue;
      this.reconnectUntil.set(id, dayjs().valueOf() + RECONNECT_GRACE_MS);
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

  private removeExpiredPlayers(): void {
    for (const [id, deadline] of this.reconnectUntil) {
      if (dayjs().valueOf() <= deadline) continue;
      this.reconnectUntil.delete(id);
      this.processed.delete(id);
      this.applyResult(executeCommand(this.authoritativeState, { type: 'LEAVE_ROOM', payload: {} }, id, `expired-${id}`));
    }
  }

  private handleEnvelope(conn: DataConnection, envelope: Envelope<ClientCommand>): void {
    const { playerId: id, messageId, data: command } = envelope;
    const reject = (reason: CommandReject['reason'], description: string) => this.reject(conn, messageId, reason, description);
    if (envelope.roomCode.toUpperCase() !== this.roomCode.toUpperCase()) return reject('UNAUTHORIZED', 'Sala incorreta.');
    if (id === this.hostPlayerId) return reject('UNAUTHORIZED', 'A identidade do anfitrião é local.');
    const boundId = [...this.playerConnections].find(([, connection]) => connection === conn)?.[0];
    if (boundId && boundId !== id) return reject('UNAUTHORIZED', 'Conexão vinculada a outro jogador.');

    // Abandono autenticado independe da revisão: a mesa pode mudar enquanto a pessoa sai.
    if (command.type === 'LEAVE_ROOM') {
      if (boundId !== id) return reject('UNAUTHORIZED', 'Conexão não autenticada.');
      this.playerConnections.delete(id);
      this.reconnectUntil.delete(id);
      this.processed.delete(id);
      this.applyResult(executeCommand(this.authoritativeState, command, id, messageId));
      sendPeerMessage(conn, { type: 'COMMAND_ACK', messageId, revision: this.authoritativeState.publicState.revision });
      return;
    }

    if (command.type === 'RECONNECT') {
      const deadline = this.reconnectUntil.get(id);
      if (command.payload.playerId !== id || this.authoritativeState.reconnectTokens[id] !== command.payload.reconnectToken ||
          (!this.playerConnections.has(id) && (!deadline || dayjs().valueOf() > deadline))) {
        return reject('UNAUTHORIZED', 'Credenciais ou prazo de reconexão inválidos.');
      }
      const old = this.playerConnections.get(id);
      this.playerConnections.set(id, conn);
      this.reconnectUntil.delete(id);
      if (old && old !== conn) { this.connections.delete(old); this.lastSeen.delete(old); old.close(); }
      this.setConnected(id, true);
      this.broadcastPublicState();
      this.sendPrivateView(id);
      sendPeerMessage(conn, { type: 'COMMAND_ACK', messageId, revision: this.authoritativeState.publicState.revision });
      return;
    }

    if (command.type === 'JOIN_ROOM') {
      if (boundId || Object.hasOwn(this.authoritativeState.publicState.players, id)) return reject('UNAUTHORIZED', 'Identidade já registrada.');
    } else {
      if (this.playerConnections.get(id) !== conn) return reject('UNAUTHORIZED', 'Conexão não autenticada.');
      if (this.processed.get(id)?.has(messageId)) {
        sendPeerMessage(conn, { type: 'COMMAND_ACK', messageId, revision: this.authoritativeState.publicState.revision });
        return;
      }
      // Atualiza um deadline vencido antes de considerar uma intenção recebida com atraso.
      if (this.authoritativeState.publicState.deadlineAt !== null && dayjs().valueOf() >= this.authoritativeState.publicState.deadlineAt) this.handleTimeoutExpiry();
      if (envelope.revision !== this.authoritativeState.publicState.revision) {
        sendPeerMessage(conn, { type: 'ROOM_SNAPSHOT', state: this.authoritativeState.publicState });
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
    sendPeerMessage(conn, { type: 'COMMAND_ACK', messageId, revision: this.authoritativeState.publicState.revision });
  }

  public executeLocalHostCommand(command: ClientCommand, messageId = randomUUID()): void {
    if (this.destroyed) return;
    const deadline = this.authoritativeState.publicState.deadlineAt;
    if (deadline !== null && dayjs().valueOf() >= deadline) { this.handleTimeoutExpiry(); return; }
    const result = executeCommand(this.authoritativeState, command, this.hostPlayerId, messageId);
    if (result.rejection) { this.callbacks.onError(result.rejection.description); return; }
    this.applyResult(result);
  }

  private reject(conn: DataConnection, messageId: string, reason: CommandReject['reason'], description: string): void {
    if (conn.open) sendPeerMessage(conn, { type: 'COMMAND_REJECTED', reject: { messageId, reason, description } });
  }

  private applyResult(result: EngineExecutionResult): void {
    this.authoritativeState = result.nextAuthoritativeState;
    this.schedulePhaseTimeout();
    if (Date.now() >= this.resumeNotBefore) this.bots.update(this.authoritativeState.publicState);
    this.broadcastPublicState();
    for (const id of this.playerConnections.keys()) this.sendPrivateView(id);
    void this.publishResult();
  }

  private sendPrivateView(id: string): void {
    const conn = this.playerConnections.get(id);
    if (conn?.open) sendPeerMessage(conn, { type: 'PRIVATE_VIEW', view: {
      playerId: id, supports: this.authoritativeState.privateHands[id] || [],
      searchResultNotice: this.authoritativeState.privateNotices[id],
    } });
  }

  private broadcastPublicState(): void {
    const message: WireMessageFromHost = { type: 'ROOM_SNAPSHOT', state: this.authoritativeState.publicState };
    for (const conn of this.playerConnections.values()) if (conn.open) sendPeerMessage(conn, message);
    this.emitLocalState();
  }

  private emitLocalState(): void {
    this.callbacks.onCheckpoint?.({ version: 1, roomCode: this.roomCode, hostPlayerId: this.hostPlayerId,
      savedAt: Date.now(), state: this.authoritativeState, botDifficulty: this.botDifficulty,
      discordEnabled: this.discordEnabled, conversationSessionId: this.conversationSessionId,
      processed: [...this.processed].map(([id, ids]) => [id, [...ids]]) });
    this.callbacks.onStateChange(this.authoritativeState.publicState);
    this.callbacks.onPrivateViewChange({ playerId: this.hostPlayerId, supports: this.authoritativeState.privateHands[this.hostPlayerId] || [],
      searchResultNotice: this.authoritativeState.privateNotices[this.hostPlayerId] });
  }

  private schedulePhaseTimeout(): void {
    if (this.timeoutTimer) clearTimeout(this.timeoutTimer);
    this.timeoutTimer = null;
    const { deadlineAt, phase } = this.authoritativeState.publicState;
    if (this.destroyed || !deadlineAt || phase === 'FINISHED') return;
    this.timeoutTimer = setTimeout(() => this.handleTimeoutExpiry(), Math.max(1, deadlineAt - dayjs().valueOf()));
  }

  private handleTimeoutExpiry(): void {
    if (!this.destroyed) this.applyResult(executeTimeout(this.authoritativeState));
  }

  private resumeSavedState(): void {
    this.restoring = false;
    const now = Date.now();
    const pub = this.authoritativeState.publicState;
    const humans = Object.values(pub.players).filter(player => player.id !== this.hostPlayerId && !player.isBot && this.authoritativeState.reconnectTokens[player.id]);
    const grace = humans.some(player => player.isAlive) ? RECONNECT_GRACE_MS : 0;
    for (const player of humans) this.reconnectUntil.set(player.id, now + RECONNECT_GRACE_MS);
    this.resumeNotBefore = now + grace;
    const conversation = pub.discordConversation;
    this.authoritativeState.publicState = { ...pub, revision: pub.revision + 1,
      recoveryPausedMs: (pub.recoveryPausedMs ?? 0) + Math.max(0, now - this.restoredSavedAt),
      players: Object.fromEntries(Object.entries(pub.players).map(([id, player]) => [id, { ...player, isConnected: id === this.hostPlayerId || !!player.isBot }])),
      deadlineAt: pub.deadlineAt === null ? null : now + grace + pub.deadlineAt,
      ...(conversation?.status === 'loading' ? { discordConversation: { status: 'error' as const } } : {}),
      history: [{ id: randomUUID(), timestamp: now, type: 'ROOM_RESTORED', importance: 'normal' as const, message: humans.length ? 'Mesa retomada pelo anfitrião. A reconexão foi reaberta e o tempo restante da decisão foi mantido.' : 'Mesa retomada pelo anfitrião. O tempo restante da decisão foi mantido.' }, ...pub.history].slice(0, 50),
    };
    this.schedulePhaseTimeout();
    this.resumeTimer = setTimeout(() => { if (!this.destroyed) this.bots.update(this.authoritativeState.publicState); }, grace);
  }

  public destroy(): void {
    this.destroyed = true;
    if (this.initTimer) clearTimeout(this.initTimer);
    if (this.resumeTimer) clearTimeout(this.resumeTimer);
    this.bots.stop();
    if (this.timeoutTimer) clearTimeout(this.timeoutTimer);
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    for (const conn of this.connections) conn.close();
    this.connections.clear();
    this.playerConnections.clear();
    this.peer?.destroy();
    this.peer = null;
  }

  public leaveRoom(): void {
    this.closing = true;
    const alreadyFinished = this.authoritativeState.publicState.phase === 'FINISHED';
    const result = executeCommand(this.authoritativeState, { type: 'LEAVE_ROOM', payload: {} }, this.hostPlayerId, 'host-leave');
    const pub = result.nextAuthoritativeState.publicState;
    // Sem migração de host, os demais clientes precisam receber um encerramento explícito.
    if (!alreadyFinished) {
      result.nextAuthoritativeState.publicState = { ...pub, phase: 'FINISHED', winnerPlayerId: null, winnerSupports: undefined,
        deadlineAt: null, pendingAction: null, responsePlayerIds: [], cardChoicePlayerId: null,
        cardChoiceReason: null, revision: pub.revision + 1 };
      result.nextAuthoritativeState.lossContinuation = undefined;
    }
    this.applyResult(result);
    this.destroyed = true;
    if (this.initTimer) clearTimeout(this.initTimer);
    if (this.resumeTimer) clearTimeout(this.resumeTimer);
    this.bots.stop();
    if (this.timeoutTimer) clearTimeout(this.timeoutTimer);
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    // Deixa o snapshot final sair pelo canal antes de encerrar o PeerServer local.
    setTimeout(() => this.destroy(), 1000);
  }
}

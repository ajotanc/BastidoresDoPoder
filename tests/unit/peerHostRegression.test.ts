import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ClientCommand } from '@/game/models/commands';
import type { GameState } from '@/game/models/gameState';
import { DEFAULT_GAME_SETTINGS } from '@/game/models/gameState';
import { validCheckpoint, type HostCheckpoint } from '@/online/room/hostRecovery';
import { RECONNECT_GRACE_MS, HOST_SAVE_TTL_MS } from '@/constants/gameConfig';
import { PeerHost } from '@/online/peer/peerHost';
import { isClientEnvelope } from '@/online/peer/protocol';
import { BOT_DECISION_DELAY_MS } from '@/constants/gameConfig';

const transport = vi.hoisted(() => {
  class Emitter {
    listeners = new Map<string, ((...args: unknown[]) => void)[]>();
    on(event: string, callback: (...args: unknown[]) => void) {
      this.listeners.set(event, [...(this.listeners.get(event) ?? []), callback]);
    }
    emit(event: string, ...args: unknown[]) { for (const fn of this.listeners.get(event) ?? []) fn(...args); }
  }
  class Connection extends Emitter {
    open = true;
    sent: unknown[] = [];
    constructor(public peer: string) { super(); }
    send(data: unknown) { this.sent.push(JSON.parse(JSON.stringify(data))); }
    close() { this.open = false; this.emit('close'); }
  }
  const peers: Emitter[] = [];
  class MockPeer extends Emitter {
    constructor() { super(); peers.push(this); }
    destroy() { /* no external signaling in tests */ }
  }
  return { MockPeer, Connection, peers };
});
vi.mock('peerjs', () => ({ default: transport.MockPeer }));

describe('Host: identidade, concorrência, sigilo, reconexão e timers', () => {
  let host: PeerHost;
  let state: GameState;
  let checkpoint: HostCheckpoint;
  let serial = 0;
  const send = (conn: InstanceType<typeof transport.Connection>, id: string, command: ClientCommand, revision = state.revision, messageId = `m-${++serial}`) => {
    conn.emit('data', { protocol: 1, roomCode: 'ROOM', playerId: id, messageId, revision, sentAt: Date.now(), data: command });
  };
  const connect = (id: string) => {
    const conn = new transport.Connection(id);
    transport.peers.at(-1)!.emit('connection', conn);
    conn.emit('open');
    return conn;
  };
  const join = (id: string) => {
    const conn = connect(`peer-${id}`);
    send(conn, id, { type: 'JOIN_ROOM', payload: { name: id, avatarSlug: 'baron', reconnectToken: `token-${id}` } });
    return conn;
  };
  const start = () => {
    const b = join('b');
    const c = join('c');
    send(b, 'b', { type: 'SET_READY', payload: { ready: true } });
    send(c, 'c', { type: 'SET_READY', payload: { ready: true } });
    host.executeLocalHostCommand({ type: 'START_GAME', payload: {} });
    expect(state.phase).toBe('WAITING_ACTION');
    return { b, c };
  };
  const messages = (conn: InstanceType<typeof transport.Connection>, type: string) =>
    conn.sent.filter(msg => (msg as { type: string }).type === type);

  beforeEach(async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-26T01:00:00Z'));
    host = new PeerHost('ROOM', 'a', 'Ana', 'executor', 'token-a', {
      onStateChange: s => { state = s; }, onPrivateViewChange: vi.fn(), onError: vi.fn(), onReady: vi.fn(),
      onCheckpoint: save => { checkpoint = structuredClone(save); },
    });
    const ready = host.init();
    transport.peers.at(-1)!.emit('open', 'bdp-room');
    await ready;
  });
  afterEach(() => { host.destroy(); vi.useRealTimers(); vi.unstubAllGlobals(); });


  it.each([false, true])('Discord anuncia vitória uma vez e não anuncia saída do host: saída=%s', async hostLeaves => {
    host.destroy();
    host = new PeerHost('ROOM', 'a', 'Ana', 'executor', 'token-a', {
      onStateChange: value => { state = value; }, onPrivateViewChange: vi.fn(), onError: vi.fn(), onReady: vi.fn(),
    }, undefined, 0, 'pro', {}, true);
    const ready = host.init(); transport.peers.at(-1)!.emit('open', 'bdp-room'); await ready;
    const { b, c } = start();
    Object.assign(state, { discordConversation: { status: 'ready', url: 'https://discord.gg/test', expiresAt: Date.now() + 100000 } });
    const fetch = vi.fn().mockResolvedValue(Response.json({ sent: true })); vi.stubGlobal('fetch', fetch);
    send(b, 'b', { type: 'LEAVE_ROOM', payload: {} });
    if (hostLeaves) host.leaveRoom();
    else send(c, 'c', { type: 'LEAVE_ROOM', payload: {} });
    await vi.waitFor(() => expect(state.phase).toBe('FINISHED'));
    if (hostLeaves) {
      expect(state.winnerPlayerId).toBeNull(); expect(fetch).not.toHaveBeenCalled();
    } else {
      await vi.waitFor(() => expect(state.discordResultStatus).toBe('sent'));
      await host.publishResult();
      expect(fetch).toHaveBeenCalledTimes(1);
      const payload = JSON.parse(fetch.mock.calls[0]![1].body);
      expect(payload.summary.winnerName).toBe('Ana');
      expect(payload).not.toHaveProperty('privateHands');
    }
  });

  it('revanche preserva jogadores e regras, reinicia mãos e exige nova prontidão', () => {
    const { b, c } = start();
    const previousId = state.gameId;
    const oldRevision = state.revision;
    // Connected players may be eliminated but remain at the table for a rematch.
    Object.assign(state, { phase: 'FINISHED', winnerPlayerId: 'a', deadlineAt: null });
    Object.assign(state.players.b!, { isAlive: false, coins: 25, activeSupportCount: 0 });
    host.startRematch();
    expect(state.phase).toBe('LOBBY');
    expect(state.gameId).not.toBe(previousId);
    expect(state.revision).toBeGreaterThan(oldRevision);
    expect(state.playerOrder).toEqual(['a', 'b', 'c']);
    expect(state.players.b).toMatchObject({ name: 'b', isAlive: true, isReady: false, coins: DEFAULT_GAME_SETTINGS.initialCoins, activeSupportCount: 0, lostCards: [] });
    expect(checkpoint.state.privateHands.b).toEqual([]);
    expect(checkpoint.state.reconnectTokens.b).toBe('token-b');
    expect(state.settings).toEqual(DEFAULT_GAME_SETTINGS);
    expect(messages(b, 'PRIVATE_VIEW').at(-1)).toMatchObject({ view: { supports: [] } });
    host.executeLocalHostCommand({ type: 'START_GAME', payload: {} });
    expect(state.phase).toBe('LOBBY');
    const id = state.gameId; host.startRematch(); expect(state.gameId).toBe(id);
    send(b, 'b', { type: 'SET_READY', payload: { ready: true } });
    send(c, 'c', { type: 'SET_READY', payload: { ready: true } });
    host.executeLocalHostCommand({ type: 'START_GAME', payload: {} });
    expect(state.phase).toBe('WAITING_ACTION');
    expect(checkpoint.state.privateHands.b).toHaveLength(2);
  });

  it.each([false, true])('restaura mãos, prazos e credenciais, incluindo espectador eliminado: %s', async eliminated => {
    start();
    const saved = structuredClone(checkpoint);
    saved.state.playersPassedResponse.add('b');
    if (eliminated) saved.state.publicState.players.c = { ...saved.state.publicState.players.c!, isAlive: false, activeSupportCount: 0 };
    const remaining = saved.state.publicState.deadlineAt! - saved.savedAt;
    host.destroy();
    vi.setSystemTime(Date.now() + 3600000);
    host = new PeerHost('ROOM', 'a', 'Ana', 'executor', 'token-a', {
      onStateChange: s => { state = s; }, onPrivateViewChange: vi.fn(), onError: vi.fn(), onReady: vi.fn(),
      onCheckpoint: save => { checkpoint = structuredClone(save); },
    }, undefined, 0, saved.botDifficulty, {}, saved.discordEnabled, saved);
    const ready = host.init(); transport.peers.at(-1)!.emit('open', 'bdp-room'); await ready;
    expect(checkpoint.state.deck).toEqual(saved.state.deck);
    expect(checkpoint.state.privateHands).toEqual(saved.state.privateHands);
    expect(checkpoint.state.playersPassedResponse.has('b')).toBe(true);
    expect(checkpoint.conversationSessionId).toBe(saved.conversationSessionId);
    expect(state.deadlineAt).toBe(Date.now() + RECONNECT_GRACE_MS + remaining);
    expect(state.players.b!.isConnected).toBe(false);
    const b = connect('recovered-b');
    send(b, 'b', { type: 'RECONNECT', payload: { playerId: 'b', reconnectToken: 'token-b' } });
    expect(state.players.b!.isConnected).toBe(true);
    const c = connect('recovered-c');
    send(c, 'c', { type: 'RECONNECT', payload: { playerId: 'c', reconnectToken: 'token-c' } });
    expect(state.players.c!.isConnected).toBe(true);
    expect(state.players.c!.isAlive).toBe(!eliminated);
    expect(messages(b, 'PRIVATE_VIEW')).toEqual([expect.objectContaining({ view: expect.objectContaining({ playerId: 'b', supports: saved.state.privateHands.b }) })]);
    expect(JSON.stringify(messages(b, 'ROOM_SNAPSHOT'))).not.toContain('reconnectTokens');
    expect(JSON.stringify(messages(b, 'ROOM_SNAPSHOT'))).not.toContain('privateHands');
  });

  it('recusa saves vencidos, versões incompatíveis e estados corrompidos', () => {
    expect(validCheckpoint(checkpoint)).toBe(true);
    expect(validCheckpoint({ ...checkpoint, version: 99 })).toBe(false);
    expect(validCheckpoint({ ...checkpoint, savedAt: Date.now() - HOST_SAVE_TTL_MS })).toBe(false);
    expect(validCheckpoint({ ...checkpoint, state: { ...checkpoint.state, privateHands: null } })).toBe(false);
  });

  it.each(['hard', 'pro'] as const)('envia os tempos e o nível %s definidos pelo host para os convidados', async difficulty => {
    host.destroy();
    host = new PeerHost('ROOM', 'a', 'Ana', 'executor', 'token-a', {
      onStateChange: s => { state = s; }, onPrivateViewChange: vi.fn(), onError: vi.fn(), onReady: vi.fn(),
      onCheckpoint: save => { checkpoint = structuredClone(save); },
    }, undefined, 2, difficulty, { actionSeconds: 45, responseSeconds: 12 });
    const ready = host.init();
    transport.peers.at(-1)!.emit('open', 'bdp-room');
    await ready;
    const guest = join('b');
    const snapshots = messages(guest, 'ROOM_SNAPSHOT') as { state: GameState }[];
    expect(snapshots.at(-1)?.state.settings).toMatchObject({ actionTimeoutMs: 45000, reactionTimeoutMs: 12000, challengeTimeoutMs: 12000, choiceTimeoutMs: 12000 });
    expect(snapshots.at(-1)?.state.botDifficulty).toBe(difficulty);
    expect(state.settings).toEqual(snapshots.at(-1)?.state.settings);
  });

  it('integra bots com humanos, protege suas identidades e cancela ações ao sair', async () => {
    host.destroy();
    const error = vi.fn();
    host = new PeerHost('ROOM', 'a', 'Ana', 'executor', 'token-a', {
      onStateChange: s => { state = s; }, onPrivateViewChange: vi.fn(), onError: error, onReady: vi.fn(),
    }, undefined, 2);
    const ready = host.init();
    transport.peers.at(-1)!.emit('open', 'bdp-room');
    await ready;
    const bots = state.playerOrder.filter(id => state.players[id]?.isBot);
    expect(bots).toHaveLength(2);
    const human = join('b');
    send(human, 'b', { type: 'SET_READY', payload: { ready: true } });
    const attacker = connect('attacker');
    send(attacker, bots[0]!, { type: 'JOIN_ROOM', payload: { name: 'Fake', avatarSlug: 'baron', reconnectToken: 'fake' } });
    expect(messages(attacker, 'COMMAND_REJECTED')).toHaveLength(1);
    host.executeLocalHostCommand({ type: 'START_GAME', payload: {} });
    host.executeLocalHostCommand({ type: 'DECLARE_ACTION', payload: { actionType: 'salary' } });
    for (let i = 0; i < 30 && state.activePlayerId !== 'b'; i++) {
      if (state.responsePlayerIds[0] === 'a') host.executeLocalHostCommand({ type: 'PASS_RESPONSE', payload: { pass: true } });
      if (state.responsePlayerIds[0] === 'b') send(human, 'b', { type: 'PASS_RESPONSE', payload: { pass: true } });
      await vi.advanceTimersByTimeAsync(BOT_DECISION_DELAY_MS);
    }
    expect(state.activePlayerId).toBe('b');
    expect(state.phase).toBe('WAITING_ACTION');
    expect(error).not.toHaveBeenCalled();
    for (const msg of messages(human, 'PRIVATE_VIEW')) expect((msg as { view: { playerId: string } }).view.playerId).toBe('b');
    host.leaveRoom();
    expect(state.phase).toBe('FINISHED');
    const revision = state.revision;
    await vi.advanceTimersByTimeAsync(BOT_DECISION_DELAY_MS * 3);
    expect(state.revision).toBe(revision);
  });

  it('não envia snapshot nem mãos antes de autenticar; rejeita identidade de outro jogador', () => {
    const { b } = start();
    const attacker = connect('attacker');
    expect(attacker.sent).toEqual([]);
    const revision = state.revision;
    send(attacker, 'b', { type: 'PASS_RESPONSE', payload: { pass: true } });
    send(attacker, 'a', { type: 'DECLARE_ACTION', payload: { actionType: 'salary' } });
    expect(messages(attacker, 'COMMAND_REJECTED')).toHaveLength(2);
    expect(messages(attacker, 'PRIVATE_VIEW')).toHaveLength(0);
    expect(state.revision).toBe(revision);
    host.executeLocalHostCommand({ type: 'DECLARE_ACTION', payload: { actionType: 'salary' } });
    expect(messages(attacker, 'PRIVATE_VIEW')).toHaveLength(0);
    for (const msg of messages(b, 'PRIVATE_VIEW')) expect((msg as { view: { playerId: string } }).view.playerId).toBe('b');
    for (const msg of messages(b, 'ROOM_SNAPSHOT')) {
      const pub = (msg as { state: Record<string, unknown> }).state;
      expect(pub).not.toHaveProperty('privateHands');
      expect(pub).not.toHaveProperty('deck');
      expect(JSON.stringify(pub)).not.toContain('token-');
    }
  });

  it('rejeita comandos malformados, sala errada e início por cliente', () => {
    const b = join('b');
    b.emit('data', { protocol: 1, messageId: 'bad', roomCode: 'ROOM', playerId: 'b', sentAt: Date.now(), data: { type: 'DECLARE_ACTION', payload: null } });
    b.emit('data', { protocol: 1, messageId: 'wrong-room', roomCode: 'OTHER', playerId: 'b', sentAt: Date.now(), data: { type: 'SET_READY', payload: { ready: true } } });
    send(b, 'b', { type: 'START_GAME', payload: {} });
    expect(messages(b, 'COMMAND_REJECTED')).toHaveLength(3);
    expect(state.phase).toBe('LOBBY');
    expect(state.players.b!.isReady).toBe(false);
  });

  it('comandos simultâneos com mesma revisão não avançam duas oportunidades', () => {
    const { b, c } = start();
    host.executeLocalHostCommand({ type: 'DECLARE_ACTION', payload: { actionType: 'crowdfunding' } });
    const revision = state.revision;
    send(b, 'b', { type: 'PASS_RESPONSE', payload: { pass: true } }, revision, 'pass-b');
    send(c, 'c', { type: 'PASS_RESPONSE', payload: { pass: true } }, revision, 'pass-c');
    expect(state.responsePlayerIds).toEqual(['c']);
    expect(messages(c, 'COMMAND_REJECTED').at(-1)).toMatchObject({ reject: { reason: 'STALE_STATE' } });
    send(b, 'b', { type: 'PASS_RESPONSE', payload: { pass: true } }, revision, 'pass-b');
    expect(state.responsePlayerIds).toEqual(['c']);
    send(c, 'c', { type: 'PASS_RESPONSE', payload: { pass: true } });
    expect(state.players.a!.coins).toBe(4);
  });

  it('reconecta somente com token e envia apenas a mão do titular', () => {
    const { b } = start();
    b.close();
    expect(state.players.b!.isConnected).toBe(false);
    const replacement = connect('replacement');
    send(replacement, 'b', { type: 'RECONNECT', payload: { playerId: 'b', reconnectToken: 'wrong-token' } });
    expect(messages(replacement, 'PRIVATE_VIEW')).toHaveLength(0);
    send(replacement, 'b', { type: 'RECONNECT', payload: { playerId: 'b', reconnectToken: 'token-b' } });
    expect(state.players.b!.isConnected).toBe(true);
    expect(messages(replacement, 'PRIVATE_VIEW')).toHaveLength(1);
    expect(messages(replacement, 'PRIVATE_VIEW')[0]).toMatchObject({ view: { playerId: 'b', supports: expect.any(Array) } });
    b.emit('data', { protocol: 1, roomCode: 'ROOM', playerId: 'b', messageId: 'old', sentAt: Date.now(), data: { type: 'PASS_RESPONSE', payload: { pass: true } } });
    expect(state.players.b!.isConnected).toBe(true);
  });

  it('rejeita reconexão depois do prazo de graça', () => {
    const b = join('b');
    b.close();
    vi.setSystemTime(Date.now() + 60001);
    const replacement = connect('replacement');
    send(replacement, 'b', { type: 'RECONNECT', payload: { playerId: 'b', reconnectToken: 'token-b' } });
    expect(messages(replacement, 'PRIVATE_VIEW')).toHaveLength(0);
    expect(state.players.b!.isConnected).toBe(false);
  });

  it.each(['WAITING_CHALLENGE_ACTION', 'WAITING_BLOCK', 'WAITING_CHALLENGE_BLOCK'] as const)('reconexão preserva %s e deadline', phase => {
    const { b } = start();
    host.executeLocalHostCommand({ type: 'DECLARE_ACTION', payload: { actionType: phase === 'WAITING_CHALLENGE_ACTION' ? 'slushFund' : 'crowdfunding' } });
    if (phase === 'WAITING_CHALLENGE_BLOCK') send(b, 'b', { type: 'DECLARE_BLOCK', payload: { claimedBlockRole: 'baron' } });
    expect(state.phase).toBe(phase);
    const deadline = state.deadlineAt;
    const queue = [...state.responsePlayerIds];
    b.close();
    const replacement = connect('replacement');
    send(replacement, 'b', { type: 'RECONNECT', payload: { playerId: 'b', reconnectToken: 'token-b' } });
    expect(state.phase).toBe(phase);
    expect(state.deadlineAt).toBe(deadline);
    expect(state.responsePlayerIds).toEqual(queue);
  });

  it('reconexão restaura as quatro cartas durante a troca e permite concluí-la', () => {
    const { b, c } = start();
    host.executeLocalHostCommand({ type: 'DECLARE_ACTION', payload: { actionType: 'salary' } });
    send(b, 'b', { type: 'DECLARE_ACTION', payload: { actionType: 'exchange' } });
    send(c, 'c', { type: 'PASS_RESPONSE', payload: { pass: true } });
    host.executeLocalHostCommand({ type: 'PASS_RESPONSE', payload: { pass: true } });
    expect(state.phase).toBe('WAITING_EXCHANGE_CHOICE');
    b.close();
    const replacement = connect('replacement');
    send(replacement, 'b', { type: 'RECONNECT', payload: { playerId: 'b', reconnectToken: 'token-b' } });
    const view = (messages(replacement, 'PRIVATE_VIEW').at(-1) as { view: { supports: { id: string }[] } }).view;
    expect(view.supports).toHaveLength(4);
    send(replacement, 'b', { type: 'CHOOSE_EXCHANGE', payload: { returnedCardIds: [view.supports[2]!.id, view.supports[3]!.id] } });
    expect(state.phase).toBe('WAITING_ACTION');
    expect(state.players.b!.activeSupportCount).toBe(2);
  });

  it('substituição de conexão não deixa a antiga desconectar a nova', () => {
    const b = join('b');
    const replacement = connect('replacement');
    send(replacement, 'b', { type: 'RECONNECT', payload: { playerId: 'b', reconnectToken: 'token-b' } });
    expect(b.open).toBe(false);
    expect(state.players.b!.isConnected).toBe(true);
    b.emit('close');
    expect(state.players.b!.isConnected).toBe(true);
  });

  it('elimina ausentes ao vencer a reconexão independentemente da duração da ação', () => {
    start();
    vi.advanceTimersByTime(90000);
    expect(state.phase).toBe('FINISHED');
    expect(state.winnerPlayerId).toBe('a');
    expect(state.players.b!.activeSupportCount).toBe(0);
    expect(state.players.c!.activeSupportCount).toBe(0);
    expect(state.discard).toHaveLength(4);
  });

  it('saída voluntária revela os apoios para todos e encerra quando resta um jogador', () => {
    const { b, c } = start();
    const view = (messages(b, 'PRIVATE_VIEW').at(-1) as { view: { supports: { id: string; roleSlug: string }[] } }).view;
    send(b, 'b', { type: 'LEAVE_ROOM', payload: {} }, 1); // saída aceita mesmo com revisão antiga
    expect(state.players.b).toMatchObject({ isAlive: false, isConnected: false, activeSupportCount: 0 });
    for (const card of view.supports) expect(state.discard).toContainEqual({ id: card.id, roleSlug: card.roleSlug, lostByPlayerId: 'b', reason: 'Abandono da partida' });
    expect(messages(c, 'ROOM_SNAPSHOT').at(-1)).toMatchObject({ state: { discard: state.discard } });
    b.close();
    send(c, 'c', { type: 'LEAVE_ROOM', payload: {} });
    expect(state.phase).toBe('FINISHED');
    expect(state.winnerPlayerId).toBe('a');
    expect(state.deadlineAt).toBeNull();
    const replacement = connect('replacement');
    send(replacement, 'b', { type: 'RECONNECT', payload: { playerId: 'b', reconnectToken: 'token-b' } });
    expect(messages(replacement, 'PRIVATE_VIEW')).toHaveLength(0);
  });

  it('perda de uma carta é publicada para outro cliente sem revelar a carta restante', () => {
    const { b, c } = start();
    host.executeLocalHostCommand({ type: 'DECLARE_ACTION', payload: { actionType: 'slushFund' } });
    send(b, 'b', { type: 'DECLARE_CHALLENGE', payload: { isChallengeOnBlock: false } });
    const id = state.cardChoicePlayerId;
    if (id === 'b') {
      const view = (messages(b, 'PRIVATE_VIEW').at(-1) as { view: { supports: { id: string; roleSlug: string }[] } }).view;
      const card = view.supports[0]!;
      send(b, 'b', { type: 'CHOOSE_CARD', payload: { cardId: card.id } });
      expect(state.discard).toEqual(expect.arrayContaining([expect.objectContaining({ id: card.id, roleSlug: card.roleSlug, lostByPlayerId: 'b' })]));
      expect(messages(c, 'ROOM_SNAPSHOT').at(-1)).toMatchObject({ state: { discard: state.discard } });
      expect(state.players.b!.activeSupportCount).toBe(1);
    } else {
      // O host blefou: escolhe sua perda; a divulgação continua sendo pública.
      expect(id).toBe('a');
      const internal = host as unknown as { authoritativeState: { privateHands: Record<string, { id: string }[]> } };
      host.executeLocalHostCommand({ type: 'CHOOSE_CARD', payload: { cardId: internal.authoritativeState.privateHands.a![0]!.id } });
      expect(state.discard).toHaveLength(1);
      for (const conn of [b, c]) expect(messages(conn, 'ROOM_SNAPSHOT').at(-1)).toMatchObject({ state: { discard: state.discard } });
    }
  });

  it('timeout não pode ser acionado por uma mensagem de cliente', () => {
    const { b } = start();
    b.emit('data', { protocol: 1, roomCode: 'ROOM', playerId: 'b', messageId: 'fake-timeout', sentAt: Date.now(), data: { type: 'TIMEOUT', payload: {} } });
    expect(state.turn).toBe(1);
    expect(messages(b, 'COMMAND_REJECTED').at(-1)).toMatchObject({ reject: { reason: 'INVALID_COMMAND' } });
  });

  it('envia a reposição comprovada somente ao dono antes da escolha de perda do contestador', () => {
    const { b, c } = start();
    const internal = host as unknown as { authoritativeState: import('@/game/engine/gameEngine').AuthoritativeGameState };
    const authoritative = internal.authoritativeState;
    // Monta uma mão conhecida preservando as 24 cartas reais da partida.
    const old = authoritative.privateHands.b![0]!;
    const baron = [...authoritative.deck, ...Object.values(authoritative.privateHands).flat()].find(card => card.roleSlug === 'baron')!;
    for (const id of Object.keys(authoritative.privateHands)) {
      authoritative.privateHands[id] = authoritative.privateHands[id]!.map(card => card.id === baron.id ? { ...old } : card);
    }
    authoritative.deck = authoritative.deck.map(card => card.id === baron.id ? { id: old.id, roleSlug: old.roleSlug } : card);
    authoritative.privateHands.b![0] = { id: baron.id, roleSlug: 'baron', isLost: false };
    host.executeLocalHostCommand({ type: 'DECLARE_ACTION', payload: { actionType: 'salary' } });
    send(b, 'b', { type: 'DECLARE_ACTION', payload: { actionType: 'slushFund' } });
    send(c, 'c', { type: 'DECLARE_CHALLENGE', payload: { isChallengeOnBlock: false } });
    expect(state.phase).toBe('WAITING_CARD_CHOICE');
    const view = (messages(b, 'PRIVATE_VIEW').at(-1) as { view: { playerId: string; supports: { id: string }[] } }).view;
    expect(view.supports[0]!.id).not.toBe(baron.id);
    expect(view.playerId).toBe('b');
    expect(JSON.stringify(messages(c, 'ROOM_SNAPSHOT').at(-1))).not.toContain(view.supports[0]!.id);
    expect(JSON.stringify(messages(c, 'PRIVATE_VIEW').at(-1))).not.toContain(view.supports[0]!.id);
  });

  it('saída do host comunica encerramento sem vencedor se ainda existem dois adversários', () => {
    const { b, c } = start();
    host.leaveRoom();
    expect(state.phase).toBe('FINISHED');
    expect(state.winnerPlayerId).toBeNull();
    expect(state.players.a!.activeSupportCount).toBe(0);
    for (const conn of [b, c]) expect(messages(conn, 'ROOM_SNAPSHOT').at(-1)).toMatchObject({ state: { phase: 'FINISHED', winnerPlayerId: null, discard: state.discard } });
  });

  it('heartbeat detecta uma conexão silenciosa', () => {
    const b = join('b');
    b.emit('data', { type: 'HEARTBEAT' });
    expect(messages(b, 'HEARTBEAT_ACK')).toHaveLength(1);
    vi.advanceTimersByTime(20000);
    expect(b.open).toBe(false);
    expect(state.players.b!.isConnected).toBe(false);
  });

  it('rodada manual seguida de timeout passa o turno sem expulsar jogadores que respondem heartbeat', () => {
    const { b, c } = start();
    host.executeLocalHostCommand({ type: 'DECLARE_ACTION', payload: { actionType: 'salary' } });
    send(b, 'b', { type: 'DECLARE_ACTION', payload: { actionType: 'salary' } });
    send(c, 'c', { type: 'DECLARE_ACTION', payload: { actionType: 'salary' } });
    const pulse = setInterval(() => {
      for (const conn of [b, c]) conn.emit('data', { type: 'HEARTBEAT' });
    }, 5000);
    try {
      vi.advanceTimersByTime(DEFAULT_GAME_SETTINGS.actionTimeoutMs);
      expect(state.activePlayerId).toBe('b');
      expect(state.turn).toBe(5);
      vi.advanceTimersByTime(DEFAULT_GAME_SETTINGS.actionTimeoutMs);
      expect(state.activePlayerId).toBe('c');
      expect(state.phase).toBe('WAITING_ACTION');
      expect(b.open && c.open).toBe(true);
    } finally { clearInterval(pulse); }
  });

  it('retomar um host com timers suspensos não expulsa conexões antes de ouvir novos heartbeats', () => {
    const { b, c } = start();
    host.executeLocalHostCommand({ type: 'DECLARE_ACTION', payload: { actionType: 'salary' } });
    send(b, 'b', { type: 'DECLARE_ACTION', payload: { actionType: 'salary' } });
    send(c, 'c', { type: 'DECLARE_ACTION', payload: { actionType: 'salary' } });
    vi.setSystemTime(Date.now() + DEFAULT_GAME_SETTINGS.actionTimeoutMs + 120000);
    vi.advanceTimersByTime(5000);
    expect(b.open && c.open).toBe(true);
    for (const conn of [b, c]) conn.emit('data', { type: 'HEARTBEAT' });
    expect(state.players.b!.isConnected).toBe(true);
    expect(state.players.c!.isConnected).toBe(true);
    expect(state.activePlayerId).toBe('b');
    expect(state.turn).toBe(5);
  });

  it('remove ausente do lobby após prazo de graça para não impedir início', () => {
    const b = join('b');
    b.close();
    vi.advanceTimersByTime(65000);
    expect(state.playerOrder).toEqual(['a']);
    expect(state.players).not.toHaveProperty('b');
  });

  it('protocolo rejeita enums inválidos e identificadores de protótipo', () => {
    for (const id of ['__proto__', 'constructor']) expect(isClientEnvelope({
      protocol: 1, roomCode: 'ROOM', playerId: id, messageId: 'bad', sentAt: Date.now(),
      data: { type: 'SET_READY', payload: { ready: true } },
    })).toBe(false);
    expect(isClientEnvelope({ protocol: 1, roomCode: 'ROOM', playerId: 'b', messageId: 'bad', sentAt: Date.now(),
      data: { type: 'DECLARE_ACTION', payload: { actionType: 'winGame' } },
    })).toBe(false);
  });
});

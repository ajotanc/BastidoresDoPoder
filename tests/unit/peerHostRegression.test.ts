import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ClientCommand } from '@/game/models/commands';
import type { GameState } from '@/game/models/gameState';
import { PeerHost } from '@/online/peer/peerHost';
import { isClientEnvelope } from '@/online/peer/protocol';

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
    });
    const ready = host.init();
    transport.peers.at(-1)!.emit('open', 'bdp-room');
    await ready;
  });
  afterEach(() => { host.destroy(); vi.useRealTimers(); });

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

  it('reagenda timeout para turnos seguintes e prossegue com ausentes', () => {
    start();
    vi.advanceTimersByTime(45000);
    expect(state.turn).toBe(2);
    expect(state.players.a!.coins).toBe(3);
    vi.advanceTimersByTime(45000);
    expect(state.turn).toBe(3);
    expect(state.players.b!.coins).toBe(3);
  });

  it('timeout não pode ser acionado por uma mensagem de cliente', () => {
    const { b } = start();
    b.emit('data', { protocol: 1, roomCode: 'ROOM', playerId: 'b', messageId: 'fake-timeout', sentAt: Date.now(), data: { type: 'TIMEOUT', payload: {} } });
    expect(state.turn).toBe(1);
    expect(messages(b, 'COMMAND_REJECTED').at(-1)).toMatchObject({ reject: { reason: 'INVALID_COMMAND' } });
  });

  it('heartbeat detecta uma conexão silenciosa', () => {
    const b = join('b');
    b.emit('data', { type: 'HEARTBEAT' });
    expect(messages(b, 'HEARTBEAT_ACK')).toHaveLength(1);
    vi.advanceTimersByTime(20000);
    expect(b.open).toBe(false);
    expect(state.players.b!.isConnected).toBe(false);
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

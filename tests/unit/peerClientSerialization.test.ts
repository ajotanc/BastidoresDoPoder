import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { createInitialAuthoritativeState } from '@/game/engine/gameEngine';
import { CONNECTION_TIMEOUT_MS } from '@/constants/gameConfig';
import { PeerClient } from '@/online/peer/peerClient';
import { isClientEnvelope } from '@/online/peer/protocol';

const mocks = vi.hoisted(() => {
  const peerEvents = new Map<string, (...args: unknown[]) => void>();
  const connectionEvents = new Map<string, (...args: unknown[]) => void>();
  const connection = { open: true, send: vi.fn(), close: vi.fn(),
    on: (name: string, fn: (...args: unknown[]) => void) => connectionEvents.set(name, fn) };
  const connect = vi.fn(() => connection);
  class MockPeer {
    on = (name: string, fn: (...args: unknown[]) => void) => peerEvents.set(name, fn);
    connect = connect;
    destroy = vi.fn();
  }
  return { MockPeer, peerEvents, connectionEvents, connection, connect };
});
vi.mock('peerjs', () => ({ default: mocks.MockPeer }));

describe('Contrato de serialização do cliente PeerJS', () => {
  beforeEach(() => { vi.clearAllMocks(); mocks.peerEvents.clear(); mocks.connectionEvents.clear(); });
  afterEach(() => { vi.useRealTimers(); });

  it('ao retomar timers suspensos, sonda o host antes de fechar e ainda detecta silêncio real', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(100000);
    const client = new PeerClient('ROOM', 'player-b', { onConnected: vi.fn(), onDisconnected: vi.fn(),
      onStateChange: vi.fn(), onPrivateViewChange: vi.fn(), onError: vi.fn() });
    const connecting = client.connect();
    mocks.peerEvents.get('open')!();
    mocks.connectionEvents.get('open')!();
    mocks.connectionEvents.get('data')!({ type: 'ROOM_SNAPSHOT', state: createInitialAuthoritativeState('ROOM', 'host', 'Ana', undefined, 'token').publicState });
    await connecting;
    try {
      vi.setSystemTime(Date.now() + 120000);
      vi.advanceTimersByTime(5000);
      expect(mocks.connection.close).not.toHaveBeenCalled();
      expect(mocks.connection.send).toHaveBeenLastCalledWith({ type: 'HEARTBEAT' });
      mocks.connectionEvents.get('data')!({ type: 'HEARTBEAT_ACK', timestamp: Date.now() });
      vi.advanceTimersByTime(10000);
      expect(mocks.connection.close).not.toHaveBeenCalled();
      vi.advanceTimersByTime(10000);
      expect(mocks.connection.close).toHaveBeenCalled();
    } finally { client.destroy(); }
  });
  it('negocia JSON e omite revision na entrada, preservando campos opcionais das ações', async () => {
    const client = new PeerClient('ROOM', 'player-b', { onConnected: vi.fn(), onDisconnected: vi.fn(),
      onStateChange: vi.fn(), onPrivateViewChange: vi.fn(), onError: vi.fn() });
    const connecting = client.connect();
    mocks.peerEvents.get('open')!();
    expect(mocks.connect).toHaveBeenCalledWith('bdp-room', { reliable: true, serialization: 'json' });
    mocks.connectionEvents.get('open')!();
    try {
      client.sendCommand({ type: 'JOIN_ROOM', payload: { name: 'Bruno', avatarSlug: 'baron', reconnectToken: 'token-b' } });
      const join = mocks.connection.send.mock.calls.at(-1)![0];
      expect(join).not.toHaveProperty('revision');
      mocks.connectionEvents.get('data')!({ type: 'ROOM_SNAPSHOT', state: createInitialAuthoritativeState('ROOM', 'host', 'Ana', undefined, 'token').publicState });
      await connecting;
      expect(isClientEnvelope(JSON.parse(JSON.stringify(join)))).toBe(true);
      client.sendCommand({ type: 'DECLARE_ACTION', payload: { actionType: 'salary', targetPlayerId: undefined, namedRole: undefined, secondaryPlayerId: undefined } });
      const wire = JSON.parse(JSON.stringify(mocks.connection.send.mock.calls.at(-1)![0]));
      expect(wire.data.payload).toEqual({ actionType: 'salary' });
      expect(isClientEnvelope(wire)).toBe(true);
    } finally { client.destroy(); }
  });
});

it('não considera a conexão pronta antes do snapshot e expira se o host não confirmar', async () => {
  vi.useFakeTimers();
  const client = new PeerClient('ROOM', 'player-b', { onConnected: vi.fn(), onDisconnected: vi.fn(), onStateChange: vi.fn(), onPrivateViewChange: vi.fn(), onError: vi.fn() });
  const connecting = client.connect();
  const rejected = expect(connecting).rejects.toThrow();
  mocks.peerEvents.get('open')!();
  mocks.connectionEvents.get('open')!();
  await vi.advanceTimersByTimeAsync(CONNECTION_TIMEOUT_MS);
  await rejected;
  client.destroy();
  vi.useRealTimers();
});

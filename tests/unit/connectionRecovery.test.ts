import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import type { ClientCallbacks } from '@/online/peer/peerClient';
import { useGameStore } from '@/stores/gameStore';
import { createInitialAuthoritativeState } from '@/game/engine/gameEngine';
import { RECONNECT_RETRY_MS } from '@/constants/gameConfig';
const clients = vi.hoisted(() => [] as { callbacks: ClientCallbacks }[]);
vi.mock('@/online/peer/peerClient', () => ({ PeerClient: class {
  constructor(_room: string, _id: string, public callbacks: ClientCallbacks) { clients.push(this); }
  connect = vi.fn().mockResolvedValue(undefined);
  sendCommand = vi.fn(); destroy = vi.fn(); leaveRoom = vi.fn();
} }));
beforeEach(() => { setActivePinia(createPinia()); clients.length = 0; sessionStorage.clear(); vi.useFakeTimers(); });
afterEach(() => { vi.useRealTimers(); sessionStorage.clear(); });
const state = () => createInitialAuthoritativeState('ABCD', 'host', 'Ana', undefined, 'token').publicState;
it('mantém a mesa visível e só encerra o aviso após receber o estado do host', async () => {
  const store = useGameStore();
  await store.joinRoom('ABCD', 'Bruno');
  clients[0]!.callbacks.onStateChange(state());
  clients[0]!.callbacks.onDisconnected();
  expect(store.connectionStatus).toBe('reconnecting');
  expect(store.reconnectAttempt).toBe(1);
  await vi.advanceTimersByTimeAsync(RECONNECT_RETRY_MS);
  expect(store.mode).toBe('lobby');
  expect(store.connectionStatus).toBe('reconnecting');
  clients[1]!.callbacks.onStateChange(state());
  expect(store.connectionStatus).toBe('connected');
  store.leaveRoom();
});
it('callbacks antigos não reabrem a mesa depois da saída voluntária', async () => {
  const store = useGameStore();
  await store.joinRoom('ABCD', 'Bruno');
  clients[0]!.callbacks.onStateChange(state());
  clients[0]!.callbacks.onDisconnected();
  store.leaveRoom();
  clients[0]!.callbacks.onStateChange(state());
  clients[0]!.callbacks.onDisconnected();
  await vi.advanceTimersByTimeAsync(RECONNECT_RETRY_MS * 2);
  expect(store.mode).toBe('idle');
  expect(store.gameState).toBeNull();
  expect(clients).toHaveLength(1);
});

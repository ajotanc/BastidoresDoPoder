import { afterEach, expect, it, vi } from 'vitest';
import { PeerHost } from '@/online/peer/peerHost';

 afterEach(() => vi.unstubAllGlobals());

it('não solicita conversa quando Discord está desligado, mesmo em tentativa manual', async () => {
  const fetch = vi.fn();
  vi.stubGlobal('fetch', fetch);
  const callbacks = { onStateChange: vi.fn(), onPrivateViewChange: vi.fn(), onError: vi.fn(), onReady: vi.fn() };
  const host = new PeerHost('ABCD', 'host', 'Ana', undefined, 'token', callbacks);
  try {
    await host.prepareConversation();
    await host.prepareConversation();
    expect(fetch).not.toHaveBeenCalled();
    expect(callbacks.onStateChange).not.toHaveBeenCalled();
  } finally { host.destroy(); }
});

it('solicita conversa somente quando habilitada e compartilha o estado de autenticação', async () => {
  const fetch = vi.fn().mockResolvedValue(new Response(null, { status: 401 }));
  vi.stubGlobal('fetch', fetch);
  const callbacks = { onStateChange: vi.fn(), onPrivateViewChange: vi.fn(), onError: vi.fn(), onReady: vi.fn() };
  const host = new PeerHost('ABCD', 'host', 'Ana', undefined, 'token', callbacks, undefined, 0, undefined, {}, true);
  try {
    await host.prepareConversation();
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(callbacks.onStateChange).toHaveBeenLastCalledWith(expect.objectContaining({ discordConversation: { status: 'auth-required' } }));
  } finally { host.destroy(); }
});

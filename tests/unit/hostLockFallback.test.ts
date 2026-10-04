import { afterEach, describe, expect, it, vi } from 'vitest';
import { acquireHostLock } from '@/online/room/hostRecovery';

describe('acquireHostLock sem navigator.locks (contexto inseguro)', () => {
  afterEach(() => { vi.unstubAllGlobals(); localStorage.clear(); });

  it('permite hospedar e bloqueia uma segunda aba até a liberação', async () => {
    vi.stubGlobal('navigator', { ...navigator, locks: undefined });
    const release = await acquireHostLock('ABC123');
    await expect(acquireHostLock('ABC123')).rejects.toThrow('outra aba');
    release();
    const again = await acquireHostLock('ABC123');
    again();
  });
});

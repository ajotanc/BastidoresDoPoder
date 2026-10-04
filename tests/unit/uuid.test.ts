import { afterEach, describe, expect, it, vi } from 'vitest';
import { randomUUID } from '@/utils/uuid';

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

describe('randomUUID', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('gera um UUID v4 válido', () => {
    expect(randomUUID()).toMatch(UUID_V4);
  });

  it('funciona em contexto inseguro, sem crypto.randomUUID', () => {
    vi.stubGlobal('crypto', { getRandomValues: globalThis.crypto.getRandomValues.bind(globalThis.crypto) });
    const first = randomUUID();
    expect(first).toMatch(UUID_V4);
    expect(randomUUID()).not.toBe(first);
  });
});

import { createHmac } from 'node:crypto';
import { afterEach, expect, it, vi } from 'vitest';
import { readSession, signSession } from '../../netlify/lib/discordAuth';

const testKey = 'local-session-validation-fixture';
afterEach(() => vi.unstubAllEnvs());
it('retorna a sessão com os campos correspondentes ao seu tipo', () => {
  vi.stubEnv('DISCORD_CLIENT_SECRET', testKey);
  const user = { kind: 'user' as const, userId: '123456789012345678', expiresAt: Date.now() + 10000 };
  expect(readSession(signSession(user))).toEqual(user);
  const oauth = { kind: 'oauth' as const, state: 'nonce', origin: 'https://game.test', expiresAt: user.expiresAt };
  expect(readSession(signSession(oauth))).toEqual(oauth);
  expect(readSession(`${signSession(user)}.extra`)).toBeNull();
});
it.each([{ kind: 'user', userId: 123 }, { kind: 'oauth', state: {}, origin: 'https://game.test' }, { kind: 'other' }])('rejeita formatos inválidos mesmo com assinatura válida', data => {
  vi.stubEnv('DISCORD_CLIENT_SECRET', testKey);
  const payload = Buffer.from(JSON.stringify({ ...data, expiresAt: Date.now() + 10000 })).toString('base64url');
  const signature = createHmac('sha256', testKey).update(payload).digest('base64url');
  expect(readSession(`${payload}.${signature}`)).toBeNull();
});

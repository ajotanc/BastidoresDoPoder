import { createHmac, timingSafeEqual } from 'node:crypto';
import { isRecord } from '../../src/utils/typeGuards';

export type DiscordSession =
 | { kind: 'user'; userId: string; expiresAt: number }
 | { kind: 'oauth'; state: string; origin: string; expiresAt: number };

function isDiscordSession(value: unknown): value is DiscordSession {
 if (!isRecord(value) || typeof value.expiresAt !== 'number' || !Number.isFinite(value.expiresAt)) return false;
 if (value.kind === 'user') return typeof value.userId === 'string' && /^\d{17,20}$/.test(value.userId);
 return value.kind === 'oauth' && typeof value.state === 'string' && value.state.length > 0 && typeof value.origin === 'string' && value.origin.length > 0;
}
export function signSession(value: DiscordSession): string {
 const key = process.env.DISCORD_CLIENT_SECRET;
 if (!key) throw new Error('AUTH_NOT_CONFIGURED');
 const payload=Buffer.from(JSON.stringify(value)).toString('base64url');
 return `${payload}.${createHmac('sha256',key).update(payload).digest('base64url')}`;
}
export function readSession(token: string | undefined): DiscordSession | null {
 try {
  if (!token || !process.env.DISCORD_CLIENT_SECRET) return null;
  const [payload,signature,extra]=token.split('.');
  if (!payload || !signature || extra !== undefined) return null;
  const expected=createHmac('sha256',process.env.DISCORD_CLIENT_SECRET).update(payload).digest('base64url');
  if (signature.length!==expected.length || !timingSafeEqual(Buffer.from(signature),Buffer.from(expected))) return null;
  const value: unknown=JSON.parse(Buffer.from(payload,'base64url').toString());
  return isDiscordSession(value) && value.expiresAt>Date.now() ? value : null;
 } catch { return null; }
}
export function cookie(request: Request, name: string): string | undefined {
 return request.headers.get('cookie')?.split(';').map(value=>value.trim()).find(value=>value.startsWith(`${name}=`))?.slice(name.length+1);
}
export function authenticatedUser(request: Request): string | null {
 const session=readSession(cookie(request,'bdp_discord_session'));
 return session?.kind==='user' && typeof session.userId==='string' && /^\d{17,20}$/.test(session.userId) ? session.userId : null;
}
export function sessionCookie(name: string, value: string, maxAge: number): string {
 return `${name}=${value}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;
}

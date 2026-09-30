import { createHmac, timingSafeEqual } from 'node:crypto';
export function signSession(value: object): string {
 const key = process.env.DISCORD_CLIENT_SECRET;
 if (!key) throw new Error('AUTH_NOT_CONFIGURED');
 const payload=Buffer.from(JSON.stringify(value)).toString('base64url');
 return `${payload}.${createHmac('sha256',key).update(payload).digest('base64url')}`;
}
export function readSession(token: string | undefined): Record<string, unknown> | null {
 try {
  if (!token || !process.env.DISCORD_CLIENT_SECRET) return null;
  const [payload,signature]=token.split('.');
  if (!payload || !signature) return null;
  const expected=createHmac('sha256',process.env.DISCORD_CLIENT_SECRET).update(payload).digest('base64url');
  if (signature.length!==expected.length || !timingSafeEqual(Buffer.from(signature),Buffer.from(expected))) return null;
  const value=JSON.parse(Buffer.from(payload,'base64url').toString());
  return value && typeof value.expiresAt==='number' && value.expiresAt>Date.now() ? value : null;
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

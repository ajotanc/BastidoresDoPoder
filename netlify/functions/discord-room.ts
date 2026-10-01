import { authenticatedUser } from '../lib/discordAuth';
import { createConversation } from '../lib/discord';
import { isRecord } from '../../src/utils/typeGuards';
export default async function handler(request: Request): Promise<Response> {
  const json = (data: object, status = 200) => Response.json(data, { status, headers: { 'Cache-Control': 'no-store' } });
  if (request.method !== 'POST') return json({ error: 'Método não permitido.' }, 405);
  if (request.headers.get('origin') !== new URL(request.url).origin) return json({ error: 'Origem não permitida.' }, 403);
  if (!request.headers.get('content-type')?.startsWith('application/json')) return json({ error: 'Formato inválido.' }, 415);
  const userId = authenticatedUser(request);
  if (!userId) return json({ error: 'Conecte seu Discord para criar a conversa.' }, 401);
  const body = await request.text();
  if (body.length > 512) return json({ error: 'Solicitação inválida.' }, 413);
  let payload: unknown;
  try { payload = JSON.parse(body); } catch { return json({ error: 'Solicitação inválida.' }, 400); }
  if (!isRecord(payload) || typeof payload.roomCode !== 'string' || typeof payload.sessionId !== 'string' || !/^[2-9A-HJ-NP-Z]{4}$/.test(payload.roomCode ?? '') ||
      !/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/.test(payload.sessionId ?? ''))
    return json({ error: 'Mesa inválida.' }, 400);
  try { return json(await createConversation(payload.roomCode, `${userId}:${payload.sessionId}`)); }
  catch (error) { console.error('Discord room failure', error instanceof Error && /^(Discord HTTP [0-9]{3}|AUDIT_SCAN_INCOMPLETE)$/.test(error.message) ? error.message : 'UPSTREAM_FAILURE'); return json({ error: 'A conversa está indisponível. A partida pode continuar normalmente.' }, 503); }
}
export const config = { rateLimit: { windowLimit: 3, windowSize: 180, aggregateBy: ['ip', 'domain'] } };

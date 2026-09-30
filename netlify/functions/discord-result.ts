import { createHash } from 'node:crypto';
import { authenticatedUser } from '../lib/discordAuth';
import { channels, creationRecords, discord, expiresAt, ownedChannel, sessionMarker } from '../lib/discord';
import { resultText, type ResultSummary } from '../../src/game/resultSummary';

const uuid = /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/;
function validSummary(value: unknown): value is ResultSummary {
  if (!value || typeof value !== 'object') return false;
  const s = value as ResultSummary;
  return typeof s.gameId === 'string' && (uuid.test(s.gameId) || /^game-[2-9A-HJ-NP-Z]{4}-[0-9]{13}$/.test(s.gameId)) && /^[2-9A-HJ-NP-Z]{4}$/.test(s.roomCode)
    && typeof s.winnerName === 'string' && s.winnerName.trim().length > 0 && s.winnerName.length <= 80
    && typeof s.decisivePlay === 'string' && s.decisivePlay.length <= 1500
    && [s.turns, s.supports, s.coins, s.finishedAt].every(n => Number.isSafeInteger(n) && n >= 0)
    && s.supports <= 2 && s.turns <= 100000 && s.coins <= 100000
    && (s.durationSeconds === null || (Number.isSafeInteger(s.durationSeconds) && s.durationSeconds >= 0 && s.durationSeconds <= 604800));
}
export default async function handler(request: Request): Promise<Response> {
  const json = (data: object, status = 200) => Response.json(data, { status, headers: { 'Cache-Control': 'no-store' } });
  if (request.method !== 'POST') return json({ error: 'Método não permitido.' }, 405);
  if (request.headers.get('origin') !== new URL(request.url).origin) return json({ error: 'Origem não permitida.' }, 403);
  if (!request.headers.get('content-type')?.startsWith('application/json')) return json({ error: 'Formato inválido.' }, 415);
  const userId = authenticatedUser(request);
  if (!userId) return json({ error: 'Conecte seu Discord para publicar o resultado.' }, 401);
  const body = await request.text();
  if (body.length > 4096) return json({ error: 'Solicitação inválida.' }, 413);
  let payload;
  try { payload = JSON.parse(body); } catch { return json({ error: 'Solicitação inválida.' }, 400); }
  if (!payload || typeof payload.sessionId !== 'string' || !uuid.test(payload.sessionId) || !validSummary(payload.summary)) return json({ error: 'Resultado inválido.' }, 400);
  const summary: ResultSummary = payload.summary;
  try {
    const destinationId = process.env.DISCORD_RESULTS_CHANNEL_ID;
    if (!destinationId || !/^[0-9]{17,20}$/.test(destinationId)) throw new Error('RESULTS_CHANNEL_NOT_CONFIGURED');
    const records = await creationRecords();
    const marker = sessionMarker(summary.roomCode, `${userId}:${payload.sessionId}`);
    const list = await channels();
    const channel = list.find(item => records.get(item.id) === marker && ownedChannel(item, records) && expiresAt(item.id) > Date.now());
    if (!channel) return json({ error: 'Conversa indisponível.' }, 404);
    // The guild channel list verifies the fixed destination belongs to this server.
    const destination = list.find(item => item.id === destinationId && item.type === 0);
    if (!destination) throw new Error('INVALID_RESULTS_CHANNEL');
    const nonce = createHash('sha256').update(`${marker}:${summary.gameId}`).digest('hex').slice(0, 24);
    const url = `${new URL(request.url).origin}/game/${summary.roomCode}#resultado-${nonce}`;
    const bot = await discord('/users/@me') as { id: string };
    let before = '';
    // Fail closed if the bounded history scan cannot prove this result is new.
    for (let page = 0; page < 5; page++) {
      const messages = await discord(`/channels/${destination.id}/messages?limit=100${before ? `&before=${before}` : ''}`) as { id: string; author: { id: string }; embeds?: { url?: string }[] }[];
      if (!Array.isArray(messages)) throw new Error('INVALID_HISTORY');
      if (messages.some(message => message.author.id === bot.id && message.embeds?.some(embed => embed.url?.endsWith(`#resultado-${nonce}`)))) return json({ sent: true });
      const last = messages.at(-1);
      // Results for this session cannot predate its verified voice channel.
      if (messages.length < 100 || (last && /^[0-9]{17,20}$/.test(last.id) && BigInt(last.id) < BigInt(channel.id))) break;
      if (page === 4) throw new Error('HISTORY_SCAN_INCOMPLETE');
      before = messages.at(-1)!.id;
    }
    const description = resultText(summary).replace(/([\\`*_~|>])/g, '\\$1');
    await discord(`/channels/${destination.id}/messages`, 'POST', {
      embeds: [{ title: 'Bastidores do Poder · Resultado da mesa', description, color: 0xe8c474, url }],
      allowed_mentions: { parse: [] }, nonce, enforce_nonce: true,
    });
    return json({ sent: true });
  } catch { return json({ error: 'Não foi possível publicar o resultado. A partida foi preservada.' }, 503); }
}
export const config = { rateLimit: { windowLimit: 6, windowSize: 180, aggregateBy: ['ip', 'domain'] } };

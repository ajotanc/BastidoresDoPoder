import { createHash } from 'node:crypto';
import { channels, discord } from '../lib/discord';
import { isRecord } from '../../src/utils/typeGuards';
import { durationLabel, type ResultSummary } from '../../src/game/resultSummary';

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
  const body = await request.text();
  if (body.length > 4096) return json({ error: 'Solicitação inválida.' }, 413);
  let payload: unknown;
  try { payload = JSON.parse(body); } catch { return json({ error: 'Solicitação inválida.' }, 400); }
  if (!isRecord(payload) || !validSummary(payload.summary)) return json({ error: 'Resultado inválido.' }, 400);
  const summary: ResultSummary = payload.summary;
  if (summary.finishedAt < Date.now() - 86400000 || summary.finishedAt > Date.now() + 60000) return json({ error: 'Resultado expirado ou com horário inválido.' }, 400);
  try {
    const destinationId = process.env.DISCORD_RESULTS_CHANNEL_ID;
    if (!destinationId || !/^[0-9]{17,20}$/.test(destinationId)) throw new Error('RESULTS_CHANNEL_NOT_CONFIGURED');
    const list = await channels();
    // The guild channel list verifies the fixed destination belongs to this server.
    const destination = list.find(item => item.id === destinationId && item.type === 0);
    if (!destination) throw new Error('INVALID_RESULTS_CHANNEL');
    const nonce = createHash('sha256').update(`${summary.roomCode}:${summary.gameId}`).digest('hex').slice(0, 24);
    const url = `${new URL(request.url).origin}/room/${summary.roomCode}#resultado-${nonce}`;
    const bot = await discord('/users/@me') as { id: string };
    let before = '';
    // Fail closed if the bounded history scan cannot prove this result is new.
    for (let page = 0; page < 5; page++) {
      const messages = await discord(`/channels/${destination.id}/messages?limit=100${before ? `&before=${before}` : ''}`) as { id: string; author: { id: string }; embeds?: { url?: string }[] }[];
      if (!Array.isArray(messages)) throw new Error('INVALID_HISTORY');
      if (messages.some(message => message.author.id === bot.id && message.embeds?.some(embed => embed.url?.endsWith(`#resultado-${nonce}`)))) return json({ sent: true });
      const last = messages.at(-1);
      // Only accept recent results, so older channel history is irrelevant.
      if (messages.length < 100 || (last && /^[0-9]{17,20}$/.test(last.id) && Number(BigInt(last.id) >> 22n) + 1420070400000 < Date.now() - 86400000)) break;
      if (page === 4) throw new Error('HISTORY_SCAN_INCOMPLETE');
      before = messages.at(-1)!.id;
    }
    const escape = (value: string) => value.replace(/([\\`*_~|>[\]#])/g, '\\$1');
    const description = `🏆 **${escape(summary.winnerName)} conquistou o poder!**\nMesa ${summary.roomCode} · ${summary.turns} turnos · ${durationLabel(summary.durationSeconds)}`;
    await discord(`/channels/${destination.id}/messages`, 'POST', {
      embeds: [{ title: 'Bastidores do Poder · Resultado da Mesa', description, color: 0xe8c474, url,
        fields: [
          { name: 'Apoios restantes', value: `${summary.supports} ${summary.supports === 1 ? 'apoio' : 'apoios'}`, inline: true },
          { name: 'Reserva final', value: `C$ ${summary.coins}`, inline: true },
          { name: 'Jogada decisiva', value: escape(summary.decisivePlay.replace(/^APOIO PERDIDO!\s*/i, '')).slice(0, 1000) },
        ],
        footer: { text: `Mesa ${summary.roomCode} · A disputa acabou. A próxima já pode começar.` },
        timestamp: new Date(summary.finishedAt).toISOString(),
      }],
      allowed_mentions: { parse: [] }, nonce, enforce_nonce: true,
    });
    return json({ sent: true });
  } catch (error) {
    const reason = error instanceof Error ? error.message : '';
    const code = /^(RESULTS_CHANNEL_NOT_CONFIGURED|INVALID_RESULTS_CHANNEL|HISTORY_SCAN_INCOMPLETE|INVALID_HISTORY|Discord HTTP [0-9]{3})$/.test(reason) ? reason : 'UPSTREAM_FAILURE';
    console.error('Discord result failure', code);
    return json({ error: 'Não foi possível publicar o resultado. A partida foi preservada.', code }, 503);
  }
}
export const config = { rateLimit: { windowLimit: 6, windowSize: 180, aggregateBy: ['ip', 'domain'] } };

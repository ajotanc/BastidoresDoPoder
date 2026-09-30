import gameConfig from '../../game.config.json';
import { createHash, createHmac, timingSafeEqual } from 'node:crypto';

export const CHANNEL_TTL_MS = 24 * 60 * 60 * 1000;
interface DiscordChannel { id: string; name: string; type: number; parent_id?: string }
export function settings() {
  const token = process.env.DISCORD_BOT_TOKEN;
  const guild = process.env.DISCORD_GUILD_ID;
  const category = process.env.DISCORD_CATEGORY_ID;
  if (!token || !guild || !category) throw new Error('Discord não configurado.');
  return { token, guild, category };
}
function sign(value: string): string {
  return createHmac('sha256', settings().token).update(value).digest('hex').slice(0, 12);
}
export function channelName(code: string): string {
  return `Mesa (${code.toUpperCase()})`;
}
export function sessionMarker(code: string, sessionId: string): string {
  return `v2:${code.toUpperCase()}:${createHash('sha256').update(sessionId).digest('hex')}`;
}
function validMarker(marker: string): boolean {
  const match = /^(mesa-[2-9a-hj-np-z]{4}-[a-f0-9]{12})-([a-f0-9]{12})$/.exec(marker);
  return !!match && timingSafeEqual(Buffer.from(sign(match[1]!)), Buffer.from(match[2]!));
}
export function ownedChannel(channel: DiscordChannel, records = new Map<string, string>()): boolean {
  if (channel.type !== 2 || channel.parent_id !== settings().category) return false;
  if (validMarker(channel.name)) return true; // Previously created channels remain eligible for cleanup.
  const marker = records.get(channel.id);
  return !!marker && channel.name === channelName(marker.startsWith('v2:') ? marker.split(':')[1]! : marker.split('-')[1]!);
}
export async function creationRecords(): Promise<Map<string, string>> {
  const records = new Map<string, string>();
  const bot = await discord('/users/@me') as { id: string };
  if (typeof bot.id !== 'string') throw new Error('INVALID_BOT_RESPONSE');
  const deadline = Date.now() + 12000;
  let before = '';
  for (let page = 0; page < 10 && Date.now() < deadline; page++) {
    const result = await discord(`/guilds/${settings().guild}/audit-logs?action_type=10&user_id=${bot.id}&limit=100${before ? `&before=${before}` : ''}`, 'GET', undefined, undefined, Math.min(5000, deadline - Date.now())) as {
      audit_log_entries: { id: string; action_type: number; user_id: string; target_id: string; reason?: string }[];
    };
    if (!Array.isArray(result.audit_log_entries)) throw new Error('Registro de auditoria inválido.');
    for (const entry of result.audit_log_entries) {
      const marker = entry.reason?.startsWith('bdp:') ? entry.reason.slice(4) : '';
      if (entry.action_type === 10 && entry.user_id === bot.id && (/^v2:[2-9A-HJ-NP-Z]{4}:[a-f0-9]{64}$/.test(marker) || /^mesa-[2-9a-hj-np-z]{4}-[a-f0-9]{12}-[a-f0-9]{12}$/.test(marker))) records.set(entry.target_id, marker);
    }
    const last = result.audit_log_entries.at(-1);
    if (!last || result.audit_log_entries.length < 100) return records;
    before = last.id;
  }
  throw new Error('AUDIT_SCAN_INCOMPLETE');
}
export function expiresAt(id: string): number {
  return Number(BigInt(id) >> 22n) + 1420070400000 + CHANNEL_TTL_MS;
}
export async function discord(path: string, method = 'GET', body?: object, reason?: string, timeoutMs = 5000): Promise<unknown> {
  const response = await fetch(`https://discord.com/api/v10${path}`, {
    method, headers: { Authorization: `Bot ${settings().token}`, 'Content-Type': 'application/json', ...(reason ? { 'X-Audit-Log-Reason': encodeURIComponent(reason) } : {}) },
    body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(Math.max(1, timeoutMs)),
  });
  if (!response.ok) throw new Error(`Discord HTTP ${response.status}`);
  return response.status === 204 ? null : response.json();
}
export async function channels(): Promise<DiscordChannel[]> {
  const data = await discord(`/guilds/${settings().guild}/channels`);
  if (!Array.isArray(data)) throw new Error('Resposta inválida do Discord.');
  return data as DiscordChannel[];
}
async function createConversationOnce(code: string, sessionId: string) {
  const { guild, category } = settings();
  const list = await channels();
  const records = await creationRecords();
  const name = channelName(code);
  const marker = sessionMarker(code, sessionId);
  let channel = list.find(item => (item.name === marker || records.get(item.id) === marker) && ownedChannel(item, records) && expiresAt(item.id) > Date.now());

  if (!channel) {
    if (list.filter(item => item.parent_id === category).length >= 40) throw new Error('Limite de mesas de voz atingido.');
    channel = await discord(`/guilds/${guild}/channels`, 'POST', { name, type: 2, parent_id: category, user_limit: gameConfig.maxPlayers }, `bdp:${marker}`) as DiscordChannel;
  }
  const expiry = expiresAt(channel.id);
  const invite = await discord(`/channels/${channel.id}/invites`, 'POST', {
    max_age: Math.max(1, Math.floor((expiry - Date.now()) / 1000)), max_uses: 0, unique: false,
  }) as { code: string };
  if (!/^[\w-]+$/.test(invite.code)) throw new Error('Convite inválido.');
  return { url: `https://discord.gg/${invite.code}`, expiresAt: expiry };
}

// Coalesce simultaneous retries handled by this instance. Cross-instance races still
// require a durable lock; never treat this map as distributed synchronization.
const pendingCreations = new Map<string, Promise<{ url: string; expiresAt: number }>>();
export function createConversation(code: string, sessionId: string) {
  const key = sessionMarker(code, sessionId);
  const pending = pendingCreations.get(key);
  if (pending) return pending;
  const request = createConversationOnce(code, sessionId).finally(() => pendingCreations.delete(key));
  pendingCreations.set(key, request);
  return request;
}

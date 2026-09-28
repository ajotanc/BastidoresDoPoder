import dayjs from 'dayjs';
const CHUNK_SIZE = 6000;
const MAX_CHUNKS = 200;
type Sender = { send(data: unknown): void };
export function sendPeerMessage(connection: Sender, message: unknown): void {
  const json = JSON.stringify(message).replace(/[\u007f-\uffff]/g, char => '\\u' + char.charCodeAt(0).toString(16).padStart(4, '0'));
  if (json.length <= CHUNK_SIZE) { connection.send(message); return; }
  const total = Math.ceil(json.length / CHUNK_SIZE);
  if (total > MAX_CHUNKS) throw new Error('Mensagem da sala excedeu o limite de tamanho.');
  const id = crypto.randomUUID();
  for (let index = 0; index < total; index++) {
    connection.send({ type: 'BDP_JSON_CHUNK', id, index, total, text: json.slice(index * CHUNK_SIZE, (index + 1) * CHUNK_SIZE) });
  }
}
export function createPeerMessageReader(): (input: unknown) => unknown {
  const pending = new Map<string, { total: number; created: number; parts: Map<number, string> }>();
  return (input: unknown): unknown => {
    if (!input || typeof input !== 'object' || !('type' in input) || input.type !== 'BDP_JSON_CHUNK') return input;
    const chunk = input as Record<string, unknown>;
    const { id, index, total, text } = chunk;
    if (typeof id !== 'string' || id.length > 64 || typeof index !== 'number' || !Number.isInteger(index) ||
        typeof total !== 'number' || !Number.isInteger(total) || total < 1 || total > MAX_CHUNKS ||
        index < 0 || index >= total || typeof text !== 'string' || text.length > CHUNK_SIZE) return undefined;
    const now = dayjs().valueOf();
    for (const [key, value] of pending) if (now - value.created > 30000) pending.delete(key);
    let entry = pending.get(id);
    if (!entry) {
      if (pending.size >= 4) return undefined;
      entry = { total, created: now, parts: new Map() }; pending.set(id, entry);
    }
    if (entry.total !== total) { pending.delete(id); return undefined; }
    entry.parts.set(index, text);
    if (entry.parts.size !== total) return undefined;
    pending.delete(id);
    try { return JSON.parse(Array.from({ length: total }, (_, i) => entry!.parts.get(i)).join('')); }
    catch { return undefined; }
  };
}

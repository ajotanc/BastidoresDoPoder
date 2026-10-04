import type { AuthoritativeGameState } from '@/game/engine/gameEngine';
import type { BotDifficulty } from '@/game/bots/botDifficulty';
import { HOST_SAVE_TTL_MS } from '@/constants/gameConfig';
import { isRecord } from '@/game/models/validation';
import { PLAYABLE_ROLES } from '@/game/engine/deck';

export interface HostCheckpoint {
  version: 1;
  roomCode: string;
  hostPlayerId: string;
  savedAt: number;
  state: AuthoritativeGameState;
  botDifficulty: BotDifficulty;
  discordEnabled: boolean;
  conversationSessionId: string;
  processed: [string, string[]][];
}
const phases = new Set(['LOBBY', 'DEALING', 'TURN_START', 'WAITING_ACTION', 'ACTION_DECLARED', 'WAITING_CHALLENGE_ACTION', 'WAITING_BLOCK', 'WAITING_CHALLENGE_BLOCK', 'RESOLVING_CHALLENGE', 'RESOLVING_ACTION', 'WAITING_CARD_CHOICE', 'WAITING_EXCHANGE_CHOICE', 'TURN_END']);
const card = (c: unknown) => isRecord(c) && typeof c.id === 'string' && PLAYABLE_ROLES.some(role => role === c.roleSlug);
export function validCheckpoint(value: unknown, now = Date.now()): value is HostCheckpoint {
  if (!isRecord(value) || value.version !== 1 || typeof value.roomCode !== 'string' || !/^[A-Z0-9]{4}$/.test(value.roomCode) || typeof value.hostPlayerId !== 'string' || typeof value.savedAt !== 'number' || !Number.isFinite(value.savedAt) || value.savedAt > now || now - value.savedAt >= HOST_SAVE_TTL_MS) return false;
  if (!['easy', 'intermediate', 'hard', 'pro'].includes(String(value.botDifficulty)) || typeof value.discordEnabled !== 'boolean' || typeof value.conversationSessionId !== 'string' || !Array.isArray(value.processed) || !value.processed.every(entry => Array.isArray(entry) && typeof entry[0] === 'string' && Array.isArray(entry[1]) && entry[1].every(id => typeof id === 'string'))) return false;
  const s = value.state;
  if (!isRecord(s) || !isRecord(s.publicState) || !isRecord(s.privateHands) || !isRecord(s.reconnectTokens) || !isRecord(s.privateNotices) || !(s.playersPassedResponse instanceof Set) || !Array.isArray(s.deck) || !s.deck.every(card) || !isRecord(s.settings)) return false;
  const p = s.publicState;
  if (!phases.has(String(p.phase)) || p.roomCode !== value.roomCode || !Number.isSafeInteger(p.revision) || !isRecord(p.players) || !Array.isArray(p.playerOrder) || !Array.isArray(p.responsePlayerIds) || !Array.isArray(p.discard) || !Array.isArray(p.history) || !(p.deadlineAt === null || typeof p.deadlineAt === 'number' && Number.isFinite(p.deadlineAt))) return false;
  if (!isRecord(p.players[value.hostPlayerId]) || typeof s.reconnectTokens[value.hostPlayerId] !== 'string') return false;
  const settings = s.settings;
  const players = p.players;
  const hands = s.privateHands;
  return Object.values(settings).every(n => typeof n === 'number' && Number.isFinite(n) && n >= 0) &&
    ['actionTimeoutMs', 'reactionTimeoutMs', 'challengeTimeoutMs', 'choiceTimeoutMs', 'initialCoins'].every(key => typeof settings[key] === 'number') &&
    Object.values(s.privateHands).every(hand => Array.isArray(hand) && hand.every(c => card(c) && typeof c.isLost === 'boolean')) &&
    p.playerOrder.every(id => typeof id === 'string' && isRecord(players[id]) && Array.isArray(hands[id])) &&
    Object.values(p.players).every(player => isRecord(player) && typeof player.name === 'string' && typeof player.isAlive === 'boolean' && typeof player.isConnected === 'boolean' && Number.isSafeInteger(player.coins) && Array.isArray(player.lostCards));
}

let database: Promise<IDBDatabase> | undefined;
function openDatabase(): Promise<IDBDatabase> {
  if (!database) database = new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open('bdp-host-recovery', 1);
    request.onupgradeneeded = () => request.result.createObjectStore('saves', { keyPath: 'roomCode' });
    request.onerror = () => reject(new Error('O navegador não permitiu abrir o salvamento local.'));
    request.onblocked = () => reject(new Error('Feche outras abas para atualizar o salvamento local.'));
    request.onsuccess = () => { const db = request.result; db.onversionchange = () => { db.close(); database = undefined; }; resolve(db); };
  }).catch(error => { database = undefined; throw error; });
  return database;
}
async function transaction<T>(mode: IDBTransactionMode, action: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('saves', mode);
    const request = action(tx.objectStore('saves'));
    tx.oncomplete = () => resolve(request.result);
    tx.onerror = tx.onabort = () => reject(new Error('Não foi possível salvar a partida neste navegador.'));
  });
}
// Serialize writes/deletions so a queued snapshot cannot resurrect a finished game.
let writes: Promise<void> = Promise.resolve();
export function persistCheckpoint(checkpoint: HostCheckpoint): Promise<void> {
  const copy = structuredClone(checkpoint);
  const task = writes.catch(() => undefined).then(async () => {
    if (copy.state.publicState.phase === 'FINISHED') await transaction('readwrite', store => store.delete(copy.roomCode));
    else await transaction('readwrite', store => store.put(copy));
  });
  writes = task;
  return task;
}
export function deleteCheckpoint(roomCode: string): Promise<void> {
  const task = writes.catch(() => undefined).then(async () => { await transaction('readwrite', store => store.delete(roomCode)); });
  writes = task; return task;
}
export async function listCheckpoints(): Promise<HostCheckpoint[]> {
  await writes.catch(() => undefined);
  const records = await transaction<unknown[]>('readonly', store => store.getAll());
  const valid: HostCheckpoint[] = [];
  for (const record of records) {
    if (validCheckpoint(record)) valid.push(record);
    else if (isRecord(record) && typeof record.roomCode === 'string') await deleteCheckpoint(record.roomCode);
  }
  return valid.sort((a,b) => b.savedAt - a.savedAt);
}
const FALLBACK_LOCK_TTL_MS = 6000;
const FALLBACK_LOCK_BEAT_MS = 2000;
// navigator.locks só existe em contextos seguros (HTTPS/localhost). Em HTTP, por exemplo ao testar
// pelo IP da rede local, um bloqueio por localStorage com batimento cobre o caso de duas abas.
function acquireFallbackLock(roomCode: string): () => void {
  const key = `bdp-host-lock-${roomCode}`;
  const owner = Math.random().toString(36).slice(2);
  try {
    const current = JSON.parse(localStorage.getItem(key) ?? 'null') as { owner?: string; beat?: number } | null;
    if (current?.owner && current.owner !== owner && typeof current.beat === 'number' && Date.now() - current.beat < FALLBACK_LOCK_TTL_MS) {
      throw new Error('Esta mesa já está aberta em outra aba. Volte à aba do anfitrião.');
    }
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('Esta mesa')) throw error;
  }
  const beat = (): void => {
    try { localStorage.setItem(key, JSON.stringify({ owner, beat: Date.now() })); } catch { /* sem armazenamento: segue sem bloqueio */ }
  };
  beat();
  const timer = setInterval(beat, FALLBACK_LOCK_BEAT_MS);
  return () => {
    clearInterval(timer);
    try {
      const current = JSON.parse(localStorage.getItem(key) ?? 'null') as { owner?: string } | null;
      if (current?.owner === owner) localStorage.removeItem(key);
    } catch { /* nada a liberar */ }
  };
}
export async function acquireHostLock(roomCode: string): Promise<() => void> {
  if (!navigator.locks) return acquireFallbackLock(roomCode);
  return new Promise((resolve, reject) => {
    void navigator.locks.request(`bdp-host-${roomCode}`, { ifAvailable: true }, lock => {
      if (!lock) { reject(new Error('Esta mesa já está aberta em outra aba. Volte à aba do anfitrião.')); return; }
      return new Promise<void>(release => resolve(release));
    }).catch(reject);
  });
}

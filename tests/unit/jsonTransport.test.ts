import { describe, expect, it } from 'vitest';
import { sendPeerMessage, createPeerMessageReader } from '@/online/peer/jsonTransport';
describe('Fotos no transporte JSON', () => {
  it('divide snapshots grandes e remonta fora de ordem sem perder Unicode', () => {
    const message = { type: 'ROOM_SNAPSHOT', names: 'Conceição 🃏'.repeat(3000), photos: 'A'.repeat(8 * 50000) };
    const packets: unknown[] = [];
    sendPeerMessage({ send: packet => packets.push(packet) }, message);
    expect(packets.length).toBeGreaterThan(1);
    expect(packets.every(packet => new TextEncoder().encode(JSON.stringify(packet)).length < 16300)).toBe(true);
    const read = createPeerMessageReader();
    const results = packets.reverse().map(read).filter(value => value !== undefined);
    expect(results).toEqual([message]);
  });
  it('mantém mensagens pequenas compatíveis e descarta fragmentos inválidos', () => {
    const message = { type: 'HEARTBEAT' }; const packets: unknown[] = [];
    sendPeerMessage({ send: packet => packets.push(packet) }, message);
    expect(packets).toEqual([message]);
    expect(createPeerMessageReader()({ type: 'BDP_JSON_CHUNK', total: 9999 })).toBeUndefined();
  });
});

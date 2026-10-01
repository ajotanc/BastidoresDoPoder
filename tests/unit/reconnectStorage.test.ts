import { afterEach, expect, it } from 'vitest';
import { loadPlayerSession, savePlayerSession } from '@/online/room/reconnect';

afterEach(() => sessionStorage.clear());
it('restaura uma sessão válida e usa um nome padrão para dados antigos', () => {
  savePlayerSession({ roomCode: 'ABCD', playerId: 'a', reconnectToken: 'token', playerName: 'Ana', isHost: true });
  expect(loadPlayerSession('abcd')).toMatchObject({ playerName: 'Ana', isHost: true });
  sessionStorage.setItem('bdp_session_ABCD', JSON.stringify({ roomCode: 'ABCD', playerId: 'a', reconnectToken: 'token', playerName: 123 }));
  expect(loadPlayerSession('ABCD')?.playerName).toBe('Jogador');
});
it.each([null, [], { playerId: 1, reconnectToken: 'token', roomCode: 'ABCD' },
  { playerId: 'a', reconnectToken: {}, roomCode: 'ABCD' },
  { playerId: 'a', reconnectToken: 'token', roomCode: 'EFGH' },
])('rejeita dados salvos com formato inválido: %j', value => {
  sessionStorage.setItem('bdp_session_ABCD', JSON.stringify(value));
  expect(loadPlayerSession('ABCD')).toBeNull();
});

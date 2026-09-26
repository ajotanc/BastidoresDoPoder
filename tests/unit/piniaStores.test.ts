import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useGameStore } from '@/stores/gameStore';
import { useAuthStore, type UserProfile, type LeaderboardEntry } from '@/stores/authStore';
import { useOnlineGame } from '@/composables/useOnlineGame';

describe('Pinia Stores - Bastidores do Poder', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  describe('useGameStore', () => {
    it('deve inicializar com o estado padrão idle e valores vazios', () => {
      const store = useGameStore();

      expect(store.mode).toBe('idle');
      expect(store.isHost).toBe(false);
      expect(store.myPlayerId).toBe('');
      expect(store.currentRoomCode).toBe('');
      expect(store.gameState).toBeNull();
      expect(store.privateView).toBeNull();
      expect(store.errorMessage).toBeNull();
      expect(store.isMyTurn).toBe(false);
      expect(store.meAsPublicPlayer).toBeNull();
    });

    it('deve limpar os dados e redefinir o estado ao chamar leaveRoom', () => {
      const store = useGameStore();
      store.mode = 'playing';
      store.currentRoomCode = 'SALA77';

      store.leaveRoom();

      expect(store.mode).toBe('idle');
      expect(store.currentRoomCode).toBe('');
      expect(store.gameState).toBeNull();
      expect(store.privateView).toBeNull();
      expect(store.errorMessage).toBeNull();
    });
  });

  describe('useAuthStore (Preparação para autenticação e ranking)', () => {
    it('deve gerenciar o estado do usuário autenticado', () => {
      const auth = useAuthStore();
      expect(auth.isAuthenticated).toBe(false);
      expect(auth.currentUser).toBeNull();

      const profile: UserProfile = {
        id: 'usr-123',
        name: 'Deputado Federal',
        rating: 1500,
        gamesPlayed: 10,
        victories: 4,
      };

      auth.setUser(profile);
      expect(auth.isAuthenticated).toBe(true);
      expect(auth.currentUser?.name).toBe('Deputado Federal');

      auth.setUser(null);
      expect(auth.isAuthenticated).toBe(false);
    });

    it('deve gerenciar a tabela de ranking', () => {
      const auth = useAuthStore();
      const entries: LeaderboardEntry[] = [
        {
          rank: 1,
          playerId: 'p1',
          playerName: 'O Barão',
          rating: 1850,
          victories: 15,
          gamesPlayed: 20,
        },
      ];

      auth.setLeaderboard(entries);
      expect(auth.leaderboard).toHaveLength(1);
      expect(auth.leaderboard[0].playerName).toBe('O Barão');
    });
  });

  describe('useOnlineGame via Pinia', () => {
    it('deve refletir as mutações reativas da store do Pinia através do composable', () => {
      const store = useGameStore();
      const online = useOnlineGame();

      expect(online.mode.value).toBe('idle');

      store.mode = 'lobby';
      expect(online.mode.value).toBe('lobby');

      store.currentRoomCode = 'BDP-100';
      expect(online.currentRoomCode.value).toBe('BDP-100');
    });
  });
});

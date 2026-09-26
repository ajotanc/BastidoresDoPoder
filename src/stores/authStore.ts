import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export interface UserProfile {
  id: string;
  name: string;
  email?: string;
  avatarUrl?: string;
  rating: number;
  gamesPlayed: number;
  victories: number;
}

export interface LeaderboardEntry {
  rank: number;
  playerId: string;
  playerName: string;
  rating: number;
  victories: number;
  gamesPlayed: number;
}

/**
 * Store global do Pinia para autenticação e ranking de jogadores.
 * Pronta para futura integração com Appwrite ou backend de ranking.
 */
export const useAuthStore = defineStore('auth', () => {
  const currentUser = ref<UserProfile | null>(null);
  const isLoading = ref<boolean>(false);
  const authError = ref<string | null>(null);
  const leaderboard = ref<LeaderboardEntry[]>([]);

  const isAuthenticated = computed<boolean>(() => currentUser.value !== null);

  const clearAuthError = (): void => {
    authError.value = null;
  };

  /**
   * Define o perfil do jogador autenticado
   */
  const setUser = (user: UserProfile | null): void => {
    currentUser.value = user;
  };

  /**
   * Atualiza a tabela de classificação (ranking)
   */
  const setLeaderboard = (entries: LeaderboardEntry[]): void => {
    leaderboard.value = entries;
  };

  return {
    currentUser,
    isLoading,
    authError,
    leaderboard,
    isAuthenticated,
    clearAuthError,
    setUser,
    setLeaderboard,
  };
});

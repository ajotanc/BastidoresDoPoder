/**
 * Gerenciamento de tokens de reconexão no sessionStorage para jogadores do Bastidores do Poder.
 */

const STORAGE_PREFIX = 'bdp_session_';

export interface SavedSession {
  readonly playerId: string;
  readonly reconnectToken: string;
  readonly roomCode: string;
  readonly playerName: string;
  readonly isHost?: boolean;
}

/**
 * Salva a credencial de reconexão do jogador para uma sala específica.
 */
export const savePlayerSession = (session: SavedSession): void => {
  try {
    const key = `${STORAGE_PREFIX}${session.roomCode.toUpperCase()}`;
    sessionStorage.setItem(key, JSON.stringify(session));
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.warn('Não foi possível persistir sessão no storage local:', error.message);
    }
  }
};

/**
 * Recupera uma sessão salva previamente.
 */
export const loadPlayerSession = (roomCode: string): SavedSession | null => {
  try {
    const key = `${STORAGE_PREFIX}${roomCode.toUpperCase()}`;
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed === 'object' && parsed !== null) {
      const obj = parsed as Record<string, string>;
      if (obj.playerId && obj.reconnectToken && obj.roomCode) {
        return {
          playerId: obj.playerId,
          reconnectToken: obj.reconnectToken,
          roomCode: obj.roomCode,
          playerName: obj.playerName || 'Jogador',
          isHost: (parsed as Record<string, unknown>).isHost === true,
        };
      }
    }
    return null;
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.warn('Erro ao restaurar sessão anterior:', error.message);
    }
    return null;
  }
};

/**
 * Remove os dados de sessão salvos.
 */
export const clearPlayerSession = (roomCode: string): void => {
  try {
    sessionStorage.removeItem(`${STORAGE_PREFIX}${roomCode.toUpperCase()}`);
  } catch {
    // Silencioso em caso de falha de storage
  }
};

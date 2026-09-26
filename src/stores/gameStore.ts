import { defineStore } from 'pinia';
import { ref, computed, shallowRef } from 'vue';
import type { RoleSlug } from '@/types/game';
import type { GameState, PrivatePlayerView } from '@/game/models/gameState';
import type {
  ActionIntent,
  BlockIntent,
} from '@/game/models/commands';
import { PeerHost } from '@/online/peer/peerHost';
import { PeerClient } from '@/online/peer/peerClient';
import { generateRoomCode, normalizeRoomCode } from '@/online/room/roomCode';
import { savePlayerSession, clearPlayerSession, loadPlayerSession } from '@/online/room/reconnect';

export type GameConnectionMode = 'idle' | 'creating' | 'joining' | 'lobby' | 'playing';

/**
 * Store global do Pinia para gerenciar o estado da mesa e conexão P2P online.
 */
export const useGameStore = defineStore('game', () => {
  // Estado reativo da sessão de jogo
  const mode = ref<GameConnectionMode>('idle');
  const isHost = ref<boolean>(false);
  const myPlayerId = ref<string>('');
  const myPlayerName = ref<string>('');
  const myAvatarSlug = ref<RoleSlug>('colonel');
  const currentRoomCode = ref<string>('');
  const errorMessage = ref<string | null>(null);

  const gameState = ref<GameState | null>(null);
  const privateView = ref<PrivatePlayerView | null>(null);

  const hostInstance = shallowRef<PeerHost | null>(null);
  const clientInstance = shallowRef<PeerClient | null>(null);
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  let reconnectAttempts = 0;
  const cancelReconnect = () => {
    if (reconnectTimer) clearTimeout(reconnectTimer);
    reconnectTimer = null;
  };
  const scheduleReconnect = (code: string, name: string, avatar: RoleSlug) => {
    cancelReconnect();
    if (!loadPlayerSession(code) || reconnectAttempts++ >= 20) return;
    reconnectTimer = setTimeout(() => {
      void joinRoom(code, name, avatar).catch(() => scheduleReconnect(code, name, avatar));
    }, 2000);
  };

  // Getters computados
  const isMyTurn = computed<boolean>(() => {
    return gameState.value?.activePlayerId === myPlayerId.value && gameState.value?.phase === 'WAITING_ACTION';
  });

  const meAsPublicPlayer = computed(() => {
    if (!gameState.value || !myPlayerId.value) return null;
    return gameState.value.players[myPlayerId.value] || null;
  });

  // Ações de gerenciamento de estado e conexão
  const clearError = (): void => {
    errorMessage.value = null;
  };

  /**
   * Cria uma nova sala como Host P2P
   */
  const createRoom = async (playerName: string, avatarSlug: RoleSlug = 'colonel', attempt = 0): Promise<string> => {
    try {
      clearError();
      mode.value = 'creating';

      const roomCode = generateRoomCode();
      const playerId = `player-${crypto.randomUUID()}`;
      const reconnectToken = `token-${crypto.randomUUID()}`;

      myPlayerId.value = playerId;
      myPlayerName.value = playerName;
      myAvatarSlug.value = avatarSlug;
      currentRoomCode.value = roomCode;
      isHost.value = true;

      const host = new PeerHost(roomCode, playerId, playerName, avatarSlug, reconnectToken, {
        onStateChange: (state) => {
          gameState.value = state;
          if (state.phase === 'LOBBY') {
            mode.value = 'lobby';
          } else {
            mode.value = 'playing';
          }
        },
        onPrivateViewChange: (view) => {
          privateView.value = view;
        },
        onError: (err) => {
          errorMessage.value = err;
        },
        onReady: (code) => {
          currentRoomCode.value = code;
          mode.value = 'lobby';
          savePlayerSession({
            playerId,
            reconnectToken,
            roomCode: code,
            playerName,
            isHost: true,
          });
        },
      });

      hostInstance.value = host;
      await host.init();
      return roomCode;
    } catch (err) {
      hostInstance.value?.destroy();
      hostInstance.value = null;
      if (err && typeof err === 'object' && 'type' in err && err.type === 'unavailable-id' && attempt < 4) {
        return createRoom(playerName, avatarSlug, attempt + 1);
      }
      mode.value = 'idle';
      if (err instanceof Error) {
        errorMessage.value = `Erro ao criar sala: ${err.message}`;
      } else {
        errorMessage.value = 'Falha desconhecida ao inicializar Host P2P.';
      }
      throw err;
    }
  };

  /**
   * Conecta a uma sala existente como Cliente P2P
   */
  const joinRoom = async (roomCodeInput: string, playerName: string, avatarSlug: RoleSlug = 'baron'): Promise<void> => {
    try {
      clearError();
      mode.value = 'joining';

      const roomCode = normalizeRoomCode(roomCodeInput);
      if (roomCode.length < 3) {
        throw new Error('Código de sala inválido.');
      }

      cancelReconnect();
      clientInstance.value?.destroy();
      const saved = loadPlayerSession(roomCode);
      if (saved?.isHost) throw new Error('O estado do host foi perdido. Crie uma nova sala.');
      const playerId = saved?.playerId ?? `player-${crypto.randomUUID()}`;
      const reconnectToken = saved?.reconnectToken ?? `token-${crypto.randomUUID()}`;

      myPlayerId.value = playerId;
      myPlayerName.value = playerName;
      myAvatarSlug.value = avatarSlug;
      currentRoomCode.value = roomCode;
      isHost.value = false;

      const client = new PeerClient(roomCode, playerId, {
        onStateChange: (state) => {
          reconnectAttempts = 0;
          clearError();
          savePlayerSession({ playerId, reconnectToken, roomCode, playerName });
          gameState.value = state;
          if (state.phase === 'LOBBY') {
            mode.value = 'lobby';
          } else {
            mode.value = 'playing';
          }
        },
        onPrivateViewChange: (view) => {
          privateView.value = view;
        },
        onError: (err) => {
          errorMessage.value = err;
          if (err.startsWith('UNAUTHORIZED') || mode.value === 'joining') {
            cancelReconnect();
            if (err.startsWith('UNAUTHORIZED')) clearPlayerSession(roomCode);
            client.destroy();
            mode.value = 'idle';
          }
        },
        onConnected: () => {
          client.sendCommand(saved ? {
            type: 'RECONNECT', payload: { playerId, reconnectToken },
          } : {
            type: 'JOIN_ROOM',
            payload: {
              name: playerName,
              avatarSlug,
              reconnectToken,
            },
          });
        },
        onDisconnected: () => {
          errorMessage.value = 'Conexão interrompida. Tentando reconectar à sala…';
          scheduleReconnect(roomCode, playerName, avatarSlug);
        },
      });

      clientInstance.value = client;
      await client.connect();
    } catch (err) {
      mode.value = 'idle';
      if (err instanceof Error) {
        errorMessage.value = `Falha ao entrar na sala: ${err.message}`;
      } else {
        errorMessage.value = 'Não foi possível conectar ao Host.';
      }
      throw err;
    }
  };

  const setReady = (ready: boolean): void => {
    if (isHost.value && hostInstance.value) {
      hostInstance.value.executeLocalHostCommand({
        type: 'SET_READY',
        payload: { ready },
      });
    } else if (clientInstance.value) {
      clientInstance.value.sendCommand({
        type: 'SET_READY',
        payload: { ready },
      });
    }
  };

  const startGame = (): void => {
    if (!isHost.value || !hostInstance.value) return;
    hostInstance.value.executeLocalHostCommand({
      type: 'START_GAME',
      payload: {},
    });
  };

  const declareAction = (intent: ActionIntent): void => {
    const cmd = { type: 'DECLARE_ACTION' as const, payload: intent };
    if (isHost.value && hostInstance.value) {
      hostInstance.value.executeLocalHostCommand(cmd);
    } else if (clientInstance.value) {
      clientInstance.value.sendCommand(cmd);
    }
  };

  const declareBlock = (blockIntent: BlockIntent): void => {
    const cmd = { type: 'DECLARE_BLOCK' as const, payload: blockIntent };
    if (isHost.value && hostInstance.value) {
      hostInstance.value.executeLocalHostCommand(cmd);
    } else if (clientInstance.value) {
      clientInstance.value.sendCommand(cmd);
    }
  };

  const declareChallenge = (isChallengeOnBlock = false): void => {
    const cmd = {
      type: 'DECLARE_CHALLENGE' as const,
      payload: { isChallengeOnBlock },
    };
    if (isHost.value && hostInstance.value) {
      hostInstance.value.executeLocalHostCommand(cmd);
    } else if (clientInstance.value) {
      clientInstance.value.sendCommand(cmd);
    }
  };

  const passResponse = (): void => {
    const cmd = { type: 'PASS_RESPONSE' as const, payload: { pass: true as const } };
    if (isHost.value && hostInstance.value) {
      hostInstance.value.executeLocalHostCommand(cmd);
    } else if (clientInstance.value) {
      clientInstance.value.sendCommand(cmd);
    }
  };

  const chooseCard = (cardId: string): void => {
    const cmd = { type: 'CHOOSE_CARD' as const, payload: { cardId } };
    if (isHost.value && hostInstance.value) {
      hostInstance.value.executeLocalHostCommand(cmd);
    } else if (clientInstance.value) {
      clientInstance.value.sendCommand(cmd);
    }
  };

  const chooseExchange = (returnedCardIds: readonly [string, string]): void => {
    const cmd = { type: 'CHOOSE_EXCHANGE' as const, payload: { returnedCardIds } };
    if (isHost.value && hostInstance.value) {
      hostInstance.value.executeLocalHostCommand(cmd);
    } else if (clientInstance.value) {
      clientInstance.value.sendCommand(cmd);
    }
  };

  const leaveRoom = (): void => {
    cancelReconnect();
    reconnectAttempts = 0;
    if (hostInstance.value) {
      hostInstance.value.destroy();
      hostInstance.value = null;
    }
    if (clientInstance.value) {
      clientInstance.value.destroy();
      clientInstance.value = null;
    }
    clearPlayerSession(currentRoomCode.value);
    mode.value = 'idle';
    gameState.value = null;
    privateView.value = null;
    currentRoomCode.value = '';
    clearError();
  };

  return {
    mode,
    isHost,
    myPlayerId,
    myPlayerName,
    myAvatarSlug,
    currentRoomCode,
    errorMessage,
    gameState,
    privateView,
    isMyTurn,
    meAsPublicPlayer,
    createRoom,
    joinRoom,
    setReady,
    startGame,
    declareAction,
    declareBlock,
    declareChallenge,
    passResponse,
    chooseCard,
    chooseExchange,
    leaveRoom,
    clearError,
  };
});

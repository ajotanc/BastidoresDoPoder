import { listCheckpoints, persistCheckpoint, deleteCheckpoint, acquireHostLock, type HostCheckpoint } from '@/online/room/hostRecovery';
import { connectDiscordAccount } from '@/online/room/discordConversation';
import type { RoomTimingInput } from '@/game/models/roomSettings';
import { DEFAULT_BOT_DIFFICULTY, type BotDifficulty } from '@/game/bots/botDifficulty';
import { MAX_RECONNECT_ATTEMPTS, RECONNECT_RETRY_MS } from '@/constants/gameConfig';
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
import { validateBotCount } from '@/game/bots/createBots';

export type GameConnectionMode = 'idle' | 'creating' | 'joining' | 'lobby' | 'playing';

/**
 * Store global do Pinia para gerenciar o estado da mesa e conexão P2P online.
 */
export const useGameStore = defineStore('game', () => {
  // Estado reativo da sessão de jogo
  const mode = ref<GameConnectionMode>('idle');
  const recoveryWarning = ref('');
  const savedGames = ref<HostCheckpoint[]>([]);
  let releaseHostLock: (() => void) | null = null;
  const refreshSavedGames = async () => {
    try { savedGames.value = await listCheckpoints(); }
    catch { recoveryWarning.value = 'O navegador não permitiu acessar o salvamento local. A recuperação pode não estar disponível.'; }
  };
  const discardSavedGame = async (code: string) => {
    try {
      const release = await acquireHostLock(code);
      try { await deleteCheckpoint(code); } finally { release(); }
      await refreshSavedGames();
    } catch (error) { recoveryWarning.value = error instanceof Error ? error.message : 'Não foi possível excluir o salvamento.'; }
  };
  const checkpointChanged = (checkpoint: HostCheckpoint) => {
    void persistCheckpoint(checkpoint).then(() => { recoveryWarning.value = ''; }).catch(() => { recoveryWarning.value = 'Não foi possível salvar a última mudança. Mantenha esta aba aberta para não perder a partida.'; });
  };
  const isHost = ref<boolean>(false);
  const myPlayerId = ref<string>('');
  const myPlayerName = ref<string>('');
  const myAvatarSlug = ref<RoleSlug | undefined>('colonel');
  const currentRoomCode = ref<string>('');
  const errorMessage = ref<string | null>(null);

  const gameState = ref<GameState | null>(null);
  const privateView = ref<PrivatePlayerView | null>(null);

  const hostInstance = shallowRef<PeerHost | null>(null);
  const clientInstance = shallowRef<PeerClient | null>(null);
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  const reconnectAttempt = ref(0);
  const connectionStatus = ref<'connected' | 'reconnecting' | 'disconnected'>('connected');
  let reconnectAttempts = 0;
  let connectionGeneration = 0;
  const cancelReconnect = () => {
    if (reconnectTimer) clearTimeout(reconnectTimer);
    reconnectTimer = null;
  };
  const scheduleReconnect = (code: string, name: string, avatar: RoleSlug | undefined) => {
    cancelReconnect();
    if (!loadPlayerSession(code) || reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      connectionStatus.value = 'disconnected';
      errorMessage.value = 'Não foi possível recuperar a conexão. O anfitrião pode ter saído da mesa.';
      return;
    }
    connectionStatus.value = 'reconnecting';
    reconnectAttempt.value = ++reconnectAttempts;
    reconnectTimer = setTimeout(() => {
      void joinRoom(code, name, avatar, undefined, true).catch(() => { if (currentRoomCode.value === code && !isHost.value) scheduleReconnect(code, name, avatar); });
    }, RECONNECT_RETRY_MS);
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
  const createRoom = async (playerName: string, avatarSlug?: RoleSlug, avatarImage?: string, botCount = 0, botDifficulty: BotDifficulty = DEFAULT_BOT_DIFFICULTY, timing: RoomTimingInput = {}, discordEnabled = false, attempt = 0, checkpoint?: HostCheckpoint): Promise<string> => {
    try {
      validateBotCount(botCount);
      clearError();
      connectionGeneration++;
      mode.value = 'creating';
      connectionStatus.value = 'connected';

      const roomCode = checkpoint?.roomCode ?? generateRoomCode();
      const playerId = checkpoint?.hostPlayerId ?? `player-${crypto.randomUUID()}`;
      const reconnectToken = checkpoint?.state.reconnectTokens[playerId] ?? `token-${crypto.randomUUID()}`;
      releaseHostLock = await acquireHostLock(roomCode);

      myPlayerId.value = playerId;
      myPlayerName.value = playerName;
      myAvatarSlug.value = avatarImage ? undefined : (avatarSlug ?? 'colonel');
      currentRoomCode.value = roomCode;
      isHost.value = true;

      const host = new PeerHost(roomCode, playerId, playerName, avatarSlug, reconnectToken, {
        onCheckpoint: checkpointChanged,
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
      }, avatarImage, botCount, botDifficulty, timing, discordEnabled, checkpoint);

      hostInstance.value = host;
      await host.init();
      if (discordEnabled && !checkpoint) void host.prepareConversation();
      return roomCode;
    } catch (err) {
      hostInstance.value?.destroy();
      hostInstance.value = null;
      releaseHostLock?.(); releaseHostLock = null;
      if (!checkpoint && err && typeof err === 'object' && 'type' in err && err.type === 'unavailable-id' && attempt < 4) {
        return createRoom(playerName, avatarSlug, avatarImage, botCount, botDifficulty, timing, discordEnabled, attempt + 1);
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

  const resumeSavedGame = async (code: string): Promise<void> => {
    try {
      const checkpoint = (await listCheckpoints()).find(save => save.roomCode === code);
      if (!checkpoint) throw new Error('O salvamento expirou ou não é compatível com esta versão.');
      const player = checkpoint.state.publicState.players[checkpoint.hostPlayerId]!;
      await createRoom(player.name, player.avatarSlug, player.avatarImage, 0, checkpoint.botDifficulty, {}, checkpoint.discordEnabled, 0, checkpoint);
      savedGames.value = savedGames.value.filter(save => save.roomCode !== code);
    } catch (error) { errorMessage.value = error instanceof Error ? error.message : 'Não foi possível retomar. Aguarde alguns segundos e tente novamente.'; }
  };

  /**
   * Conecta a uma sala existente como Cliente P2P
   */
  const joinRoom = async (roomCodeInput: string, playerName: string, avatarSlug?: RoleSlug, avatarImage?: string, reconnecting = false): Promise<void> => {
    const generation = ++connectionGeneration;
    try {
      clearError();
      if (!reconnecting) {
        mode.value = 'joining';
        reconnectAttempts = 0;
        reconnectAttempt.value = 0;
        connectionStatus.value = 'connected';
      }

      const roomCode = normalizeRoomCode(roomCodeInput);
      if (roomCode.length < 3) {
        throw new Error('Código de sala inválido.');
      }

      cancelReconnect();
      clientInstance.value?.destroy();
      const saved = loadPlayerSession(roomCode);
      if (saved?.isHost) throw new Error('Use Retomar partida para recuperar sua mesa salva neste navegador.');
      const playerId = saved?.playerId ?? `player-${crypto.randomUUID()}`;
      const reconnectToken = saved?.reconnectToken ?? `token-${crypto.randomUUID()}`;

      myPlayerId.value = playerId;
      myPlayerName.value = playerName;
      myAvatarSlug.value = avatarImage ? undefined : (avatarSlug ?? 'colonel');
      currentRoomCode.value = roomCode;
      isHost.value = false;

      const client = new PeerClient(roomCode, playerId, {
        onStateChange: (state) => {
          if (generation !== connectionGeneration) return;
          reconnectAttempts = 0;
          reconnectAttempt.value = 0;
          connectionStatus.value = 'connected';
          cancelReconnect();
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
          if (generation !== connectionGeneration) return;
          privateView.value = view;
        },
        onError: (err) => {
          if (generation !== connectionGeneration) return;
          errorMessage.value = err;
          if (err.startsWith('UNAUTHORIZED') || mode.value === 'joining') {
            cancelReconnect();
            if (err.startsWith('UNAUTHORIZED')) clearPlayerSession(roomCode);
            client.destroy();
            if (!reconnecting) mode.value = 'idle';
            else connectionStatus.value = 'disconnected';
          }
        },
        onConnected: () => {
          if (generation !== connectionGeneration) return;
          client.sendCommand(saved ? {
            type: 'RECONNECT', payload: { playerId, reconnectToken },
          } : {
            type: 'JOIN_ROOM',
            payload: {
              name: playerName,
              ...(avatarImage ? {} : { avatarSlug: avatarSlug ?? 'colonel' }),
              ...(avatarImage ? { avatarImage } : {}),
              reconnectToken,
            },
          });
        },
        onDisconnected: () => {
          if (generation !== connectionGeneration) return;
          if (gameState.value?.phase === 'FINISHED') return;
          errorMessage.value = 'Conexão interrompida. Tentando reconectar à sala…';
          scheduleReconnect(roomCode, playerName, avatarSlug);
        },
      });

      clientInstance.value = client;
      await client.connect();
    } catch (err) {
      if (generation !== connectionGeneration) return;
      if (!reconnecting) mode.value = 'idle';
      if (err instanceof Error) {
        errorMessage.value = `Falha ao entrar na sala: ${err.message}`;
      } else {
        errorMessage.value = 'Não foi possível conectar ao Host.';
      }
      throw err;
    }
  };

  const retryConnection = (): void => {
    if (isHost.value || !currentRoomCode.value || connectionStatus.value !== 'disconnected') return;
    reconnectAttempts = 0;
    scheduleReconnect(currentRoomCode.value, myPlayerName.value, myAvatarSlug.value);
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
    connectionGeneration++;
    cancelReconnect();
    reconnectAttempts = 0;
    reconnectAttempt.value = 0;
    connectionStatus.value = 'connected';
    if (hostInstance.value) {
      hostInstance.value.leaveRoom();
      hostInstance.value = null;
      releaseHostLock?.(); releaseHostLock = null;
    }
    if (clientInstance.value) {
      clientInstance.value.leaveRoom();
      clientInstance.value = null;
    }
    clearPlayerSession(currentRoomCode.value);
    mode.value = 'idle';
    gameState.value = null;
    privateView.value = null;
    currentRoomCode.value = '';
    clearError();
    void refreshSavedGames();
  };

  const startRematch = (): void => { if (isHost.value) hostInstance.value?.startRematch(); };

  const retryConversation = async (): Promise<void> => {
    const host = hostInstance.value;
    if (!isHost.value || !host) return;
    try {
      if (gameState.value?.discordConversation?.status === 'auth-required') await connectDiscordAccount();
      if (hostInstance.value === host) await host.prepareConversation();
    } catch (error) { errorMessage.value = error instanceof Error ? error.message : 'Não foi possível conectar ao Discord.'; }
  };

  return {
    recoveryWarning, savedGames, refreshSavedGames, discardSavedGame, resumeSavedGame,
    connectionStatus,
    reconnectAttempt,
    retryConnection,
    retryConversation,
    startRematch,
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

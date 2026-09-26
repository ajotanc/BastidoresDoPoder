import { storeToRefs } from 'pinia';
import { useGameStore, type GameConnectionMode } from '@/stores/gameStore';

export type { GameConnectionMode };

/**
 * Composable que conecta diretamente à store do Pinia useGameStore.
 * Mantém total compatibilidade e reatividade com a desestruturação nos componentes.
 */
export const useOnlineGame = () => {
  const store = useGameStore();
  const refs = storeToRefs(store);

  return {
    // Estado reativo do Pinia via storeToRefs
    mode: refs.mode,
    isHost: refs.isHost,
    myPlayerId: refs.myPlayerId,
    myPlayerName: refs.myPlayerName,
    myAvatarSlug: refs.myAvatarSlug,
    currentRoomCode: refs.currentRoomCode,
    errorMessage: refs.errorMessage,
    gameState: refs.gameState,
    privateView: refs.privateView,
    isMyTurn: refs.isMyTurn,
    meAsPublicPlayer: refs.meAsPublicPlayer,

    // Ações da store do Pinia
    createRoom: store.createRoom,
    joinRoom: store.joinRoom,
    setReady: store.setReady,
    startGame: store.startGame,
    declareAction: store.declareAction,
    declareBlock: store.declareBlock,
    declareChallenge: store.declareChallenge,
    passResponse: store.passResponse,
    chooseCard: store.chooseCard,
    chooseExchange: store.chooseExchange,
    leaveRoom: store.leaveRoom,
    clearError: store.clearError,
  };
};

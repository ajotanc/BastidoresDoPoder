<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import type { RoleSlug } from '@/types/game';
import { useOnlineGame } from '@/composables/useOnlineGame';
import { PLAYABLE_ROLES } from '@/game/engine/deck';
import { getRoleDisplayName } from '@/game/engine/gameEngine';
import { AlertCircle, PlusCircle, LogIn, ArrowLeft, Users } from 'lucide-vue-next';
import LobbyRoom from './LobbyRoom.vue';
import GameBoard from './GameBoard.vue';

interface Props {
  initialRoomId?: string;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'back-to-manual'): void;
  (e: 'room-entered', roomCode: string): void;
  (e: 'room-left'): void;
}>();

const {
  mode,
  isHost,
  myPlayerId,
  currentRoomCode,
  errorMessage,
  gameState,
  privateView,
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
} = useOnlineGame();

const inputName = ref('');
const inputRoomCode = ref('');
const selectedAvatar = ref<RoleSlug>('colonel');
const activeTab = ref<'create' | 'join'>('create');
const isSubmitting = ref(false);

watch(
  () => props.initialRoomId,
  (code) => {
    if (code) {
      inputRoomCode.value = code.toUpperCase();
      activeTab.value = 'join';
    }
  },
  { immediate: true }
);

watch(currentRoomCode, (newCode) => {
  if (newCode) {
    emit('room-entered', newCode);
  } else {
    emit('room-left');
  }
});

onMounted(() => {
  if (props.initialRoomId) {
    inputRoomCode.value = props.initialRoomId.toUpperCase();
    activeTab.value = 'join';
    return;
  }

  // Lê código da URL se vier como #jogar/XXXX ou #online/XXXX
  const hash = window.location.hash;
  if (hash.includes('jogar/') || hash.includes('online/')) {
    const parts = hash.split('/');
    const code = parts[1];
    if (code) {
      inputRoomCode.value = code.toUpperCase();
      activeTab.value = 'join';
    }
  }
});

const handleLeave = (): void => {
  leaveRoom();
  emit('room-left');
};

const handleCreate = async (): Promise<void> => {
  if (!inputName.value.trim()) return;
  try {
    isSubmitting.value = true;
    await createRoom(inputName.value.trim(), selectedAvatar.value);
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.warn('Falha na criação da sala:', err.message);
    }
  } finally {
    isSubmitting.value = false;
  }
};

const handleJoin = async (): Promise<void> => {
  if (!inputName.value.trim() || !inputRoomCode.value.trim()) return;
  try {
    isSubmitting.value = true;
    await joinRoom(inputRoomCode.value.trim(), inputName.value.trim(), selectedAvatar.value);
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.warn('Falha ao ingressar na sala:', err.message);
    }
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<template>
  <div class="w-full space-y-8">
    <!-- Notificação de Erro Flutuante -->
    <div
      v-if="errorMessage"
      class="p-4 bg-status-red-bg border border-status-red/50 rounded-xl text-status-red flex items-center justify-between gap-3 shadow-lg animate-fadeIn"
      role="alert"
    >
      <div class="flex items-center gap-2 text-xs font-medium">
        <AlertCircle class="w-4 h-4 text-status-red shrink-0" aria-hidden="true" />
        <span>{{ errorMessage }}</span>
      </div>
      <button
        type="button"
        @click="clearError"
        class="text-xs font-bold text-status-red hover:underline"
      >
        Dispensar
      </button>
    </div>

    <!-- TELA 1: ENTRADA / CRIAÇÃO DE SALA (Modo IDLE) -->
    <div v-if="mode === 'idle' || mode === 'creating' || mode === 'joining'" class="max-w-2xl mx-auto space-y-8 animate-fadeIn">
      <!-- Cabeçalho do Modo Online -->
      <div class="text-center space-y-3">
        <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gold/15 text-gold-light border border-gold/30">
          Experiência Multiplayer Peer-to-Peer
        </span>
        <h1 class="font-serif text-3xl sm:text-4xl font-black text-ink tracking-tight">
          Bastidores do Poder Online
        </h1>
        <p class="text-xs sm:text-sm text-ink-muted max-w-md mx-auto">
          Crie ou ingresse em uma sala com conexões diretas via PeerJS, sem necessidade de cadastro ou servidores centrais.
        </p>
      </div>

      <!-- Card com Abas de Criar ou Entrar -->
      <div class="bg-surface border border-line-gold/40 rounded-2xl p-6 sm:p-8 shadow-card space-y-6">
        <!-- Banner de Convite Direto para Mesa (quando acessado via /game/:id) -->
        <div
          v-if="props.initialRoomId && activeTab === 'join'"
          class="p-4 bg-gold/10 border border-gold/40 rounded-xl flex items-center gap-3 text-xs text-ink animate-fadeIn"
        >
          <div class="w-9 h-9 rounded-lg bg-gold/20 border border-gold/40 flex items-center justify-center shrink-0">
            <Users class="w-4 h-4 text-gold-light" aria-hidden="true" />
          </div>
          <div class="min-w-0">
            <p class="font-serif font-bold text-gold-light">
              Convite Direto para a Mesa {{ props.initialRoomId }}
            </p>
            <p class="text-[11px] text-ink-muted">
              Você acessou diretamente o link da partida. Escolha seu codinome e personagem para ingressar na disputa.
            </p>
          </div>
        </div>

        <!-- Abas -->
        <div class="grid grid-cols-2 p-1 bg-paper-deep rounded-xl border border-line">
          <button
            type="button"
            @click="activeTab = 'create'"
            class="py-2.5 rounded-lg text-xs font-serif font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5"
            :class="[
              activeTab === 'create'
                ? 'bg-surface-elevated text-gold shadow-sm'
                : 'text-ink-muted hover:text-ink'
            ]"
          >
            <PlusCircle class="w-3.5 h-3.5" aria-hidden="true" />
            <span>Criar Sala (Host)</span>
          </button>
          <button
            type="button"
            @click="activeTab = 'join'"
            class="py-2.5 rounded-lg text-xs font-serif font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5"
            :class="[
              activeTab === 'join'
                ? 'bg-surface-elevated text-gold shadow-sm'
                : 'text-ink-muted hover:text-ink'
            ]"
          >
            <LogIn class="w-3.5 h-3.5" aria-hidden="true" />
            <span>Entrar com Código</span>
          </button>
        </div>

        <!-- Formulário -->
        <div class="space-y-5">
          <!-- Nome do Jogador -->
          <div class="space-y-1.5">
            <label for="player-name" class="block text-xs font-serif font-bold text-ink uppercase tracking-wider">
              Seu Codinome Político
            </label>
            <input
              id="player-name"
              v-model="inputName"
              type="text"
              maxlength="18"
              placeholder="Ex: Senador Santos, Deputada Clara..."
              class="w-full px-4 py-3 rounded-xl bg-paper-deep border border-line focus:border-gold focus:outline-none text-ink text-sm transition-colors"
            />
          </div>

          <!-- Código da Sala (apenas na aba Entrar) -->
          <div v-if="activeTab === 'join'" class="space-y-1.5">
            <label for="room-code" class="block text-xs font-serif font-bold text-ink uppercase tracking-wider">
              Código da Sala (4 letras)
            </label>
            <input
              id="room-code"
              v-model="inputRoomCode"
              type="text"
              maxlength="6"
              placeholder="Ex: 7K3F"
              class="w-full px-4 py-3 rounded-xl bg-paper-deep border border-line focus:border-gold focus:outline-none text-gold font-serif font-bold text-base tracking-widest uppercase transition-colors"
            />
          </div>

          <!-- Escolha de Avatar -->
          <div class="space-y-2">
            <label class="block text-xs font-serif font-bold text-ink uppercase tracking-wider">
              Escolha seu Perfil Político
            </label>
            <div class="grid grid-cols-4 sm:grid-cols-8 gap-2">
              <button
                v-for="role in PLAYABLE_ROLES"
                :key="role"
                type="button"
                @click="selectedAvatar = role"
                class="aspect-square rounded-xl border p-1 transition-all overflow-hidden flex flex-col items-center justify-center relative group"
                :class="[
                  selectedAvatar === role
                    ? 'border-gold bg-gold/20 shadow-md ring-2 ring-gold/40'
                    : 'border-line bg-paper-deep hover:border-gold/30'
                ]"
                :title="getRoleDisplayName(role)"
              >
                <img
                  :src="`/images/characters/${role}.webp`"
                  :alt="getRoleDisplayName(role)"
                  class="w-full h-full object-cover rounded-lg group-hover:scale-105 transition-transform"
                  loading="lazy"
                  onerror="this.src='/images/icons/guide.webp'"
                />
              </button>
            </div>
            <p class="text-[11px] text-ink-muted text-center pt-1">
              Perfil selecionado: <strong class="text-gold-light">{{ getRoleDisplayName(selectedAvatar) }}</strong>
            </p>
          </div>

          <!-- Botão Principal de Submissão -->
          <button
            v-if="activeTab === 'create'"
            type="button"
            :disabled="!inputName.trim() || isSubmitting"
            @click="handleCreate"
            class="w-full py-4 rounded-xl font-serif font-bold text-xs uppercase tracking-wider transition-all shadow-lg flex items-center justify-center gap-2"
            :class="[
              inputName.trim() && !isSubmitting
                ? 'bg-gold hover:bg-gold-light text-paper-deep hover:shadow-gold/20 active:scale-95'
                : 'bg-surface-elevated text-ink-subtle cursor-not-allowed border border-line'
            ]"
          >
            <span>{{ isSubmitting ? 'Estabelecendo Gabinete...' : 'Criar Nova Partida Online' }}</span>
            <PlusCircle v-if="!isSubmitting" class="w-4 h-4" aria-hidden="true" />
          </button>

          <button
            v-else
            type="button"
            :disabled="!inputName.trim() || !inputRoomCode.trim() || isSubmitting"
            @click="handleJoin"
            class="w-full py-4 rounded-xl font-serif font-bold text-xs uppercase tracking-wider transition-all shadow-lg flex items-center justify-center gap-2"
            :class="[
              inputName.trim() && inputRoomCode.trim() && !isSubmitting
                ? 'bg-gold hover:bg-gold-light text-paper-deep hover:shadow-gold/20 active:scale-95'
                : 'bg-surface-elevated text-ink-subtle cursor-not-allowed border border-line'
            ]"
          >
            <span>{{ isSubmitting ? 'Conectando ao Host...' : 'Entrar na Sala P2P' }}</span>
            <LogIn v-if="!isSubmitting" class="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      <!-- Botão Voltar ao Manual -->
      <div class="text-center">
        <button
          type="button"
          @click="emit('back-to-manual')"
          class="text-xs font-semibold text-ink-muted hover:text-gold transition-colors inline-flex items-center gap-1.5"
        >
          <ArrowLeft class="w-3.5 h-3.5" aria-hidden="true" />
          <span>Voltar para o Manual de Regras</span>
        </button>
      </div>
    </div>

    <!-- TELA 2: LOBBY DA SALA -->
    <LobbyRoom
      v-else-if="mode === 'lobby' && gameState"
      :room-code="currentRoomCode"
      :game-state="gameState"
      :my-player-id="myPlayerId"
      :is-host="isHost"
      @set-ready="setReady"
      @start-game="startGame"
      @leave="handleLeave"
    />

    <!-- TELA 3: MESA DE JOGO ATIVA -->
    <GameBoard
      v-else-if="mode === 'playing' && gameState"
      :game-state="gameState"
      :private-view="privateView"
      :my-player-id="myPlayerId"
      :is-host="isHost"
      @declare-action="declareAction"
      @declare-block="declareBlock"
      @declare-challenge="declareChallenge"
      @pass-response="passResponse"
      @choose-card="chooseCard"
      @choose-exchange="chooseExchange"
      @leave="handleLeave"
    />
  </div>
</template>

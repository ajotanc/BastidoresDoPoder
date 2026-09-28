<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import type { RoleSlug } from '@/types/game';
import { useOnlineGame } from '@/composables/useOnlineGame';
import { PLAYABLE_ROLES } from '@/game/engine/deck';
import { getRoleDisplayName } from '@/game/engine/gameEngine';
import { AlertCircle, PlusCircle, LogIn, ArrowLeft, ArrowRight, Users } from 'lucide-vue-next';
import LobbyRoom from './LobbyRoom.vue';
import GameBoard from './GameBoard.vue';
import AppSectionHeader from '@/components/ui/AppSectionHeader.vue';

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
  <div class="online-ui w-full min-w-0 space-y-6">
    <!-- Notificação de Erro Flutuante -->
    <div
      v-if="errorMessage"
      class="p-4 bg-status-red-bg border border-status-red/50 rounded text-status-red flex items-center justify-between gap-3 shadow-lg animate-fadeIn"
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

    <div v-if="mode === 'idle' || mode === 'creating' || mode === 'joining'" class="online-entry pt-12 mx-auto max-w-xl space-y-6 sm:space-y-8">
      <AppSectionHeader
        label="O poder está à mesa"
        title="Seu gabinete. Suas alianças."
        description="Reúna seus amigos, guarde seus segredos e dispute o poder."
      />
      <div class="rounded border border-line-gold/60 bg-surface p-4 shadow-card sm:p-7">
        <div v-if="props.initialRoomId && activeTab === 'join'" class="mb-5 flex items-center gap-3 rounded border border-gold/30 bg-gold/10 p-3 text-sm">
          <Users class="h-5 w-5 shrink-0 text-gold" aria-hidden="true" /><span>Você foi convidado para a mesa <strong class="text-gold">{{ inputRoomCode }}</strong>.</span>
        </div>
        <div class="grid grid-cols-2 gap-1 rounded border border-line bg-paper-deep p-1" role="group" aria-label="Criar ou entrar em uma sala">
          <button type="button" @click="activeTab = 'create'" :aria-pressed="activeTab === 'create'" :disabled="isSubmitting" class="entry-tab" :class="activeTab === 'create' ? 'bg-surface-elevated text-gold-light shadow-sm' : 'text-ink-muted'"><PlusCircle class="h-4 w-4 shrink-0" aria-hidden="true" />Criar sala</button>
          <button type="button" aria-label="Entrar na sala" @click="activeTab = 'join'" :aria-pressed="activeTab === 'join'" :disabled="isSubmitting" class="entry-tab" :class="activeTab === 'join' ? 'bg-surface-elevated text-gold-light shadow-sm' : 'text-ink-muted'"><LogIn class="h-4 w-4 shrink-0" aria-hidden="true" />Entrar</button>
        </div>
        <form class="mt-6 space-y-5" @submit.prevent="activeTab === 'create' ? handleCreate() : handleJoin()" :aria-busy="isSubmitting">
          <div class="space-y-2">
            <label for="player-name" class="font-serif text-sm font-bold text-ink">Seu Codinome Político</label>
            <input id="player-name" v-model="inputName" type="text" maxlength="18" autocomplete="nickname" placeholder="Como vão chamar você?" required :disabled="isSubmitting" class="online-input" />
          </div>
          <div v-if="activeTab === 'join'" class="space-y-2">
            <label for="room-code" class="font-serif text-sm font-bold text-ink">Código da sala</label>
            <input id="room-code" v-model="inputRoomCode" type="text" maxlength="6" placeholder="Ex: 7K3F" required autocomplete="off" autocapitalize="characters" :spellcheck="false" :disabled="isSubmitting" class="online-input uppercase tracking-[.2em] text-gold" />
          </div>
          <fieldset :disabled="isSubmitting" class="space-y-3">
            <legend class="font-serif text-sm font-bold text-ink">Escolha seu perfil</legend>
            <div class="grid grid-cols-4 gap-3">
              <button v-for="role in PLAYABLE_ROLES" :key="role" type="button" @click="selectedAvatar = role" :aria-label="getRoleDisplayName(role)" :aria-pressed="selectedAvatar === role" class="profile-option relative aspect-square min-h-11 overflow-hidden rounded border-2 p-0.5 transition-colors" :class="selectedAvatar === role ? 'border-gold bg-gold/20 ring-2 ring-gold/30 ring-offset-2 ring-offset-surface' : 'border-line bg-paper-deep hover:border-gold/50'">
                <img :src="'/images/characters/'+role+'.webp'" alt="" class="h-full w-full rounded object-cover" />
              </button>
            </div>
            <p class="text-center text-xs text-ink-muted" aria-live="polite">Seu perfil: <strong class="text-gold-light">{{ getRoleDisplayName(selectedAvatar) }}</strong></p>
          </fieldset>
          <button type="submit" :disabled="!inputName.trim() || (activeTab === 'join' && !inputRoomCode.trim()) || isSubmitting" class="online-primary w-full" :aria-label="activeTab === 'create' ? 'Criar Nova Partida Online' : 'Entrar na Sala P2P'">
            <span>{{ isSubmitting ? 'Conectando…' : activeTab === 'create' ? 'Criar minha sala' : 'Entrar na sala' }}</span><ArrowRight v-if="!isSubmitting" class="h-4 w-4" aria-hidden="true" />
          </button>
          <p class="text-center text-xs text-ink-subtle">{{ activeTab === 'create' ? 'Depois, compartilhe o convite com seus amigos.' : 'Use o código ou o link que recebeu de quem criou a sala.' }}</p>
        </form>
      </div>
      <div class="text-center"><button type="button" @click="emit('back-to-manual')" class="inline-flex min-h-11 items-center gap-2 text-sm text-ink-muted hover:text-gold"><ArrowLeft class="h-4 w-4" aria-hidden="true" />Consultar regras</button></div>
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

<script setup lang="ts">
import { randName } from 'randino';
import { loadProfile, saveProfile, prepareAvatar } from "@/utils/playerProfile";
import { ref, computed, watch, onMounted } from 'vue';
import { Checkbox } from '@/components/ui/checkbox';
import { DEFAULT_BOT_COUNT, MAX_BOTS_PER_ROOM } from '@/constants/gameConfig';
import type { RoleSlug } from '@/types/game';
import { useOnlineGame } from '@/composables/useOnlineGame';
import { PLAYABLE_ROLES } from '@/game/engine/deck';
import { getRoleDisplayName } from '@/game/engine/gameEngine';
import { AlertCircle, PlusCircle, LogIn, ArrowLeft, ArrowRight, Camera, Upload, Shuffle, Trash2 } from 'lucide-vue-next';
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

const storedProfile = loadProfile();
const inputName = ref(storedProfile.name);
const generatePlayerName = (): void => {
  const names = randName({ language: 'en', includeSurname: true, includeMiddleName: false, count: 2, unique: true });
  inputName.value = names.find(name => name !== inputName.value) ?? names[0] ?? '';
};
const avatarImage = ref(storedProfile.avatarImage);
const profileError = ref('');
const isPreparingPhoto = ref(false);
const photoInput = ref<(HTMLElement & { click(): void }) | null>(null);
const inputRoomCode = ref('');
const selectedAvatar = ref<RoleSlug>(storedProfile.avatarSlug);
watch([inputName, selectedAvatar, avatarImage], () => {
  if (!saveProfile({ name: inputName.value, avatarSlug: selectedAvatar.value, avatarImage: avatarImage.value })) profileError.value = 'Seu navegador não permitiu salvar o perfil. Você ainda pode jogar.';
});
const uploadPhoto = async (event: Event) => {
  const input = event.target as InstanceType<typeof window.HTMLInputElement>; const file = input.files?.[0];
  if (!file) return;
  isPreparingPhoto.value = true; profileError.value = '';
  try { avatarImage.value = await prepareAvatar(file); } catch (error) { profileError.value = error instanceof Error ? error.message : 'Não foi possível abrir a foto.'; }
  finally { isPreparingPhoto.value = false; input.value = ''; }
};
const activeTab = ref<'create' | 'join'>('create');
const isSubmitting = ref(false);
const playAgainstBots = ref(false);
const botCount = ref<number | string>(DEFAULT_BOT_COUNT);
const validBotCount = computed(() => Number.isInteger(botCount.value) && Number(botCount.value) >= 1 && Number(botCount.value) <= MAX_BOTS_PER_ROOM);

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
  if (!inputName.value.trim()) generatePlayerName();
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
  inputRoomCode.value = ''; activeTab.value = 'create';
  leaveRoom();
  emit('room-left');
};

const handleCreate = async (): Promise<void> => {
  if (!inputName.value.trim() || (playAgainstBots.value && !validBotCount.value)) return;
  try {
    isSubmitting.value = true;
    await createRoom(inputName.value.trim(), selectedAvatar.value, avatarImage.value, playAgainstBots.value ? Number(botCount.value) : 0);
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

        <div class="grid grid-cols-2 gap-1 rounded border border-line bg-paper-deep p-1" role="group" aria-label="Criar ou entrar em uma sala">
          <button type="button" @click="activeTab = 'create'" :aria-pressed="activeTab === 'create'" :disabled="isSubmitting" class="entry-tab" :class="activeTab === 'create' ? 'bg-surface-elevated text-gold-light shadow-sm' : 'text-ink-muted'"><PlusCircle class="h-4 w-4 shrink-0" aria-hidden="true" />Criar sala</button>
          <button type="button" aria-label="Entrar na sala" @click="activeTab = 'join'" :aria-pressed="activeTab === 'join'" :disabled="isSubmitting" class="entry-tab" :class="activeTab === 'join' ? 'bg-surface-elevated text-gold-light shadow-sm' : 'text-ink-muted'"><LogIn class="h-4 w-4 shrink-0" aria-hidden="true" />Entrar</button>
        </div>
        <form class="mt-6 space-y-5" @submit.prevent="activeTab === 'create' ? handleCreate() : handleJoin()" :aria-busy="isSubmitting">
          <div class="space-y-2">
            <label for="player-name" class="font-serif text-sm font-bold text-ink">Seu Codinome Político</label>
            <div class="flex items-center gap-2">
              <input id="player-name" v-model="inputName" type="text" maxlength="60" autocomplete="nickname" placeholder="Como vão chamar você?" required :disabled="isSubmitting" class="online-input flex-1" />
              <button type="button" class="online-icon-button random-name-button border border-gold/40 bg-surface-elevated text-gold" :disabled="isSubmitting" aria-label="Gerar outro nome" title="Gerar outro nome" @click="generatePlayerName"><Shuffle class="h-4 w-4" aria-hidden="true" /></button>
            </div>
          </div>
          <div v-if="activeTab === 'join'" class="space-y-2">
            <label for="room-code" class="font-serif text-sm font-bold text-ink">Código da sala</label>
            <input id="room-code" v-model="inputRoomCode" type="text" maxlength="6" placeholder="Ex: 7K3F" required autocomplete="off" autocapitalize="characters" :spellcheck="false" :disabled="isSubmitting" class="online-input uppercase tracking-[.2em] text-gold" />
          </div>
          <fieldset :disabled="isSubmitting || isPreparingPhoto" class="space-y-3">
            <legend class="font-serif text-sm font-bold text-ink">Escolha seu perfil</legend>
            <div class="profile-photo-panel rounded border border-line bg-paper-deep/50 p-3 sm:p-4" :aria-busy="isPreparingPhoto">
              <div class="flex items-center gap-3">
                <div class="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded border border-line-gold/50 bg-surface">
                  <img v-if="avatarImage" :src="avatarImage" alt="Sua foto de perfil" class="h-full w-full object-cover" />
                  <Camera v-else class="h-7 w-7 text-gold-muted" aria-hidden="true" />
                </div>
                <div class="min-w-0 space-y-1">
                  <p class="text-sm font-semibold text-ink">{{ avatarImage ? 'Sua foto na mesa' : 'Um perfil com a sua cara' }}</p>
                  <p class="text-xs leading-relaxed text-ink-muted">{{ avatarImage ? 'É assim que os outros jogadores verão você.' : 'Adicione sua foto ou escolha um personagem abaixo.' }}</p>
                </div>
              </div>
              <input ref="photoInput" type="file" accept="image/jpeg,image/png,image/webp" class="sr-only" aria-label="Enviar foto de perfil" @change="uploadPhoto" />
              <div class="mt-3 flex gap-2">
                <button type="button" class="profile-photo-button flex min-h-11 min-w-0 flex-1 items-center justify-center gap-2 rounded border border-gold/40 bg-gold/10 text-gold-light hover:bg-gold/20" @click="photoInput?.click()">
                  <Upload class="h-4 w-4 shrink-0" aria-hidden="true" />
                  {{ isPreparingPhoto ? 'Preparando…' : avatarImage ? 'Trocar foto' : 'Escolher foto' }}
                </button>
                <button v-if="avatarImage" type="button" class="online-icon-button remove-photo-button min-h-11 border border-status-red text-status-red hover:bg-status-red/10 hover:text-status-red" aria-label="Remover foto" title="Remover foto" @click="avatarImage = undefined"><Trash2 class="h-4 w-4" aria-hidden="true" /></button>
              </div>
              <p v-if="!avatarImage" class="mt-2 text-center text-[11px] text-ink-subtle">JPG, PNG ou WebP · até 10 MB</p>
            </div>
            <p v-if="profileError" role="alert" class="text-sm text-status-red">{{ profileError }}</p>
            <div class="grid grid-cols-4 gap-3">
              <button v-for="role in PLAYABLE_ROLES" :key="role" type="button" @click="selectedAvatar = role; avatarImage = undefined" :aria-label="getRoleDisplayName(role)" :aria-pressed="!avatarImage && selectedAvatar === role" class="profile-option relative aspect-square min-h-11 overflow-hidden rounded border-2 p-0.5 transition-colors" :class="!avatarImage && selectedAvatar === role ? 'border-gold bg-gold/20 ring-2 ring-gold/30 ring-offset-2 ring-offset-surface' : 'border-line bg-paper-deep hover:border-gold/50'">
                <img :src="'/images/characters/'+role+'.webp'" alt="" class="h-full w-full rounded object-cover" />
              </button>
            </div>
            <p class="break-words text-center text-xs text-ink-muted" aria-live="polite">Seu perfil: <strong class="text-gold-light">{{ inputName.trim() || 'Informe seu nome' }}</strong></p>
          </fieldset>
          <div v-if="activeTab === 'create'" class="space-y-3 rounded border border-line bg-paper-deep/50 p-3 sm:p-4">
            <div class="flex items-center gap-3">
              <Checkbox id="play-against-bots" v-model:checked="playAgainstBots" :disabled="isSubmitting" />
              <label for="play-against-bots" class="flex min-h-11 flex-1 cursor-pointer items-center font-semibold text-ink">Jogar contra bot</label>
            </div>
            <div v-if="playAgainstBots" class="space-y-2">
              <label for="bot-count" class="block font-serif font-bold text-ink">Quantidade de bots</label>
              <input id="bot-count" v-model.number="botCount" type="number" min="1" :max="MAX_BOTS_PER_ROOM" step="1" required inputmode="numeric" :disabled="isSubmitting" :aria-invalid="!validBotCount" aria-describedby="bot-count-help" class="online-input" />
              <p id="bot-count-help" class="text-xs text-ink-muted">De 1 a {{ MAX_BOTS_PER_ROOM }} bots. Você também pode convidar amigos para as vagas livres.</p>
            </div>
          </div>
          <button type="submit" :disabled="!inputName.trim() || (activeTab === 'create' && playAgainstBots && !validBotCount) || (activeTab === 'join' && !inputRoomCode.trim()) || isSubmitting || isPreparingPhoto" class="online-primary w-full" :aria-label="activeTab === 'create' ? 'Criar Nova Partida Online' : 'Entrar na Sala P2P'">
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

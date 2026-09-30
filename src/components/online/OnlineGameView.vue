<script setup lang="ts">
import { resolveRoomSettings, MAX_ROOM_SECONDS } from '@/game/models/roomSettings';
import Slider from '@/components/ui/slider/Slider.vue';
import { BOT_DIFFICULTIES, BOT_DIFFICULTY_TAG_CLASSES } from '@/game/bots/botDifficulty';
import { loadBotDifficulty, saveBotDifficulty, loadBotsEnabled, saveBotsEnabled } from '@/utils/botPreferences';
import { createPlayerName, characterGender, type PlayerGender } from '@/utils/playerName';
import { loadProfile, saveProfile, prepareAvatar } from "@/utils/playerProfile";
import { ref, computed, watch, onMounted } from 'vue';
import { Checkbox } from '@/components/ui/checkbox';
import { ACTION_TIMEOUT_SECONDS, RESPONSE_TIMEOUT_SECONDS, DEFAULT_BOT_COUNT, MAX_BOTS_PER_ROOM } from '@/constants/gameConfig';
import type { RoleSlug } from '@/types/game';
import { useOnlineGame } from '@/composables/useOnlineGame';
import { PLAYABLE_ROLES } from '@/game/engine/deck';
import { getRoleDisplayName } from '@/game/engine/gameEngine';
import { AlertCircle, PlusCircle, LogIn, ArrowLeft, Camera, Upload, Shuffle, Trash2, Mars, Venus, Users, UserRound, SlidersHorizontal, Clock, Bot } from 'lucide-vue-next';
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
const gender = ref<PlayerGender>(storedProfile.gender ?? 'all');
const genderLabel = computed(() => ({ all: 'Todos', male: 'Masculino', female: 'Feminino' })[gender.value]);
const filteredRoles = computed(() => PLAYABLE_ROLES.filter(role => gender.value === 'all' || characterGender(role) === gender.value));
const inputName = ref(storedProfile.name);
const generatePlayerName = (): void => {
  inputName.value = createPlayerName(gender.value, inputName.value);
};
const cycleGender = (): void => {
  gender.value = gender.value === 'all' ? 'male' : gender.value === 'male' ? 'female' : 'all';
  if (!filteredRoles.value.includes(selectedAvatar.value)) selectedAvatar.value = filteredRoles.value[0]!;
};
const avatarImage = ref(storedProfile.avatarImage);
const profileError = ref('');
const isPreparingPhoto = ref(false);
const photoInput = ref<(HTMLElement & { click(): void }) | null>(null);
const inputRoomCode = ref('');
const selectedAvatar = ref<RoleSlug>(storedProfile.avatarSlug);
watch([inputName, selectedAvatar, avatarImage, gender], () => {
  if (!saveProfile({ name: inputName.value, avatarSlug: selectedAvatar.value, avatarImage: avatarImage.value, gender: gender.value })) profileError.value = 'Seu navegador não permitiu salvar o perfil. Você ainda pode jogar.';
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
const playAgainstBots = ref(loadBotsEnabled());
watch(playAgainstBots, saveBotsEnabled);
const actionSeconds = ref<number | string>('');
const responseSeconds = ref<number | string>('');
const timingError = computed(() => { try { resolveRoomSettings({ actionSeconds: actionSeconds.value, responseSeconds: responseSeconds.value }); return ''; } catch (error) { return (error as Error).message; } });
const difficultyStep = ref([BOT_DIFFICULTIES.findIndex(level => level.value === loadBotDifficulty())]);
const selectedDifficulty = computed(() => BOT_DIFFICULTIES[difficultyStep.value[0] ?? 1]!);
watch(selectedDifficulty, level => saveBotDifficulty(level.value));
const difficultyTagClass = computed(() => BOT_DIFFICULTY_TAG_CLASSES[selectedDifficulty.value.value]);
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
  if (timingError.value || !inputName.value.trim() || (playAgainstBots.value && !validBotCount.value)) return;
  try {
    isSubmitting.value = true;
    await createRoom(inputName.value.trim(), selectedAvatar.value, avatarImage.value, playAgainstBots.value ? Number(botCount.value) : 0, selectedDifficulty.value.value, { actionSeconds: actionSeconds.value, responseSeconds: responseSeconds.value });
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
    await joinRoom(inputRoomCode.value.trim(), inputName.value.trim(), selectedAvatar.value, avatarImage.value);
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
    <div v-if="errorMessage"
      class="p-4 bg-status-red-bg border border-status-red/50 rounded text-status-red flex items-center justify-between gap-3 shadow-lg animate-fadeIn"
      role="alert">
      <div class="flex items-center gap-2 text-xs font-medium">
        <AlertCircle class="w-4 h-4 text-status-red shrink-0" aria-hidden="true" />
        <span>{{ errorMessage }}</span>
      </div>
      <button type="button" @click="clearError" class="text-xs font-bold text-status-red hover:underline">
        Dispensar
      </button>
    </div>

    <div v-if="mode === 'idle' || mode === 'creating' || mode === 'joining'"
      class="online-entry pt-12 mx-auto max-w-xl space-y-6 sm:space-y-8">
      <AppSectionHeader label="O poder está à mesa" title="Seu gabinete. Suas alianças."
        description="Reúna seus amigos, guarde seus segredos e dispute o poder." />
      <div class="entry-settings overflow-hidden rounded border border-line shadow-card">

        <div class="mx-4 mt-4 grid grid-cols-2 gap-1 rounded border border-line bg-paper-deep p-1 sm:mx-7 sm:mt-7" role="group"
          aria-label="Criar ou entrar em uma sala">
          <button type="button" @click="activeTab = 'create'" :aria-pressed="activeTab === 'create'"
            :disabled="isSubmitting" class="entry-tab"
            :class="activeTab === 'create' ? 'bg-surface-elevated text-gold-light shadow-sm' : 'text-ink-muted'">
            <PlusCircle class="h-4 w-4 shrink-0" aria-hidden="true" />Criar sala
          </button>
          <button type="button" aria-label="Entrar na sala" @click="activeTab = 'join'"
            :aria-pressed="activeTab === 'join'" :disabled="isSubmitting" class="entry-tab"
            :class="activeTab === 'join' ? 'bg-surface-elevated text-gold-light shadow-sm' : 'text-ink-muted'">
            <LogIn class="h-4 w-4 shrink-0" aria-hidden="true" />Entrar
          </button>
        </div>
        <form @submit.prevent="activeTab === 'create' ? handleCreate() : handleJoin()"
          :aria-busy="isSubmitting">
          <div class="space-y-6 px-4 py-6 sm:px-7 sm:py-7">
          <div class="space-y-2">
            <label for="player-name" class="font-serif text-sm font-bold text-ink">Seu Codinome Político</label>
            <div class="flex items-center gap-2">
              <input id="player-name" v-model="inputName" type="text" maxlength="60" autocomplete="nickname"
                placeholder="Como vão chamar você?" required :disabled="isSubmitting" class="online-input flex-1" />
              <button type="button"
                class="online-icon-button random-name-button border border-gold/40 bg-surface-elevated text-gold"
                :disabled="isSubmitting" aria-label="Gerar outro nome" title="Gerar outro nome"
                @click="generatePlayerName">
                <Shuffle class="h-4 w-4" aria-hidden="true" />
              </button>
              <button type="button"
                class="online-icon-button random-name-button border border-gold/40 bg-surface-elevated text-gold"
                :disabled="isSubmitting" :aria-label="`Gênero: ${genderLabel}. Alterar filtro`"
                :title="`Gênero: ${genderLabel}. Alternar todos, masculino e feminino`" @click="cycleGender">
                <component :is="gender === 'male' ? Mars : gender === 'female' ? Venus : Users" class="h-4 w-4"
                  aria-hidden="true" />
              </button>
            </div>
            <p class="text-xs text-ink-muted" aria-live="polite">Nomes e personagens: {{ genderLabel }}</p>
          </div>
          <div v-if="activeTab === 'join'" class="space-y-2">
            <label for="room-code" class="font-serif text-sm font-bold text-ink">Código da sala</label>
            <input id="room-code" v-model="inputRoomCode" type="text" maxlength="6" placeholder="Ex: 7K3F" required
              autocomplete="off" autocapitalize="characters" :spellcheck="false" :disabled="isSubmitting"
              class="online-input uppercase tracking-[.2em] text-gold" />
          </div>
          <fieldset :disabled="isSubmitting || isPreparingPhoto" class="min-w-0 space-y-3 border-t border-line/70 pt-5">
            <legend class="sr-only">Escolha seu perfil</legend>
            <h3 class="flex items-center gap-2 font-serif text-base font-bold text-gold-light">
              <UserRound class="size-4 shrink-0 text-gold-muted" aria-hidden="true" />Escolha seu perfil
            </h3>
            <div class="profile-photo-panel rounded border border-line/70 bg-paper-deep/20 p-3 sm:p-4"
              :aria-busy="isPreparingPhoto">
              <div class="flex items-center gap-3">
                <div
                  class="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded border border-line-gold/50 bg-surface">
                  <img v-if="avatarImage" :src="avatarImage" alt="Sua foto de perfil"
                    class="h-full w-full object-cover" />
                  <Camera v-else class="h-7 w-7 text-gold-muted" aria-hidden="true" />
                </div>
                <div class="min-w-0 space-y-1">
                  <p class="text-sm font-semibold text-ink">{{ avatarImage ? 'Sua foto na mesa' : 'Um perfil com a sua cara' }}</p>
                  <p class="text-xs leading-relaxed text-ink-muted">{{ avatarImage ? 'É assim que os outros jogadores verão você.' : 'Adicione sua foto ou escolha um personagem abaixo.' }}</p>
                </div>
              </div>
              <input ref="photoInput" type="file" accept="image/jpeg,image/png,image/webp" class="sr-only"
                aria-label="Enviar foto de perfil" @change="uploadPhoto" />
              <div class="mt-3 flex gap-2">
                <button type="button"
                  class="profile-photo-button flex min-h-11 min-w-0 flex-1 items-center justify-center gap-2 rounded border border-gold/40 bg-gold/10 text-gold-light hover:bg-gold/20"
                  @click="photoInput?.click()">
                  <Upload class="h-4 w-4 shrink-0" aria-hidden="true" />
                  {{ isPreparingPhoto ? 'Preparando…' : avatarImage ? 'Trocar foto' : 'Escolher foto' }}
                </button>
                <button v-if="avatarImage" type="button"
                  class="online-icon-button remove-photo-button min-h-11 border border-status-red text-status-red hover:bg-status-red/10 hover:text-status-red"
                  aria-label="Remover foto" title="Remover foto" @click="avatarImage = undefined">
                  <Trash2 class="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
              <p v-if="!avatarImage" class="mt-2 text-center text-[11px] text-ink-subtle">JPG, PNG ou WebP · até 10 MB
              </p>
            </div>
            <p v-if="profileError" role="alert" class="text-sm text-status-red">{{ profileError }}</p>
            <div class="grid grid-cols-4 gap-3">
              <button v-for="role in filteredRoles" :key="role" type="button"
                @click="selectedAvatar = role; avatarImage = undefined" :aria-label="getRoleDisplayName(role)"
                :aria-pressed="!avatarImage && selectedAvatar === role"
                class="profile-option relative aspect-square min-h-11 overflow-hidden rounded border-2 p-0.5 transition-colors"
                :class="!avatarImage && selectedAvatar === role ? 'border-gold bg-gold/20 ring-2 ring-gold/30 ring-offset-2 ring-offset-surface' : 'border-line bg-paper-deep hover:border-gold/50'">
                <img :src="`/images/characters/${role}.webp`" alt="" class="h-full w-full rounded object-cover" />
              </button>
            </div>
          </fieldset>
          <fieldset v-if="activeTab === 'create'" class="min-w-0 space-y-1 border-t border-line/70 pt-5"
            :disabled="isSubmitting">
            <legend class="sr-only">Configurações da partida</legend>
            <div class="flex items-center gap-3 pb-2">
              <span class="flex size-10 shrink-0 items-center justify-center rounded border border-gold/25 bg-gold/10 text-gold">
                <SlidersHorizontal class="size-5" aria-hidden="true" />
              </span>
              <div class="min-w-0">
                <h3 class="font-serif text-base font-bold text-gold-light">Configurações da partida</h3>
                <p class="mt-1 text-xs leading-relaxed text-ink-muted">Tempos e nível dos bots valem para toda a mesa.</p>
              </div>
            </div>
            <div class="space-y-4 py-4">
              <h4 class="flex items-center gap-2 font-serif text-sm font-bold text-gold-light">
                <Clock class="size-4 shrink-0 text-gold-muted" aria-hidden="true" />Ritmo da mesa
              </h4>
              <div class="grid grid-cols-2 gap-3 sm:gap-4">
                <div class="min-w-0 space-y-2.5">
                  <label for="action-seconds"
                    class="flex items-center gap-2 text-sm font-semibold text-ink"><span>Ação<span class="sr-only">
                        (segundos)</span></span></label>
                  <div class="relative">
                    <input id="action-seconds" v-model.number="actionSeconds" type="number" min="1"
                      :max="MAX_ROOM_SECONDS" step="1" inputmode="numeric" :placeholder="String(ACTION_TIMEOUT_SECONDS)"
                      class="online-input pr-10 font-semibold tabular-nums" aria-label="Tempo da ação (segundos)"
                      aria-describedby="action-time-help timing-error" />
                    <span
                      class="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-gold-muted"
                      aria-hidden="true">seg</span>
                  </div>
                  <p id="action-time-help" class="text-xs leading-relaxed text-ink-subtle">Padrão: {{
                    ACTION_TIMEOUT_SECONDS }} s por turno</p>
                </div>
                <div class="min-w-0 space-y-2.5">
                  <label for="response-seconds"
                    class="flex items-center gap-2 text-sm font-semibold text-ink"><span>Resposta<span class="sr-only">
                        (segundos)</span></span></label>
                  <div class="relative">
                    <input id="response-seconds" v-model.number="responseSeconds" type="number" min="1"
                      :max="MAX_ROOM_SECONDS" step="1" inputmode="numeric"
                      :placeholder="String(RESPONSE_TIMEOUT_SECONDS)"
                      class="online-input pr-10 font-semibold tabular-nums" aria-label="Tempo da resposta (segundos)"
                      aria-describedby="response-time-help timing-error" />
                    <span
                      class="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-gold-muted"
                      aria-hidden="true">seg</span>
                  </div>
                  <p id="response-time-help" class="text-xs leading-relaxed text-ink-subtle">Padrão: {{
                    RESPONSE_TIMEOUT_SECONDS }} s por decisão</p>
                </div>
              </div>
              <p class="text-xs leading-relaxed text-ink-muted">Deixe em branco para usar o padrão. Respostas incluem
                bloqueios, contestações e escolhas de cartas.</p>
              <p v-if="timingError" id="timing-error" role="alert" class="text-xs text-status-red">{{ timingError }}</p>
            </div>
            <div class="space-y-4 border-t border-line/70 py-4">
              <div class="flex min-h-11 items-center gap-3">
                <label for="play-against-bots" class="min-w-0 flex-1 cursor-pointer">
                  <span id="bots-label" class="flex items-center gap-2 font-serif text-sm font-bold text-gold-light">
                    <Bot class="size-4 shrink-0 text-gold-muted" aria-hidden="true" />Adicionar bots à mesa
                  </span>
                  <span id="bots-help" class="mt-1 block text-xs leading-relaxed text-ink-muted">Treine sozinho ou jogue
                    com amigos e bots.</span>
                </label>
                <Checkbox id="play-against-bots" v-model:checked="playAgainstBots" :disabled="isSubmitting"
                  aria-labelledby="bots-label" aria-describedby="bots-help" />
              </div>
              <div v-if="playAgainstBots" class="space-y-4">
                <div class="grid grid-cols-[minmax(0,1fr)_5rem] items-center gap-x-4 gap-y-1">
                  <label for="bot-count" class="text-sm font-semibold text-ink">Quantidade de bots</label>
                  <input id="bot-count" v-model.number="botCount" type="number" min="1" :max="MAX_BOTS_PER_ROOM"
                    step="1" required inputmode="numeric" :disabled="isSubmitting" :aria-invalid="!validBotCount"
                    aria-describedby="bot-count-help" class="online-input text-center font-semibold tabular-nums" />
                  <p id="bot-count-help" class="col-span-2 text-xs text-ink-subtle">De 1 a {{ MAX_BOTS_PER_ROOM }} bots.
                    As vagas livres ficam para seus amigos.</p>
                </div>
                <div class="pt-1">
                  <div class="flex items-center justify-between gap-3">
                    <span class="text-sm font-semibold text-ink">Nível dos bots</span>
                    <span class="rounded border px-2.5 py-1 text-xs font-semibold" :class="difficultyTagClass"
                      aria-live="polite">{{ selectedDifficulty.label }}</span>
                  </div>
                  <Slider v-model="difficultyStep" :min="0" :max="BOT_DIFFICULTIES.length - 1" :step="1" :disabled="isSubmitting"
                    label="Nível dos bots" :value-text="selectedDifficulty.label" class="mt-3" />
                  <div class="relative mx-3 h-5 text-xs" aria-hidden="true">
                    <span v-for="(level, index) in BOT_DIFFICULTIES" :key="level.value"
                      class="absolute top-0 -translate-x-1/2 whitespace-nowrap"
                      :style="{ left: `${index / (BOT_DIFFICULTIES.length - 1) * 100}%` }"
                      :class="level.value === selectedDifficulty.value ? 'font-semibold text-gold' : 'text-ink-subtle'">{{
                      level.label }}</span>
                  </div>
                  <p class="mt-3 min-h-10 text-xs leading-relaxed text-ink-muted">{{ selectedDifficulty.description }}
                  </p>
                </div>
              </div>
            </div>

          </fieldset>
          </div>
          <div
            class="entry-settings-footer gold-divider-top space-y-4 px-4 py-5 sm:px-7 sm:py-6">
            <div class="flex items-center gap-3">
              <img :src="avatarImage || `/images/characters/${selectedAvatar}.webp`" alt=""
                class="size-11 shrink-0 rounded border border-gold/30 object-cover" />
              <div class="min-w-0">
                <p class="text-[11px] font-medium uppercase tracking-widest text-gold-muted">Seu lugar na mesa</p>
                <p class="mt-1 break-words text-sm font-semibold text-ink" aria-live="polite">{{ inputName.trim() || 'Informe seu nome' }}</p>
              </div>
            </div>
            <button type="submit"
              :disabled="!inputName.trim() || (activeTab === 'create' && (!!timingError || (playAgainstBots && !validBotCount))) || (activeTab === 'join' && !inputRoomCode.trim()) || isSubmitting || isPreparingPhoto"
              class="online-primary w-full"
              :aria-label="activeTab === 'create' ? 'Criar Nova Partida Online' : 'Entrar na Sala P2P'">
              <component :is="activeTab === 'create' ? PlusCircle : LogIn" v-if="!isSubmitting" class="size-[18px]" aria-hidden="true" />
              <span>{{ isSubmitting ? 'Conectando…' : activeTab === 'create' ? 'Criar minha sala' : 'Entrar na sala'
                }}</span>
            </button>
            <p class="text-center text-xs leading-relaxed text-ink-muted">{{ activeTab === 'create' ? 'Crie a sala e convide seus amigos para a mesa.' : 'Entre com o código recebido no convite.' }}</p>
          </div>
        </form>
      </div>
      <div class="text-center"><button type="button" @click="emit('back-to-manual')"
          class="inline-flex min-h-11 items-center gap-2 text-sm text-ink-muted hover:text-gold">
          <ArrowLeft class="h-4 w-4" aria-hidden="true" />Consultar regras
        </button></div>
    </div>

    <!-- TELA 2: LOBBY DA SALA -->
    <LobbyRoom v-else-if="mode === 'lobby' && gameState" :room-code="currentRoomCode" :game-state="gameState"
      :my-player-id="myPlayerId" :is-host="isHost" @set-ready="setReady" @start-game="startGame" @leave="handleLeave" />

    <!-- TELA 3: MESA DE JOGO ATIVA -->
    <GameBoard v-else-if="mode === 'playing' && gameState" :game-state="gameState" :private-view="privateView"
      :my-player-id="myPlayerId" :is-host="isHost" @declare-action="declareAction" @declare-block="declareBlock"
      @declare-challenge="declareChallenge" @pass-response="passResponse" @choose-card="chooseCard"
      @choose-exchange="chooseExchange" @leave="handleLeave" />
  </div>
</template>

<style scoped>
.entry-settings {
  background: var(--surface);
}

.entry-settings-footer {
  position: relative;
  background: var(--paper);
}

</style>

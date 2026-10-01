<script setup lang="ts">
import DiscordConversation from './DiscordConversation.vue';
import { playerAvatar } from "@/utils/playerProfile";
import { GAME_NAME } from "@/constants/gameConfig";
import { ref, computed } from 'vue';
import { DEFAULT_GAME_SETTINGS } from '@/game/models/gameState';
import { BOT_DIFFICULTIES, DEFAULT_BOT_DIFFICULTY, BOT_DIFFICULTY_TAG_CLASSES } from '@/game/bots/botDifficulty';
import { MIN_PLAYERS_TO_START, MAX_PLAYERS_PER_ROOM, type GameState } from '@/game/models/gameState';
import { getRoleDisplayName } from '@/game/engine/gameEngine';
import { Copy, Check, CheckCircle2, LogOut, Users, Share2, SlidersHorizontal, Clock, Bot } from '@lucide/vue';

interface Props {
  roomCode: string;
  gameState: GameState;
  myPlayerId: string;
  isHost: boolean;
}

const props = defineProps<Props>();
const roomSettings = computed(() => props.gameState.settings ?? DEFAULT_GAME_SETTINGS);
const botLevel = computed(() => BOT_DIFFICULTIES.find(level => level.value === (props.gameState.botDifficulty ?? DEFAULT_BOT_DIFFICULTY))?.label);
const botLevelClass = computed(() => BOT_DIFFICULTY_TAG_CLASSES[props.gameState.botDifficulty ?? DEFAULT_BOT_DIFFICULTY]);
const botCount = computed(() => playerList.value.filter(player => player?.isBot).length);

const emit = defineEmits<{
  (e: 'retry-conversation'): void;
  (e: 'set-ready', ready: boolean): void;
  (e: 'start-game'): void;
  (e: 'leave'): void;
}>();

const copiedNotice = ref(false);

const playerList = computed(() => {
  return props.gameState.playerOrder.map((id) => props.gameState.players[id]).filter(Boolean);
});

const myPlayer = computed(() => {
  return props.gameState.players[props.myPlayerId] || null;
});

const canStart = computed(() => {
  return props.isHost && playerList.value.length >= MIN_PLAYERS_TO_START && playerList.value.every(player => player?.isReady && player.isConnected);
});

const shareableUrl = computed(() => {
  if (typeof window === 'undefined') return '';
  return `${window.location.origin}/game/${props.roomCode}`;
});

const copyRoomLink = async (): Promise<void> => {
  try {
    if (typeof window !== 'undefined' && window.navigator?.clipboard) {
      await window.navigator.clipboard.writeText(shareableUrl.value);
      copiedNotice.value = true;
      window.setTimeout(() => {
        copiedNotice.value = false;
      }, 2500);
    }
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.warn('Erro ao copiar link:', err.message);
    }
  }
};

const handleShare = async (): Promise<void> => {
  if (typeof window !== 'undefined' && typeof window.navigator?.share === 'function') {
    try {
      await window.navigator.share({
        title: `${GAME_NAME  } — Mesa Online`,
        text: `Participe da minha mesa política em ${GAME_NAME}! Código: ${props.roomCode}`,
        url: shareableUrl.value,
      });
      return;
    } catch {
      // Fallback para cópia
    }
  }
  await copyRoomLink();
};
</script>

<template>
  <div class="max-w-4xl mx-auto space-y-5 sm:space-y-8 animate-fadeIn pb-8">
    <!-- Banner de Boas-Vindas da Sala -->
    <div
      class="bg-surface border border-line-gold/50 rounded p-4 sm:p-8 shadow-card flex flex-col md:flex-row items-center justify-between gap-5 sm:gap-6"
    >
      <div class="space-y-2 text-center md:text-left">
        <span
          class="inline-flex items-center gap-1.5 px-3 py-1 rounded text-xs font-semibold bg-gold/15 text-gold-light border border-gold/30"
        >
          <span class="h-2 w-2 rounded bg-status-green animate-pulse"></span>
          Convide seus amigos
        </span>
        <h1 class="font-serif text-2xl sm:text-3xl font-bold text-ink tracking-tight">
          Sala de Articulação Política
        </h1>
        <p class="text-xs sm:text-sm text-ink-muted max-w-md">
          Compartilhe o convite e espere todos marcarem que estão prontos.
        </p>
      </div>

      <!-- Caixa do Código da Sala com Cópia Rápida e Compartilhamento -->
      <div
        class="w-full md:w-auto flex flex-col items-center md:items-end gap-2 bg-paper-deep/80 border border-line-gold/40 p-4 sm:p-5 rounded sm:min-w-[240px]"
      >
        <span class="text-[11px] font-serif uppercase tracking-wider text-ink-subtle">
          Código de Acesso
        </span>
        <div class="font-serif font-black text-3xl sm:text-4xl text-gold tracking-widest">
          {{ roomCode }}
        </div>
        <div class="w-full flex items-center gap-2 mt-1">
          <button
            type="button"
            @click="handleShare"
            class="flex-1 px-3 py-2 rounded bg-gold hover:bg-gold-light text-paper-deep font-sans font-bold text-xs tracking-normal transition-all flex items-center justify-center gap-1.5 shadow-sm"
          >
            <template v-if="copiedNotice">
              <Check class="w-3.5 h-3.5 text-paper-deep" aria-hidden="true" />
              <span>Link Copiado!</span>
            </template>
            <template v-else>
              <Share2 class="w-3.5 h-3.5" aria-hidden="true" />
              <span>Convidar</span>
            </template>
          </button>
          <button
            type="button"
            @click="copyRoomLink"
            class="online-icon-button p-2 rounded bg-surface-elevated hover:bg-surface-hover border border-line text-ink transition-colors"
            title="Copiar link da mesa"
          >
            <Copy class="w-4 h-4 text-gold-light" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>

    <DiscordConversation v-if="gameState.discordConversation" :conversation="gameState.discordConversation" :can-retry="isHost" @retry="emit('retry-conversation')" />

    <section class="rounded border border-line bg-surface p-4 shadow-card sm:p-6" aria-labelledby="lobby-settings-title">
      <div class="mb-4 space-y-2 gold-divider-bottom relative pb-3">
        <h2 id="lobby-settings-title" class="game-section-title flex min-h-8 items-center gap-2">
          <SlidersHorizontal class="size-4 shrink-0 text-gold-light" aria-hidden="true" />Configurações da partida
        </h2>
        <p class="text-xs leading-relaxed text-ink-muted">Definidas pelo anfitrião. As mesmas regras para toda a mesa.</p>
      </div>
      <div class="grid gap-4 sm:grid-cols-2 sm:gap-6">
        <div class="min-w-0">
          <h3 class="mb-3 flex items-center gap-2 font-serif text-sm font-bold text-gold-light">
            <Clock class="size-4 shrink-0 text-gold-muted" aria-hidden="true" />Ritmo da mesa
          </h3>
          <dl class="space-y-3 text-sm">
            <div class="flex items-baseline justify-between gap-3">
              <dt class="text-ink-muted">Tempo de ação</dt>
              <dd class="shrink-0 font-semibold tabular-nums text-ink">{{ roomSettings.actionTimeoutMs / 1000 }} <span class="text-xs font-normal text-ink-subtle">seg</span></dd>
            </div>
            <div class="flex items-baseline justify-between gap-3">
              <dt class="text-ink-muted">Tempo de resposta</dt>
              <dd class="shrink-0 font-semibold tabular-nums text-ink">{{ roomSettings.reactionTimeoutMs / 1000 }} <span class="text-xs font-normal text-ink-subtle">seg</span></dd>
            </div>
          </dl>
          <p class="mt-3 text-xs leading-relaxed text-ink-subtle">Respostas incluem bloqueios, contestações e escolhas de cartas.</p>
        </div>
        <div class="min-w-0 border-t border-line/50 pt-4 sm:border-l sm:border-t-0 sm:pl-6 sm:pt-0">
          <h3 class="mb-3 flex items-center gap-2 font-serif text-sm font-bold text-gold-light">
            <Bot class="size-4 shrink-0 text-gold-muted" aria-hidden="true" />Bots na mesa
          </h3>
          <dl v-if="botCount" class="space-y-3 text-sm">
            <div class="flex items-baseline justify-between gap-3">
              <dt class="text-ink-muted">Quantidade</dt>
              <dd class="font-semibold tabular-nums text-ink">{{ botCount }}</dd>
            </div>
            <div class="flex items-center justify-between gap-3">
              <dt class="text-ink-muted">Dificuldade</dt>
              <dd class="rounded border px-2 py-1 text-xs font-semibold" :class="botLevelClass">{{ botLevel }}</dd>
            </div>
          </dl>
          <p v-else class="text-sm text-ink-muted">Sem bots nesta partida.</p>
        </div>
      </div>
    </section>
    <!-- Lista de Jogadores Conectados -->
    <div class="bg-surface border border-line/60 rounded p-4 sm:p-6 shadow-card space-y-4">
      <div class="space-y-2 gold-divider-bottom relative pb-3">
        <div class="flex min-h-8 min-w-0 flex-wrap items-center gap-2">
          <h2 class="game-section-title flex min-w-0 flex-1 items-center gap-2">
            <Users class="size-4 shrink-0 text-gold-light" aria-hidden="true" />Mesa de negociação
          </h2>
          <span class="shrink-0 whitespace-nowrap text-sm px-2 py-1 rounded bg-surface-elevated text-gold font-semibold">
            {{ playerList.length }} / {{ MAX_PLAYERS_PER_ROOM }}
          </span>
        </div>
        <p class="text-xs leading-relaxed text-ink-muted">
          Mínimo de {{ MIN_PLAYERS_TO_START }} participantes para iniciar
        </p>
      </div>

      <!-- Alerta de Quórum Mínimo Atingido -->
      <div v-if="canStart"
        class="p-3 bg-status-green-bg/80 border border-status-green/50 rounded flex items-center gap-2 text-xs text-status-green font-medium">
        <CheckCircle2 class="w-4 h-4 shrink-0" aria-hidden="true" />
        <span>Quórum mínimo atingido ({{ playerList.length }} participantes na mesa). O anfitrião já pode dar início à partida!</span>
      </div>

      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <article v-for="(player, idx) in playerList" :key="player.id" class="lobby-player flex items-start gap-4 rounded border bg-paper-deep/60 p-4" :class="player.id === myPlayerId ? 'border-gold/40' : 'border-line'">
          <img :src="playerAvatar(player)" :alt="player.name" class="h-16 w-16 shrink-0 rounded object-cover object-top" />
          <div class="min-w-0 flex-1">
            <h3 class="break-words text-sm font-semibold leading-relaxed text-ink">{{ player.name }}</h3>
            <div class="player-details flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-ink-muted">
              <span v-if="!player.avatarImage && player.avatarSlug">{{ getRoleDisplayName(player.avatarSlug) }}</span>
              <span v-if="idx === 0" class="text-gold">Anfitrião</span>
              <span v-if="player.id === myPlayerId" class="text-gold">Você</span>
            </div>
            <span class="inline-flex items-center gap-1.5 text-xs font-medium" :class="!player.isConnected ? 'text-status-red' : player.isReady ? 'text-status-green' : 'text-ink-muted'">
              <span class="h-1.5 w-1.5 rounded-sm bg-current" aria-hidden="true"></span>
              {{ !player.isConnected ? 'Reconectando…' : player.isReady ? 'Pronto para jogar' : 'Aguardando confirmação' }}
            </span>
          </div>
        </article>
      </div>
    </div>

    <!-- Barra de Controle do Lobby -->
    <div class="flex flex-col items-stretch gap-3 pt-4 gold-divider-top relative">
      <div class="lobby-actions flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button type="button" @click="emit('leave')"
          class="order-2 flex min-h-11 w-full items-center gap-2 text-sm font-semibold text-ink-muted transition-colors hover:text-status-red sm:order-1 sm:w-auto">
          <LogOut class="h-4 w-4" aria-hidden="true" />
          <span>Abandonar Gabinete</span>
        </button>
        <!-- Botão de Pronto para jogadores comuns -->
        <button v-if="!isHost" type="button" @click="emit('set-ready', !myPlayer?.isReady)"
          class="order-1 min-h-11 w-full sm:order-2 sm:w-auto px-6 py-3 rounded font-sans font-bold text-xs tracking-normal transition-all border flex items-center justify-center gap-1.5"
          :class="[
            myPlayer?.isReady
              ? 'bg-status-green-bg border-status-green text-status-green hover:bg-status-green-bg/80'
              : 'bg-surface-elevated border-gold/40 text-gold-light hover:bg-surface-hover'
          ]">
          <CheckCircle2 v-if="myPlayer?.isReady" class="w-3.5 h-3.5" aria-hidden="true" />
          <span>{{ myPlayer?.isReady ? 'Pronto · desmarcar' : 'Marcar como Pronto' }}</span>
        </button>

        <!-- Botão de Iniciar para o Host -->
        <button v-if="isHost" type="button" aria-label="Iniciar disputa" :disabled="!canStart" @click="emit('start-game')"
          class="order-1 min-h-11 w-full sm:order-2 sm:w-auto sm:min-w-48 px-6 py-3 rounded font-sans font-bold text-xs tracking-normal transition-all shadow-lg flex items-center justify-center gap-2"
          :class="[
            canStart
              ? 'bg-gold hover:bg-gold-light text-paper-deep hover:shadow-gold/20 active:scale-95'
              : 'bg-surface-elevated text-ink-subtle cursor-not-allowed border border-line'
          ]">
          <span>{{ canStart ? 'Iniciar partida' : playerList.length >= MIN_PLAYERS_TO_START
            ? 'Aguardando todos conectados e prontos…' : `Aguardando quórum (${playerList.length}/${MIN_PLAYERS_TO_START})…` }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.player-details > span + span::before {
  content: "·";
  margin-right: 0.5rem;
  color: var(--ink-muted, #aab7c0);
}
</style>

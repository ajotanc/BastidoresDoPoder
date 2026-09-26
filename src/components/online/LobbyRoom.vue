<script setup lang="ts">
import { ref, computed } from 'vue';
import { MIN_PLAYERS_TO_START, type GameState } from '@/game/models/gameState';
import { getRoleDisplayName } from '@/game/engine/gameEngine';
import { Copy, Check, CheckCircle2, Play, LogOut, Users } from 'lucide-vue-next';

interface Props {
  roomCode: string;
  gameState: GameState;
  myPlayerId: string;
  isHost: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
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
</script>

<template>
  <div class="max-w-4xl mx-auto space-y-8 animate-fadeIn">
    <!-- Banner de Boas-Vindas da Sala -->
    <div
      class="bg-surface border border-line-gold/50 rounded-2xl p-6 sm:p-8 shadow-card flex flex-col md:flex-row items-center justify-between gap-6">
      <div class="space-y-2 text-center md:text-left">
        <span
          class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gold/15 text-gold-light border border-gold/30">
          <span class="h-2 w-2 rounded-full bg-status-green animate-pulse"></span>
          Gabinete P2P Ativo
        </span>
        <h1 class="font-serif text-2xl sm:text-3xl font-bold text-ink tracking-tight">
          Sala de Articulação Política
        </h1>
        <p class="text-xs sm:text-sm text-ink-muted max-w-md">
          Convide outros negociadores para disputar os Bastidores do Poder. A autoridade da partida é executada de forma
          peer-to-peer.
        </p>
      </div>

      <!-- Caixa do Código da Sala com Cópia Rápida -->
      <div
        class="flex flex-col items-center md:items-end gap-2 bg-paper-deep/80 border border-line-gold/40 p-4 sm:p-5 rounded-2xl min-w-[240px]">
        <span class="text-[11px] font-serif uppercase tracking-wider text-ink-subtle">
          Código de Acesso
        </span>
        <div class="font-serif font-black text-3xl sm:text-4xl text-gold tracking-widest">
          {{ roomCode }}
        </div>
        <button type="button" @click="copyRoomLink"
          class="w-full mt-1 px-3 py-1.5 rounded-lg bg-surface-elevated hover:bg-surface-hover border border-line text-xs font-medium text-ink transition-colors flex items-center justify-center gap-1.5">
          <template v-if="copiedNotice">
            <Check class="w-3.5 h-3.5 text-status-green" aria-hidden="true" />
            <span class="text-status-green font-semibold">Link Copiado!</span>
          </template>
          <template v-else>
            <Copy class="w-3.5 h-3.5 text-gold-light" aria-hidden="true" />
            <span>Copiar Link de Convite</span>
          </template>
        </button>
      </div>
    </div>

    <!-- Lista de Jogadores Conectados -->
    <div class="bg-surface border border-line/60 rounded-2xl p-6 shadow-card space-y-4">
      <div class="flex items-center justify-between border-b border-line/40 pb-3">
        <div class="flex items-center gap-2">
          <Users class="w-4 h-4 text-gold-light" aria-hidden="true" />
          <h2 class="font-serif font-bold text-base text-ink tracking-wide">
            Mesa de Negociadores
          </h2>
          <span class="text-xs px-2 py-0.5 rounded-full bg-surface-elevated text-gold font-semibold">
            {{ playerList.length }} / 8
          </span>
        </div>
        <span class="text-xs text-ink-muted">
          Mínimo de {{ MIN_PLAYERS_TO_START }} participantes para iniciar
        </span>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        <div v-for="(player, idx) in playerList" :key="player.id"
          class="p-4 rounded-xl border flex items-center justify-between gap-3 transition-all" :class="[
            player.id === myPlayerId
              ? 'bg-gold/10 border-gold/40'
              : 'bg-paper-deep/70 border-line'
          ]">
          <div class="flex items-center gap-3 min-w-0">
            <div
              class="w-10 h-10 rounded-full bg-surface-elevated border border-gold/40 flex items-center justify-center overflow-hidden shrink-0">
              <img :src="`/images/characters/${player.avatarSlug}.webp`" :alt="getRoleDisplayName(player.avatarSlug)"
                class="w-full h-full object-cover" loading="lazy" onerror="this.src='/images/icons/guide.webp'" />
            </div>
            <div class="min-w-0">
              <div class="flex items-center gap-1.5">
                <span class="font-semibold text-sm text-ink truncate">{{ player.name }}</span>
                <span v-if="idx === 0" class="text-[10px] bg-gold/20 text-gold-light px-1.5 py-0.2 rounded font-bold">
                  HOST
                </span>
              </div>
              <span class="text-xs text-ink-muted truncate block">
                {{ getRoleDisplayName(player.avatarSlug) }}
              </span>
            </div>
          </div>

          <div>
            <span v-if="player.isReady"
              class="text-[11px] font-semibold text-status-green bg-status-green-bg px-2 py-0.5 rounded border border-status-green/30">
              Pronto
            </span>
            <span v-else
              class="text-[11px] font-semibold text-ink-subtle bg-surface-elevated px-2 py-0.5 rounded border border-line">
              Aguardando
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Barra de Controle do Lobby -->
    <div class="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-line/40">
      <button type="button" @click="emit('leave')"
        class="text-xs font-semibold text-ink-muted hover:text-status-red transition-colors order-2 sm:order-1 flex items-center gap-1.5">
        <LogOut class="w-3.5 h-3.5" aria-hidden="true" />
        <span>Abandonar Gabinete</span>
      </button>

      <!-- Alerta de Quórum Mínimo Atingido -->
      <div v-if="canStart"
        class="p-3 bg-status-green-bg/80 border border-status-green/50 rounded-xl flex items-center justify-between text-xs text-status-green font-medium">
        <span class="flex items-center gap-2">
          <CheckCircle2 class="w-4 h-4 text-status-green shrink-0" aria-hidden="true" />
          <span>Quórum mínimo atingido ({{ playerList.length }} participantes na mesa). O Host já pode dar início à
            partida!</span>
        </span>
      </div>

      <div class="flex items-center gap-3 w-full sm:w-auto order-1 sm:order-2">
        <!-- Botão de Pronto para jogadores comuns -->
        <button v-if="!isHost" type="button" @click="emit('set-ready', !myPlayer?.isReady)"
          class="w-full sm:w-auto px-6 py-3 rounded-xl font-serif font-bold text-xs uppercase tracking-wider transition-all border flex items-center justify-center gap-1.5"
          :class="[
            myPlayer?.isReady
              ? 'bg-status-green-bg border-status-green text-status-green hover:bg-status-green-bg/80'
              : 'bg-surface-elevated border-gold/40 text-gold-light hover:bg-surface-hover'
          ]">
          <CheckCircle2 v-if="myPlayer?.isReady" class="w-3.5 h-3.5" aria-hidden="true" />
          <span>{{ myPlayer?.isReady ? 'Confirmado (Clique para Desmarcar)' : 'Marcar como Pronto' }}</span>
        </button>

        <!-- Botão de Iniciar para o Host -->
        <button v-if="isHost" type="button" aria-label="Iniciar disputa" :disabled="!canStart" @click="emit('start-game')"
          class="w-full sm:w-auto px-8 py-3.5 rounded-xl font-serif font-bold text-xs uppercase tracking-wider transition-all shadow-lg flex items-center justify-center gap-2"
          :class="[
            canStart
              ? 'bg-gold hover:bg-gold-light text-paper-deep hover:shadow-gold/20 active:scale-95 animate-pulse'
              : 'bg-surface-elevated text-ink-subtle cursor-not-allowed border border-line'
          ]">
          <span>{{ canStart ? `Iniciar Disputa (${playerList.length} Jogadores)` : playerList.length >= MIN_PLAYERS_TO_START
            ? 'Aguardando todos conectados e prontos…' : `Aguardando quórum (${playerList.length}/${MIN_PLAYERS_TO_START})…` }}</span>
          <Play v-if="canStart" class="w-3.5 h-3.5 fill-current" aria-hidden="true" />
        </button>
      </div>
    </div>
  </div>
</template>

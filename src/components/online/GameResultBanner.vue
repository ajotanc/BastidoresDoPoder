<script setup lang="ts">
import { computed } from 'vue';
import { Trophy, RotateCcw } from 'lucide-vue-next';
import GameEventMessage from './GameEventMessage.vue';
import type { GameState } from '@/game/models/gameState';

const props = defineProps<{ gameState: GameState }>();
defineEmits<{ (event: 'play-again'): void }>();
const winner = computed(() => props.gameState.players[props.gameState.winnerPlayerId ?? '']);
const finalEvents = computed(() => {
  const history = props.gameState.history;
  const boundary = history.findIndex(event => ['TURN_CHANGED', 'GAME_STARTED', 'ROOM_CREATED'].includes(event.type));
  return history.slice(0, boundary < 0 ? history.length : boundary)
    .filter(event => !['GAME_FINISHED', 'WINNER_SUPPORTS_AVAILABLE'].includes(event.type)).reverse();
});
</script>

<template>
  <div class="rounded border border-line border-l-4 border-l-gold bg-surface p-4 shadow-card sm:p-6" aria-label="Resultado da partida">
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div class="min-w-0 space-y-1" role="status">
        <p class="flex items-center gap-2 text-sm font-semibold text-gold"><Trophy class="h-4 w-4 shrink-0" aria-hidden="true" />Partida encerrada</p>
        <h3 class="break-words font-serif text-base font-bold text-ink sm:text-lg">{{ winner ? `${winner.name} venceu!` : 'Sessão encerrada sem vencedor' }}</h3>
        <p class="text-sm text-ink-muted">{{ winner ? 'Último gabinete com apoios ativos na mesa.' : 'A sessão terminou. Os acontecimentos permanecem disponíveis abaixo.' }}</p>
      </div>
      <button type="button" class="online-primary w-full shrink-0 sm:w-auto" @click="$emit('play-again')"><RotateCcw class="h-4 w-4" aria-hidden="true" />Jogar novamente</button>
    </div>
    <div v-if="finalEvents.length" class="mt-4 space-y-2 border-t border-line pt-4">
      <h4 class="font-serif text-sm font-semibold text-gold-light">Como a partida terminou</h4>
      <ol class="space-y-2 pl-5 text-sm leading-relaxed text-ink-muted list-decimal">
        <li v-for="event in finalEvents" :key="event.id" class="break-words"><GameEventMessage :message="event.message" /></li>
      </ol>
    </div>
    <p class="mt-4 text-xs text-ink-subtle">A mesa permanece disponível para consultar os gabinetes, as cartas reveladas e o histórico.</p>
  </div>
</template>

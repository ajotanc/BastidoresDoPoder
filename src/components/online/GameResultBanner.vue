<script setup lang="ts">
import { computed, ref } from 'vue';
import { Trophy, RotateCcw, Share2 } from 'lucide-vue-next';
import { buildResultSummary, durationLabel } from '@/game/resultSummary';
import { shareResult } from '@/utils/shareResult';
import AppButton from '@/components/ui/AppButton.vue';
import GameEventMessage from './GameEventMessage.vue';
import type { GameState } from '@/game/models/gameState';

const props = defineProps<{ gameState: GameState; isHost?: boolean }>();
defineEmits<{ (event: 'play-again'): void }>();
const summary = computed(() => buildResultSummary(props.gameState));
const sharing = ref(false);
const feedback = ref('');
async function share() {
  if (!summary.value || sharing.value) return;
  sharing.value = true;
  try { feedback.value = await shareResult(summary.value); }
  catch { feedback.value = 'Não foi possível gerar a imagem. Tente novamente.'; }
  finally { sharing.value = false; }
}
const winner = computed(() => props.gameState.players[props.gameState.winnerPlayerId ?? '']);
const finalEvents = computed(() => {
  const history = props.gameState.history;
  const boundary = history.findIndex(event => ['TURN_CHANGED', 'GAME_STARTED', 'ROOM_CREATED'].includes(event.type));
  return history.slice(0, boundary < 0 ? history.length : boundary)
    .filter(event => !['GAME_FINISHED', 'WINNER_SUPPORTS_AVAILABLE'].includes(event.type)).reverse();
});
</script>

<template>
  <div class="rounded border border-line bg-surface p-4 shadow-card sm:p-6" aria-label="Resultado da partida">
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div class="min-w-0 space-y-1" role="status">
        <p class="flex items-center gap-2 text-sm font-semibold text-gold"><Trophy class="h-4 w-4 shrink-0" aria-hidden="true" />Partida encerrada</p>
        <h3 class="break-words font-serif text-base font-bold text-ink sm:text-lg">{{ winner ? `${winner.name} conquistou o poder.` : 'Sessão encerrada sem vencedor' }}</h3>
        <p class="text-sm text-ink-muted">{{ summary ? `Mesa ${summary.roomCode} · ${summary.turns} turnos · ${durationLabel(summary.durationSeconds)}` : 'A sessão terminou. Os acontecimentos permanecem disponíveis abaixo.' }}</p>
      </div>
      <AppButton v-if="isHost && winner" class="w-full shrink-0 sm:w-auto" @click="$emit('play-again')"><RotateCcw class="h-4 w-4" aria-hidden="true" />Preparar revanche</AppButton>
    </div>
    <div v-if="summary" class="gold-divider-top relative mt-5 grid gap-4 pt-5 sm:grid-cols-[1fr_auto] sm:items-end">
      <div class="space-y-2"><h4 class="font-serif text-sm font-semibold text-gold-light">Jogada decisiva</h4><p class="text-sm leading-relaxed text-ink-muted">{{ summary.decisivePlay }}</p><p class="text-sm font-semibold text-gold">{{ summary.supports }} {{ summary.supports === 1 ? 'apoio ativo' : 'apoios ativos' }} · C$ {{ summary.coins }}</p></div>
      <AppButton variant="outline" class="w-full sm:w-auto" :disabled="sharing" @click="share"><Share2 class="h-4 w-4" aria-hidden="true" />{{ sharing ? 'Gerando imagem…' : 'Compartilhar resultado' }}</AppButton>
    </div>
    <p v-if="feedback" class="mt-3 text-xs text-ink-muted" role="status">{{ feedback }}</p>
    <p v-if="gameState.discordResultStatus" class="mt-3 text-xs text-ink-subtle" role="status">{{ gameState.discordResultStatus === 'sent' ? 'Resultado publicado no canal de resultados do Discord.' : gameState.discordResultStatus === 'sending' ? 'Publicando resultado no Discord…' : 'O resultado está disponível aqui, mas não foi possível publicá-lo no Discord.' }}</p>
    <p v-if="winner && !isHost" class="mt-3 text-xs text-ink-subtle">O anfitrião pode preparar uma revanche nesta mesa.</p>
    <details v-if="finalEvents.length" class="mt-4"><summary class="cursor-pointer text-sm text-ink-muted">Ver sequência final</summary><div class="mt-4 space-y-2 border-t border-line pt-4">
      <h4 class="font-serif text-sm font-semibold text-gold-light">Como a partida terminou</h4>
      <ol class="space-y-2 pl-5 text-sm leading-relaxed text-ink-muted list-decimal">
        <li v-for="event in finalEvents" :key="event.id" class="break-words"><GameEventMessage :message="event.message" /></li>
      </ol>
    </div>
    </details>
    <p class="mt-4 text-xs text-ink-subtle">A mesa permanece disponível para consultar os gabinetes, as cartas reveladas e o histórico.</p>
  </div>
</template>

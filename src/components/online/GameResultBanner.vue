<script setup lang="ts">
import { computed, ref } from 'vue';
import { Trophy, RotateCcw, Share2, Clock } from 'lucide-vue-next';
import { buildResultSummary, durationLabel } from '@/game/resultSummary';
import { shareResult } from '@/utils/shareResult';
import { playerAvatar } from '@/utils/playerProfile';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import AppButton from '@/components/ui/AppButton.vue';
import GameEventMessage from './GameEventMessage.vue';
import type { GameState } from '@/game/models/gameState';

const props = defineProps<{ gameState: GameState; isHost?: boolean }>();
defineEmits<{ (event: 'play-again'): void }>();
const summary = computed(() => buildResultSummary(props.gameState));
const decisivePlay = computed(() => summary.value?.decisivePlay.replace(/^APOIO PERDIDO!\s*/i, '') ?? '');
const resultPanel = ref<HTMLElement | null>(null);
const sharing = ref(false);
const feedback = ref('');
async function share() {
  if (!summary.value || !resultPanel.value || sharing.value) return;
  sharing.value = true;
  try { feedback.value = await shareResult(summary.value, resultPanel.value); }
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
  <section ref="resultPanel" class="result-panel rounded border border-line bg-surface p-4 shadow-card sm:p-5" aria-label="Resultado da partida">
    <header class="gold-divider-bottom relative flex items-center justify-between gap-3 pb-3">
      <div class="flex min-w-0 items-center gap-2"><Trophy class="h-4 w-4 shrink-0 text-gold-light" aria-hidden="true" /><h2 class="game-section-title">Resultado da mesa</h2></div>
      <span class="shrink-0 text-xs tabular-nums text-gold-muted" :aria-label="`Mesa ${gameState.roomCode}`">{{ gameState.roomCode }}</span>
    </header>

    <div class="result-overview">
    <div class="result-winner" role="status">
      <img v-if="winner" :src="playerAvatar(winner)" alt="" class="result-avatar" width="64" height="64" />
      <div class="min-w-0">
        <p class="text-[11px] font-semibold uppercase tracking-widest text-gold-muted">{{ winner ? 'Vencedor da mesa' : 'Partida encerrada' }}</p>
        <h3 class="result-name font-serif font-bold text-gold-light">{{ winner ? winner.name : 'Sessão encerrada sem vencedor' }}</h3>
        <p v-if="winner" class="text-sm text-ink-muted">Conquistou o poder.</p>
      </div>
    </div>

      <dl v-if="summary" class="result-stats grid grid-cols-3 divide-x divide-line rounded-lg border border-line bg-paper/50 text-center">
        <div><dt class="text-[11px] text-ink-muted">Turnos</dt><dd class="font-serif text-xl font-semibold tabular-nums text-ink">{{ summary.turns }}</dd></div>
        <div><dt class="text-[11px] text-ink-muted">Apoios</dt><dd class="font-serif text-xl font-semibold tabular-nums text-ink">{{ summary.supports }}</dd></div>
        <div><dt class="text-[11px] text-ink-muted">Reserva</dt><dd class="font-serif text-xl font-semibold tabular-nums text-gold">C$ {{ summary.coins }}</dd></div>
      </dl>
    </div>
      <div v-if="summary" class="result-decision">
        <div class="mb-2 flex flex-wrap items-center justify-between gap-2">
          <h4 class="font-serif text-sm font-semibold text-gold-light">Jogada decisiva</h4>
          <span v-if="summary.durationSeconds !== null" class="inline-flex items-center gap-1.5 text-xs tabular-nums text-ink-subtle" :aria-label="`Duração: ${durationLabel(summary.durationSeconds)}`"><Clock class="h-3 w-3" aria-hidden="true" />{{ durationLabel(summary.durationSeconds) }}</span>
        </div>
        <p class="break-words text-sm leading-relaxed text-ink-muted">{{ decisivePlay }}</p>
      </div>

    <Accordion v-if="finalEvents.length" type="single" collapsible class="result-history" data-result-controls>
      <AccordionItem value="final-sequence" class="border-0 bg-transparent">
        <AccordionTrigger class="result-history-trigger text-xs text-ink-muted">Ver sequência final</AccordionTrigger>
        <AccordionContent class="px-0 pb-3 pt-3">
          <ol class="list-decimal space-y-2 pl-5 text-sm leading-relaxed text-ink-muted"><li v-for="event in finalEvents" :key="event.id" class="break-words"><GameEventMessage :message="event.message" /></li></ol>
        </AccordionContent>
      </AccordionItem>
    </Accordion>

    <footer v-if="summary || feedback" data-result-controls class="gold-divider-top relative pt-4">
      <div v-if="summary" class="flex items-stretch justify-end gap-2">
        <AppButton v-if="isHost && winner" class="min-w-0 flex-1 sm:flex-none sm:px-5" @click="$emit('play-again')"><RotateCcw class="h-4 w-4 shrink-0" aria-hidden="true" />Preparar revanche</AppButton>
        <AppButton variant="outline" :class="isHost ? 'w-11 shrink-0 px-0 sm:w-auto sm:px-4' : 'flex-1'" :disabled="sharing" :aria-label="sharing ? 'Gerando imagem' : 'Compartilhar resultado'" :title="sharing ? 'Gerando imagem' : 'Compartilhar resultado'" @click="share"><Share2 class="h-4 w-4 shrink-0" :class="{ 'animate-pulse motion-reduce:animate-none': sharing }" aria-hidden="true" /><span :class="{ 'sr-only sm:not-sr-only': isHost }">{{ sharing ? 'Gerando imagem…' : 'Compartilhar resultado' }}</span></AppButton>
      </div>
      <p v-if="feedback" class="mt-3 text-xs text-ink-muted" role="status">{{ feedback }}</p>
      <p v-if="gameState.discordResultStatus" class="mt-3 text-xs text-ink-subtle" role="status">{{ gameState.discordResultStatus === 'sent' ? 'Vitória registrada no Discord.' : gameState.discordResultStatus === 'sending' ? 'Registrando vitória no Discord…' : 'Não foi possível registrar no Discord. Você ainda pode compartilhar o resultado.' }}</p>
      <p v-if="winner && !isHost" class="mt-3 text-xs text-ink-subtle">A revanche pode ser preparada pelo anfitrião.</p>
    </footer>
  </section>
</template>

<style scoped>
.result-winner { display: flex; align-items: center; gap: 16px; padding-block: 24px; }
.result-avatar { width: 64px; height: 64px; aspect-ratio: 1; flex-shrink: 0; object-fit: cover; object-position: center 25%; border: 1px solid var(--gold); border-radius: var(--ui-radius); }
.result-name { margin-block: 3px; font-size: clamp(22px, 4vw, 30px); line-height: 1.2; overflow-wrap: anywhere; }
.result-stats > div { padding: 10px 6px; }
.result-stats dd { margin-top: 2px; line-height: 1.4; }
.result-decision { padding-top: 20px; }
@media (min-width: 768px) {
  .result-overview { display: grid; grid-template-columns: minmax(0, 1fr) minmax(260px, .85fr); align-items: center; gap: 32px; }
  .result-decision { padding-top: 0; }
}
.result-history { margin-top: 8px; margin-bottom: 8px; }
.result-history :deep(button.result-history-trigger) { padding: 10px 0; }
@media (min-width: 640px) {
  .result-winner { padding-block: 28px; }
  .result-avatar { width: 72px; height: 72px; }
}
</style>

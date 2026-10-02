<script setup lang="ts">
import { computed, ref } from 'vue';
import { RotateCcw, Share2 } from '@lucide/vue';
import { buildResultSummary } from '@/game/resultSummary';
import { shareResult } from '@/utils/shareResult';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import AppButton from '@/components/ui/AppButton.vue';
import { Spinner } from '@/components/ui/spinner';
import { toast } from '@/components/ui/sonner';
import GameEventMessage from './GameEventMessage.vue';
import GameResultSummary from '@/components/game/GameResultSummary.vue';
import type { GameState } from '@/game/models/gameState';

const props = defineProps<{ gameState: GameState; isHost?: boolean }>();
defineEmits<{ (event: 'play-again'): void }>();

const summary = computed(() => buildResultSummary(props.gameState));
const resultPanel = ref<HTMLElement | null>(null);
const storyPanelRef = ref<HTMLElement | null>(null);
const sharing = ref(false);

async function share(): Promise<void> {
  if (!summary.value || sharing.value) return;
  const targetElement = storyPanelRef.value ?? resultPanel.value;
  if (!targetElement) return;

  sharing.value = true;
  try {
    const message = await shareResult(summary.value, targetElement);
    if (message) {
      toast.success(message);
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Não foi possível gerar a imagem. Tente novamente.';
    toast.error(errorMsg);
  } finally {
    sharing.value = false;
  }
}

const winner = computed(() => props.gameState.players[props.gameState.winnerPlayerId ?? '']);
const finalEvents = computed(() => {
  const history = props.gameState.history;
  const boundary = history.findIndex(event => ['TURN_CHANGED', 'GAME_STARTED', 'ROOM_CREATED'].includes(event.type));
  return history
    .slice(0, boundary < 0 ? history.length : boundary)
    .filter(event => !['GAME_FINISHED', 'WINNER_SUPPORTS_AVAILABLE'].includes(event.type))
    .reverse();
});
</script>

<template>
  <section ref="resultPanel" class="result-panel rounded border border-line bg-surface p-4 shadow-card sm:p-5" aria-label="Resultado da partida">
    <!-- Componente de Resumo Final no Modo Short -->
    <GameResultSummary :game-state="gameState" :summary="summary" variant="short" />

    <!-- Sequência final de jogadas -->
    <Accordion v-if="finalEvents.length" type="single" collapsible class="result-history" data-result-controls>
      <AccordionItem value="final-sequence" class="border-line bg-paper/40">
        <AccordionTrigger class="result-history-trigger text-sm font-semibold text-gold-light">
          Ver sequência final
        </AccordionTrigger>
        <AccordionContent class="px-4 pb-4 pt-1 before:hidden">
          <ol class="list-decimal space-y-3 pl-5 text-sm leading-relaxed text-ink-muted">
            <li v-for="event in finalEvents" :key="event.id" class="break-words">
              <GameEventMessage :message="event.message" />
            </li>
          </ol>
        </AccordionContent>
      </AccordionItem>
    </Accordion>

    <!-- Controles do Rodapé -->
    <footer v-if="summary" data-result-controls class="gold-divider-top relative pt-4">
      <div v-if="summary" class="flex items-stretch justify-end gap-2">
        <AppButton v-if="isHost && winner" class="min-w-0 flex-1 sm:flex-none sm:px-5" @click="$emit('play-again')">
          <RotateCcw class="h-4 w-4 shrink-0" aria-hidden="true" />Preparar revanche
        </AppButton>
        <AppButton
          variant="outline"
          :class="isHost ? 'w-11 shrink-0 px-0 sm:w-auto sm:px-4' : 'flex-1'"
          :disabled="sharing"
          :aria-busy="sharing"
          :aria-label="sharing ? 'Gerando imagem' : 'Compartilhar resultado'"
          :title="sharing ? 'Gerando imagem' : 'Compartilhar resultado'"
          @click="share"
        >
          <Spinner v-if="sharing" size="sm" aria-hidden="true" />
          <Share2 v-else class="h-4 w-4 shrink-0" aria-hidden="true" />
          <span :class="{ 'sr-only sm:not-sr-only': isHost }">
            {{ sharing ? 'Gerando imagem…' : 'Compartilhar resultado' }}
          </span>
        </AppButton>
      </div>
      <p v-if="gameState.discordResultStatus" class="mt-3 text-xs text-ink-subtle" role="status">
        {{ gameState.discordResultStatus === 'sent' ? 'Vitória registrada no Discord.' : gameState.discordResultStatus === 'sending' ? 'Registrando vitória no Discord…' : 'Não foi possível registrar no Discord. Você ainda pode compartilhar o resultado.' }}
      </p>
      <p v-if="winner && !isHost" class="mt-3 text-xs text-ink-subtle">
        A revanche pode ser preparada pelo anfitrião.
      </p>
    </footer>

    <!-- Elemento oculto com o Resumo no formato Instagram Stories (16:9 vertical) para compartilhamento -->
    <div
      class="fixed -left-[99999px] top-0 pointer-events-none opacity-0"
      aria-hidden="true"
      inert
    >
      <div ref="storyPanelRef">
        <GameResultSummary :game-state="gameState" :summary="summary" variant="story" />
      </div>
    </div>
  </section>
</template>

<style scoped>
.result-history {
  margin-top: 20px;
  margin-bottom: 16px;
}
.result-history :deep(button.result-history-trigger) {
  padding: 14px 16px;
}
</style>

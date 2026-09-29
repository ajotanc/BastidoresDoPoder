<script setup lang="ts">
import dayjs from 'dayjs';
import { computed, ref, watch, nextTick } from 'vue';
import type { GameEvent } from '@/game/models/gameState';
import { Newspaper } from 'lucide-vue-next';
import GameEventMessage from './GameEventMessage.vue';

interface Props {
  history: readonly GameEvent[];
  isFinished?: boolean;
}

const props = defineProps<Props>();

const latestEvent = computed(() => {
  return props.history[0] || null;
});

const recentEvents = computed(() => {
  return props.history.slice(1);
});
const historyList = ref<HTMLElement | null>(null);
watch(() => props.history[0]?.id, async () => {
  await nextTick();
  if (historyList.value) historyList.value.scrollTop = 0;
});
</script>

<template>
  <section class="rounded border border-line bg-surface p-4 sm:p-5">
    <header class="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-line/40 pb-2.5">
      <div class="flex items-center gap-2">
        <Newspaper class="w-4 h-4 text-gold-light shrink-0" aria-hidden="true" />
        <h2 class="game-section-title">Plantão dos Bastidores</h2>
      </div>
      <span class="text-xs text-gold-muted" :class="{ 'live-indicator': !isFinished }">{{ isFinished ? 'Partida encerrada' : 'Ao vivo' }}</span>
    </header>
    <article
      v-if="latestEvent"
      class="border-l-2 py-3 pl-3 pr-2 transition-colors duration-200"
      :class="latestEvent.importance === 'breaking' ? 'border-status-red bg-status-red/10' : 'border-gold bg-gold/5'"
    >
      <div class="mb-2 flex flex-wrap items-center gap-2 text-xs">
        <span class="font-semibold" :class="latestEvent.importance === 'breaking' ? 'text-status-red' : 'text-gold'">{{ latestEvent.importance === 'breaking' ? 'Urgente' : 'Agora na mesa' }}</span>
        <time class="text-ink-subtle">{{ dayjs(latestEvent.timestamp).format('HH:mm') }}</time>
      </div>
      <p class="text-sm leading-relaxed text-ink"><GameEventMessage :message="latestEvent.message" /></p>
    </article>
    <p v-else class="text-sm text-ink-muted">As jogadas da mesa aparecerão aqui.</p>
    <div v-if="recentEvents.length" ref="historyList" class="news-history mt-4 max-h-64 overflow-y-auto pr-2">
      <ol class="space-y-3 border-l border-line pl-3">
        <li
          v-for="ev in recentEvents"
          :key="ev.id"
          class="space-y-1 border-b border-line/40 pb-3 last:border-b-0 last:pb-0"
        >
          <time class="block text-[11px] tabular-nums text-ink-subtle">{{ dayjs(ev.timestamp).format('HH:mm:ss') }}</time>
          <p class="text-sm leading-relaxed text-ink-muted"><GameEventMessage :message="ev.message" /></p>
        </li>
      </ol>
    </div>
  </section>
</template>

<style scoped>
.live-indicator {
  animation: live-pulse 2s ease-in-out infinite;
}
@keyframes live-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: .45; }
}
@media (prefers-reduced-motion: reduce) {
  .live-indicator { animation: none; }
}
</style>

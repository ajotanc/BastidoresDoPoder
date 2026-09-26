<script setup lang="ts">
import { computed } from 'vue';
import type { GameEvent } from '@/game/models/gameState';

interface Props {
  history: readonly GameEvent[];
}

const props = defineProps<Props>();

const latestEvent = computed(() => {
  return props.history[0] || null;
});

const recentEvents = computed(() => {
  return props.history.slice(1, 6);
});
</script>

<template>
  <div class="w-full bg-surface-elevated/90 border border-line-gold/40 rounded-xl overflow-hidden shadow-card backdrop-blur-sm">
    <!-- Cabeçalho do Plantão de Notícias -->
    <div class="px-4 py-2.5 bg-paper-deep border-b border-line-gold/30 flex items-center justify-between">
      <div class="flex items-center gap-2.5">
        <span class="relative flex h-2.5 w-2.5">
          <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-status-red opacity-75"></span>
          <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-status-red"></span>
        </span>
        <span class="font-serif font-bold text-xs uppercase tracking-wider text-gold-light">
          Plantão dos Bastidores
        </span>
      </div>
      <span class="text-[11px] text-ink-muted">
        Atualizações em tempo real
      </span>
    </div>

    <!-- Manchete Atual -->
    <div class="p-3.5 sm:p-4 bg-surface/60">
      <div v-if="latestEvent" class="flex items-start gap-3">
        <span
          class="shrink-0 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border"
          :class="[
            latestEvent.importance === 'breaking'
              ? 'bg-status-red-bg border-status-red text-status-red'
              : latestEvent.importance === 'alert'
              ? 'bg-gold/10 border-gold/40 text-gold-light'
              : 'bg-paper-deep border-line text-ink-subtle'
          ]"
        >
          {{ latestEvent.importance === 'breaking' ? 'URGENTE' : latestEvent.importance === 'alert' ? 'ALERTA' : 'INFORME' }}
        </span>
        <p class="text-sm font-medium text-ink leading-snug">
          {{ latestEvent.message }}
        </p>
      </div>
      <div v-else class="text-xs text-ink-muted text-center py-1">
        Aguardando abertura dos trabalhos...
      </div>
    </div>

    <!-- Histórico Recente de Notícias em Linhas Sutis -->
    <div v-if="recentEvents.length > 0" class="border-t border-line/50 px-4 py-2 bg-paper/40 divide-y divide-line/30 max-h-24 overflow-y-auto">
      <div
        v-for="ev in recentEvents"
        :key="ev.id"
        class="py-1 flex items-center justify-between text-xs text-ink-muted gap-2"
      >
        <span class="truncate">
          {{ ev.message }}
        </span>
        <span class="shrink-0 text-[10px] text-ink-subtle">
          {{ new Date(ev.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) }}
        </span>
      </div>
    </div>
  </div>
</template>

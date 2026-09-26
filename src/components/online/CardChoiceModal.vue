<script setup lang="ts">
import Card from '@/components/game/Card.vue';
import { ref, computed } from 'vue';
import type { SupportCard } from '@/game/models/gameState';
import { getRoleDisplayName } from '@/game/engine/gameEngine';
import { AlertTriangle } from 'lucide-vue-next';

interface Props {
  isOpen: boolean;
  mySupports: readonly SupportCard[];
  reason: string | null;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'choose', cardId: string): void;
}>();

const selectedCardId = ref<string>('');

const activeSupports = computed(() => {
  return props.mySupports.filter((c) => !c.isLost);
});

const handleConfirm = (): void => {
  if (selectedCardId.value) {
    emit('choose', selectedCardId.value);
  }
};
</script>

<template>
  <div
    v-if="isOpen && activeSupports.length > 0"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-paper-deep/85 backdrop-blur-md animate-fadeIn"
    role="dialog"
    aria-modal="true"
  >
    <div class="w-full max-w-lg bg-surface border border-status-red/50 rounded-2xl shadow-modal overflow-hidden flex flex-col">
      <!-- Cabeçalho de Alerta -->
      <div class="px-6 py-4 bg-status-red-bg border-b border-status-red/30 flex items-center gap-3">
        <AlertTriangle class="w-6 h-6 text-status-red shrink-0" aria-hidden="true" />
        <div>
          <h2 class="font-serif font-bold text-base text-status-red tracking-wide">
            Cassa de Apoio Político
          </h2>
          <p class="text-xs text-ink-muted">
            {{ reason || 'Selecione qual Apoio você deve sacrificar' }}
          </p>
        </div>
      </div>

      <!-- Seleção de Carta -->
      <div class="p-6 space-y-4">
        <p class="text-xs text-ink font-medium">
          Clique no Apoio que será revelado e descartado do seu gabinete:
        </p>

        <div class="grid grid-cols-2 gap-4">
          <button
            v-for="card in activeSupports"
            :key="card.id"
            type="button"
            @click="selectedCardId = card.id"
            class="group relative rounded-xl overflow-hidden border-2 transition-all p-2 flex flex-col items-center gap-2 bg-paper-deep"
            :class="[
              selectedCardId === card.id
                ? 'border-status-red shadow-lg ring-2 ring-status-red/40 bg-status-red-bg/20'
                : 'border-line hover:border-gold/50'
            ]"
          >
            <div class="w-full aspect-[2/3] rounded-lg overflow-hidden bg-surface-elevated flex items-center justify-center relative">
              <Card :role="card.roleSlug" />
            </div>
            <span class="text-xs font-serif font-bold text-ink text-center">
              {{ getRoleDisplayName(card.roleSlug) }}
            </span>
          </button>
        </div>
      </div>

      <!-- Rodapé com Confirmação -->
      <div class="px-6 py-4 bg-paper-deep border-t border-line/40 flex justify-end">
        <button
          type="button"
          :disabled="!selectedCardId"
          @click="handleConfirm"
          class="px-5 py-2.5 rounded-xl font-serif font-bold text-xs uppercase tracking-wider transition-all"
          :class="[
            selectedCardId
              ? 'bg-status-red hover:bg-status-red/90 text-paper-deep shadow-md'
              : 'bg-surface-elevated text-ink-subtle cursor-not-allowed border border-line'
          ]"
        >
          Confirmar Perda de Apoio
        </button>
      </div>
    </div>
  </div>
</template>

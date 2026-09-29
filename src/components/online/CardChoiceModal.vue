<script setup lang="ts">
import AppDialog from '@/components/ui/AppDialog.vue';
import Card from '@/components/game/Card.vue';
import { ref, computed, watch } from 'vue';
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
watch(() => props.isOpen, () => { selectedCardId.value = ''; });
</script>

<template>
  <AppDialog
    :is-open="isOpen && activeSupports.length > 0"
    aria-label="Escolher apoio para perder"
    max-width-class="max-w-xl"
  >
    <!-- Cabeçalho -->
    <template #header>
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-status-red/15 border border-status-red/40 flex items-center justify-center shrink-0 text-status-red">
          <AlertTriangle class="w-5 h-5" aria-hidden="true" />
        </div>
        <div class="min-w-0 break-words">
          <h2 class="font-serif font-bold text-base sm:text-lg text-gold-light tracking-wide">
            Escolha o Apoio Perdido
          </h2>
          <p class="text-xs text-status-red">
            {{ reason || 'Selecione qual Apoio você deve sacrificar' }}
          </p>
        </div>
      </div>
    </template>

    <!-- Seleção de Carta -->
    <div class="space-y-4">
      <p class="text-xs text-ink font-medium">
        Clique no Apoio que será revelado e descartado do seu gabinete:
      </p>

      <div class="grid grid-cols-2 items-start gap-3">
        <button
          v-for="card in activeSupports"
          :key="card.id"
          type="button"
          @click="selectedCardId = card.id"
          :aria-pressed="selectedCardId === card.id"
          :aria-label="`Selecionar ${getRoleDisplayName(card.roleSlug)} para perder`"
          class="relative block aspect-[2/3] w-full min-w-0 rounded border-0 bg-transparent p-0 cursor-pointer transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-paper-deep"
          :class="[
            selectedCardId === card.id
              ? 'ring-2 ring-status-red'
              : 'hover:ring-2 hover:ring-gold/50'
          ]"
        >
          <Card :role="card.roleSlug" />
        </button>
      </div>
    </div>

    <!-- Rodapé -->
    <template #footer>
      <div class="flex justify-end w-full">
        <button
          type="button"
          :disabled="!selectedCardId"
          @click="handleConfirm"
          class="w-full sm:w-auto min-h-11 px-6 rounded-lg font-sans font-bold text-sm tracking-normal transition-all border"
          :class="[
            selectedCardId
              ? 'bg-status-red hover:bg-status-red/90 text-paper-deep border-status-red shadow-md cursor-pointer'
              : 'bg-surface-elevated text-ink-subtle border-line cursor-not-allowed'
          ]"
        >
          Confirmar Perda de Apoio
        </button>
      </div>
    </template>
  </AppDialog>
</template>

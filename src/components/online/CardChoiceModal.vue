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
    max-width-class="max-w-lg"
  >
    <!-- Cabeçalho -->
    <template #header>
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-status-red/15 border border-status-red/40 flex items-center justify-center shrink-0 text-status-red">
          <AlertTriangle class="w-5 h-5" aria-hidden="true" />
        </div>
        <div>
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

      <div class="grid grid-cols-2 gap-4">
        <button
          v-for="card in activeSupports"
          :key="card.id"
          type="button"
          @click="selectedCardId = card.id"
          :aria-pressed="selectedCardId === card.id"
          class="group relative rounded-lg overflow-hidden border-2 transition-all p-3 flex flex-col items-center gap-3 bg-paper-deep cursor-pointer"
          :class="[
            selectedCardId === card.id
              ? 'border-status-red shadow-lg ring-2 ring-status-red/40 bg-status-red-bg/20'
              : 'border-line hover:border-gold/50'
          ]"
        >
          <div class="w-full aspect-[2/3] rounded overflow-hidden bg-surface-elevated flex items-center justify-center relative">
            <Card :role="card.roleSlug" />
          </div>
          <span class="text-xs font-serif font-bold text-ink text-center">
            {{ getRoleDisplayName(card.roleSlug) }}
          </span>
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
          class="min-h-11 px-6 rounded-lg font-sans font-bold text-sm tracking-normal transition-all border"
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

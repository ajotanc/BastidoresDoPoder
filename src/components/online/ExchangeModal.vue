<script setup lang="ts">
import Card from '@/components/game/Card.vue';
import { ref, computed } from 'vue';
import type { SupportCard } from '@/game/models/gameState';
import { getRoleDisplayName } from '@/game/engine/gameEngine';
import { RefreshCw } from 'lucide-vue-next';

interface Props {
  isOpen: boolean;
  mySupports: readonly SupportCard[];
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'choose-exchange', returnedCardIds: readonly [string, string]): void;
}>();

const selectedToReturn = ref<string[]>([]);

const activeSupports = computed(() => {
  return props.mySupports.filter((c) => !c.isLost);
});

const toggleSelect = (cardId: string): void => {
  if (selectedToReturn.value.includes(cardId)) {
    selectedToReturn.value = selectedToReturn.value.filter((id) => id !== cardId);
  } else {
    if (selectedToReturn.value.length < 2) {
      selectedToReturn.value.push(cardId);
    }
  }
};

const handleConfirm = (): void => {
  if (selectedToReturn.value.length === 2 && selectedToReturn.value[0] && selectedToReturn.value[1]) {
    emit('choose-exchange', [selectedToReturn.value[0], selectedToReturn.value[1]]);
    selectedToReturn.value = [];
  }
};
</script>

<template>
  <div
    v-if="isOpen && activeSupports.length >= 2"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-paper-deep/85 backdrop-blur-md animate-fadeIn"
    role="dialog"
    aria-modal="true"
  >
    <div class="w-full max-w-xl bg-surface border border-gold/50 rounded-2xl shadow-modal overflow-hidden flex flex-col">
      <!-- Cabeçalho -->
      <div class="px-6 py-4 bg-paper-deep border-b border-line-gold/30 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-gold/15 border border-gold/40 flex items-center justify-center shrink-0">
            <RefreshCw class="w-5 h-5 text-gold" aria-hidden="true" />
          </div>
          <div>
            <h2 class="font-serif font-bold text-base text-gold-light tracking-wide">
              Troca de Cartas — Marqueteira
            </h2>
            <p class="text-xs text-ink-muted">
              Você comprou 2 cartas do baralho. Selecione exatamente <strong>2 cartas para devolver</strong>.
            </p>
          </div>
        </div>
      </div>

      <!-- Conteúdo com as Cartas -->
      <div class="p-6 space-y-4">
        <p class="text-xs text-ink font-medium">
          Cartas selecionadas para devolução: <span class="font-bold text-gold">{{ selectedToReturn.length }} / 2</span>
        </p>

        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button
            v-for="card in activeSupports"
            :key="card.id"
            type="button"
            @click="toggleSelect(card.id)"
            class="group relative rounded-xl overflow-hidden border-2 transition-all p-2 flex flex-col items-center gap-2 bg-paper-deep"
            :class="[
              selectedToReturn.includes(card.id)
                ? 'border-gold shadow-lg ring-2 ring-gold/40 bg-gold/15'
                : 'border-line hover:border-gold/40'
            ]"
          >
            <div class="w-full aspect-[2/3] rounded-lg overflow-hidden bg-surface-elevated flex items-center justify-center relative">
              <Card :role="card.roleSlug" />
              <div
                v-if="selectedToReturn.includes(card.id)"
                class="absolute inset-0 bg-gold/30 flex items-center justify-center font-bold text-xs uppercase text-paper-deep font-serif"
              >
                Devolver
              </div>
            </div>
            <span class="text-xs font-serif font-bold text-ink text-center truncate w-full">
              {{ getRoleDisplayName(card.roleSlug) }}
            </span>
          </button>
        </div>
      </div>

      <!-- Rodapé -->
      <div class="px-6 py-4 bg-paper-deep border-t border-line/40 flex justify-end gap-3">
        <button
          type="button"
          :disabled="selectedToReturn.length !== 2"
          @click="handleConfirm"
          class="px-6 py-2.5 rounded-xl font-serif font-bold text-xs uppercase tracking-wider transition-all"
          :class="[
            selectedToReturn.length === 2
              ? 'bg-gold hover:bg-gold-light text-paper-deep shadow-md'
              : 'bg-surface-elevated text-ink-subtle cursor-not-allowed border border-line'
          ]"
        >
          Confirmar Devolução ao Baralho
        </button>
      </div>
    </div>
  </div>
</template>

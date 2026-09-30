<script setup lang="ts">
import AppDialog from '@/components/ui/AppDialog.vue';
import Card from '@/components/game/Card.vue';
import { ref, computed, watch } from 'vue';
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
watch(() => props.isOpen, () => { selectedToReturn.value = []; });
</script>

<template>
  <AppDialog
    :is-open="isOpen && activeSupports.length >= 2"
    aria-label="Escolher dois apoios para devolver"
    max-width-class="max-w-xl"
  >
    <!-- Cabeçalho -->
    <template #header>
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-gold/15 border border-gold/40 flex items-center justify-center shrink-0">
          <RefreshCw class="w-5 h-5 text-gold" aria-hidden="true" />
        </div>
        <div class="min-w-0 break-words">
          <h2 class="app-dialog-title">
            Troca de Cartas — Marqueteira
          </h2>
          <p class="text-xs text-ink-muted">
            Você comprou 2 cartas do baralho. Selecione exatamente <strong>2 cartas para devolver</strong>.
          </p>
        </div>
      </div>
    </template>

    <!-- Conteúdo com as Cartas -->
    <div class="space-y-4">
      <p class="text-xs text-ink font-medium">
        Cartas selecionadas para devolução: <span class="font-bold text-gold">{{ selectedToReturn.length }} / 2</span>
      </p>

      <div class="grid grid-cols-2 sm:grid-cols-4 items-start gap-3">
        <button
          v-for="card in activeSupports"
          :key="card.id"
          type="button"
          @click="toggleSelect(card.id)"
          :aria-pressed="selectedToReturn.includes(card.id)"
          :aria-label="`Selecionar ${getRoleDisplayName(card.roleSlug)} para devolver`"
          class="relative block aspect-[2/3] w-full min-w-0 rounded border-0 bg-transparent p-0 cursor-pointer transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-paper-deep"
          :class="[
            selectedToReturn.includes(card.id)
              ? 'ring-2 ring-gold'
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
          :disabled="selectedToReturn.length !== 2"
          @click="handleConfirm"
          class="online-primary w-full sm:w-auto border border-gold hover:border-gold-light px-6 cursor-pointer"
        >
          Confirmar Devolução ao Baralho
        </button>
      </div>
    </template>
  </AppDialog>
</template>

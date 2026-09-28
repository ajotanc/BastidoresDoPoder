<script setup lang="ts">
import { GAME_NAME } from "@/constants/gameConfig";
import { ref, watch, nextTick } from 'vue';
import { useLightbox } from '@/composables/useLightbox';
import AppDialog from '@/components/ui/AppDialog.vue';
import AppButton from '@/components/ui/AppButton.vue';
import { X, Printer, RotateCw } from 'lucide-vue-next';
import Card from '@/components/game/Card.vue';
import { SUPPORT_CARDS_LENGTH } from '@/constants/gameData';

const { isOpen, activeCard, closeCardLightbox } = useLightbox();

const isFlipped = ref<boolean>(false);
const isPrinting = ref(false);
const printRoot = ref<HTMLElement | null>(null);
const printCard = async (): Promise<void> => {
  isPrinting.value = true;
  await nextTick();
  try {
    await Promise.all(Array.from(printRoot.value?.querySelectorAll('img') ?? []).map(async image => {
      image.loading = 'eager';
      await image.decode().catch(() => undefined);
    }));
    await document.fonts?.ready;
    window.print();
  } finally {
    isPrinting.value = false;
  }
};

/**
 * Alterna a rotação 3D da carta entre frente e verso
 */
const toggleFlip = (): void => {
  isFlipped.value = !isFlipped.value;
};

// Sempre que o lightbox abre ou muda de carta, reseta para a frente
watch(
  () => activeCard.value,
  () => {
    isFlipped.value = false;
  }
);
</script>

<template>
  <AppDialog :is-open="isOpen && !!activeCard"
    :aria-label="activeCard ? `Carta ${activeCard.name}` : 'Visualizador de Carta'" :bg-image-src="activeCard?.characterSrc"
    max-width-class="max-w-2xl" @close="closeCardLightbox">
    <!-- Cabeçalho Fixo do Modal -->
    <template #header>
      <div v-if="activeCard" class="card-modal-header grid grid-cols-[40px_minmax(0,1fr)_44px] items-center gap-x-3 gap-y-3">
        <div class="flex h-10 w-10 items-center justify-center rounded border border-line-gold/50 bg-paper-deep p-1">
          <img :src="isFlipped ? '/images/bdp.webp' : activeCard.iconSrc || '/images/bdp.webp'" :alt="GAME_NAME" class="h-full w-full object-contain" />
        </div>
        <div class="min-w-0">
          <span class="block text-[11px] text-gold-muted">Visualização da carta</span>
          <h2 class="mt-0.5 break-words font-serif text-base font-bold leading-tight text-ink sm:text-xl">{{ isFlipped ? 'Verso' : activeCard.name }}</h2>
        </div>
        <button type="button" @click="closeCardLightbox" class="online-icon-button self-start" aria-label="Fechar visualização"><X class="h-5 w-5" aria-hidden="true" /></button>
        <div class="col-span-3 flex flex-wrap items-center justify-between gap-2 border-t border-line/60 pt-2 text-xs text-ink-muted">
          <span>{{ isFlipped ? 'Verso padrão' : activeCard.category }}</span>
          <span class="text-gold-light">{{ isFlipped ? `${SUPPORT_CARDS_LENGTH} cartas do baralho` : activeCard.copies }}</span>
        </div>
      </div>
    </template>

    <div v-if="activeCard" class="card-perspective flex flex-col items-center justify-center py-4 gap-4">
      <button
        type="button"
        @click="toggleFlip"
        class="card-3d-wrapper relative grid w-full max-w-[400px] cursor-pointer focus-visible:outline-none rounded bg-transparent border-0 p-0 select-none group/flip"
        :class="{ 'is-flipped': isFlipped }"
        :aria-pressed="isFlipped"
        :aria-label="isFlipped ? 'Verso da carta exibido. Clique para ver a frente.' : 'Frente da carta exibida. Clique para ver o verso.'"
        :title="isFlipped ? 'Clique para ver a frente' : 'Clique para ver o verso'"
      >
        <Card :card="activeCard" class="card-face [grid-area:1/1]" :aria-hidden="isFlipped" />
        <Card face-down class="card-face card-face-back [grid-area:1/1]" :aria-hidden="!isFlipped" />
      </button>


    </div>

    <!-- Rodapé Fixo Separado do Scroll com as Mesmas Cores e Estilo -->
    <template #footer>
      <div v-if="activeCard" class="card-modal-actions grid grid-cols-2 gap-2">
        <AppButton variant="secondary" size="sm" class="w-full" @click="toggleFlip">
          <RotateCw class="h-4 w-4 shrink-0" aria-hidden="true" /><span>{{ isFlipped ? 'Ver frente' : 'Ver verso' }}</span>
        </AppButton>
        <AppButton variant="gold" size="sm" class="w-full" :disabled="isPrinting" :aria-label="isFlipped ? 'Imprimir verso' : 'Imprimir / Salvar PDF'" @click="printCard">
          <Printer class="h-4 w-4 shrink-0" aria-hidden="true" /><span>Imprimir</span>
        </AppButton>
      </div>
    </template>
  </AppDialog>
  <Teleport to="body">
    <div v-if="isPrinting && activeCard" ref="printRoot" class="card-print-sheet">
      <Card :card="activeCard" :face-down="isFlipped" />
    </div>
  </Teleport>
</template>


<style>
.card-print-sheet { position: fixed; left: -10000px; top: 0; width: 80mm; }
@media print {
  body:has(.card-print-sheet) > :not(.card-print-sheet) { display: none !important; }
  .card-print-sheet { position: static; display: block !important; width: 80mm; margin: 0 auto; break-inside: avoid; }
}
</style>

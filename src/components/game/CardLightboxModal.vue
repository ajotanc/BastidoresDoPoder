<script setup lang="ts">
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
      <div v-if="activeCard" class="flex items-center justify-between gap-4">
        <!-- Lado Esquerdo: Ícone + Título + Tag + Metadados -->
        <div class="flex flex-1 items-center gap-3.5 min-w-0">
          <!-- Ícone / Brasão da Carta -->
          <div
            class="w-16 h-16 rounded-lg flex items-center justify-center bg-[#091017] border border-gold-dark/70 shadow-inner flex-shrink-0">
            <img v-if="!isFlipped && activeCard.iconSrc" :src="activeCard.iconSrc"
              :alt="`Símbolo de ${activeCard.name}`" class="w-full h-full p-2 object-contain" />
            <img v-else src="/images/bdp.webp" alt="Brasão Bastidores do Poder"
              class="w-full h-full p-2 object-contain" />
          </div>

          <!-- Informações e Tag Oficial -->
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-2.5 flex-wrap">
              <h2
                class="font-serif font-bold text-xl sm:text-2xl text-[#f7f0e2] tracking-tight leading-tight break-words">
                {{ isFlipped ? 'Verso' : activeCard.name }}
              </h2>

              <!-- Tag Refinada com Insígnia Governamental -->
              <span
                class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[0.68rem] uppercase font-bold tracking-[0.14em] border shadow-sm backdrop-blur-sm select-none max-w-full"
                :style="isFlipped
                  ? {
                    backgroundColor: '#e6bf7315',
                    borderColor: '#e6bf7360',
                    color: '#f5dcad'
                  }
                  : {
                    backgroundColor: activeCard.roleColor + '18',
                    borderColor: activeCard.roleColor + '60',
                    color: activeCard.roleColor
                  }
                  ">
                <span class="w-1.5 h-1.5 rounded-full flex-shrink-0 animate-pulse"
                  :style="{ backgroundColor: isFlipped ? '#e6bf73' : activeCard.roleColor }"></span>
                <span>{{ isFlipped ? 'Deck' : activeCard.kind }}</span>
              </span>
            </div>

            <!-- Metadados de Linha -->
            <div class="flex items-center gap-2 mt-1.5 text-xs text-ink-muted flex-wrap">
              <span>{{ isFlipped ? 'Padrão' : activeCard.category }}</span>
              <span class="w-1 h-1 rounded-full bg-gold-dark/60" aria-hidden="true"></span>
              <span class="text-gold-light/90">{{ isFlipped ? `${SUPPORT_CARDS_LENGTH} cartas do baralho` :
                activeCard.copies }}</span>
            </div>
          </div>
        </div>

        <!-- Lado Direito: Fechar -->
        <button type="button" @click="closeCardLightbox"
          class="p-2 rounded-lg text-ink-muted hover:text-gold-light hover:bg-surface-hover border border-transparent hover:border-line transition-all focus-visible:outline-none flex-shrink-0"
          aria-label="Fechar visualização">
          <X class="w-5 h-5" aria-hidden="true" />
        </button>
      </div>
    </template>

    <div v-if="activeCard" class="card-perspective flex flex-col items-center justify-center py-4 gap-4">
      <button
        type="button"
        @click="toggleFlip"
        class="card-3d-wrapper relative grid w-full max-w-[400px] cursor-pointer focus-visible:outline-none rounded-[18px] bg-transparent border-0 p-0 select-none group/flip"
        :class="{ 'is-flipped': isFlipped }"
        :aria-pressed="isFlipped"
        :aria-label="isFlipped ? 'Verso da carta exibido. Clique para ver a frente.' : 'Frente da carta exibida. Clique para ver o verso.'"
        :title="isFlipped ? 'Clique para ver a frente' : 'Clique para ver o verso'"
      >
        <Card :card="activeCard" class="card-face [grid-area:1/1]" :aria-hidden="isFlipped" />
        <Card face-down class="card-face card-face-back [grid-area:1/1]" :aria-hidden="!isFlipped" />
      </button>

      <div class="text-center">
        <button type="button" @click="toggleFlip" class="inline-flex items-center gap-1.5 text-xs text-gold-muted/80 bg-surface/90 px-3 py-1 rounded-md border border-line shadow-sm">
          <RotateCw class="w-3.5 h-3.5 text-gold" aria-hidden="true" />
          {{ isFlipped ? 'Frente' : 'Verso' }}
        </button>
      </div>
    </div>

    <!-- Rodapé Fixo Separado do Scroll com as Mesmas Cores e Estilo -->
    <template #footer>
      <div v-if="activeCard"
        class="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-ink-muted">
        <span>
          Layout gerado a partir das regras atuais.
        </span>
        <AppButton variant="gold" size="sm" :disabled="isPrinting" @click="printCard">
          <Printer class="w-3.5 h-3.5" aria-hidden="true" />
          <span>{{ isFlipped ? 'Imprimir verso' : 'Imprimir / Salvar PDF' }}</span>
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

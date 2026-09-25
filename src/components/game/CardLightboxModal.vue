<script setup lang="ts">
import { ref, watch } from 'vue';
import { useLightbox } from '@/composables/useLightbox';
import AppDialog from '@/components/ui/AppDialog.vue';
import AppButton from '@/components/ui/AppButton.vue';
import { X, Download, RotateCw } from 'lucide-vue-next';
import { SUPPORT_CARDS_LENGTH } from '@/constants/gameData';

const { isOpen, activeCard, closeCardLightbox } = useLightbox();

const isFlipped = ref<boolean>(false);

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
    :aria-label="activeCard ? `Carta ${activeCard.name}` : 'Visualizador de Carta'" :bg-image-src="activeCard?.previewSrc ?? activeCard?.imageSrc"
    max-width-class="max-w-xl" @close="closeCardLightbox">
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

    <!-- Conteúdo com Scroll Exclusivo: Área 3D da Carta com Flip -->
    <div v-if="activeCard" class="flex flex-col items-center justify-center py-2">
      <button type="button" class="flex w-full flex-col items-center gap-6 relative cursor-pointer select-none group/flip py-2 [perspective:1200px]" :aria-pressed="isFlipped" aria-label="Virar carta"
        @click="toggleFlip" :title="isFlipped ? 'Clique para ver a frente' : 'Clique para ver o verso'">
        <div
          class="relative w-full max-w-[320px] sm:max-w-[256px] aspect-[2/3] transition-transform duration-700 [transform-style:preserve-3d] shadow-2xl rounded-xl"
          :class="{ '[transform:rotateY(180deg)]': isFlipped }">
          <!-- Face Frontal (Frente da Carta) -->
          <div
            class="absolute inset-0 [backface-visibility:hidden] rounded-xl overflow-hidden border border-line-gold bg-[#0d1620] shadow-card flex items-center justify-center">
            <img :src="activeCard.previewSrc ?? activeCard.imageSrc" :alt="activeCard.imageAlt"
              class="w-full h-full object-cover pointer-events-none" />
          </div>

          <!-- Face Traseira (Verso da Carta) -->
          <div
            class="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)] rounded-xl overflow-hidden border border-gold-dark bg-[#0a111a] shadow-card flex items-center justify-center">
            <img src="/images/previews/back-card.webp" alt="Verso oficial das cartas de Bastidores do Poder"
              class="w-full h-full object-cover pointer-events-none" />
          </div>
        </div>

        <!-- Dica interativa para virar a carta -->
        <div class="text-center">
          <span
            class="inline-flex items-center gap-1.5 text-[0.75rem] text-gold-muted/80 bg-surface/90 px-3 py-1 rounded-md border border-line shadow-sm group-hover/flip:border-gold/60 transition-colors">
            <RotateCw class="w-3 h-3 text-gold" aria-hidden="true" />
            Clique na carta para virar em 3D
          </span>
        </div>
      </button>
    </div>

    <!-- Rodapé Fixo Separado do Scroll com as Mesmas Cores e Estilo -->
    <template #footer>
      <div v-if="activeCard"
        class="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-ink-muted">
        <span>
          {{ isFlipped ? 'Verso oficial para impressão e confecção' : 'Carta oficial em alta resolução' }}
        </span>
        <AppButton variant="gold" size="sm" :href="isFlipped ? '/images/cards/back-card.png' : activeCard.imageSrc"
          :download="isFlipped ? 'bastidores-do-poder-verso.png' : `bastidores-do-poder-${activeCard.slug}.png`">
          <Download class="w-3.5 h-3.5" aria-hidden="true" />
          <span>{{ isFlipped ? 'Baixar verso da carta' : 'Baixar esta carta' }}</span>
        </AppButton>
      </div>
    </template>
  </AppDialog>
</template>

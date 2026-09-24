<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue';
import { useLightbox } from '@/composables/useLightbox';
import AppButton from '@/components/ui/AppButton.vue';
import { X, Download } from 'lucide-vue-next';

const { isOpen, activeCard, closeCardLightbox } = useLightbox();

/**
 * Fecha o modal ao pressionar a tecla Escape
 */
const handleKeyDown = (event: KeyboardEvent): void => {
  if (event.key === 'Escape' && isOpen.value) {
    closeCardLightbox();
  }
};

onMounted(() => {
  if (typeof window !== 'undefined') {
    window.addEventListener('keydown', handleKeyDown);
  }
});

onUnmounted(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('keydown', handleKeyDown);
  }
});
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0 scale-95"
      enter-to-class="opacity-100 scale-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-95"
    >
      <div
        v-if="isOpen && activeCard"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md"
        role="dialog"
        aria-modal="true"
        :aria-label="`Carta ${activeCard.name}`"
        @click.self="closeCardLightbox"
      >
        <div
          class="relative w-full max-w-xl max-h-[92vh] flex flex-col rounded-xl overflow-hidden bg-surface-elevated border border-gold-dark shadow-modal"
          @click.stop
        >
          <!-- Cabeçalho do Modal -->
          <div
            class="flex items-center justify-between px-5 py-3.5 border-b border-line bg-surface"
          >
            <div>
              <h2 class="font-serif font-bold text-xl text-gold-light tracking-tight">
                {{ activeCard.name }}
              </h2>
              <span class="text-xs text-ink-muted">
                {{ activeCard.category }} · {{ activeCard.kind }}
              </span>
            </div>
            <button
              type="button"
              @click="closeCardLightbox"
              class="p-2 rounded-lg text-ink-muted hover:text-ink hover:bg-surface-hover transition-colors focus-visible:outline-none"
              aria-label="Fechar visualização"
            >
              <X class="w-5 h-5" aria-hidden="true" />
            </button>
          </div>

          <!-- Imagem da Carta Ampliada -->
          <div class="flex-1 overflow-auto p-4 sm:p-6 flex items-center justify-center bg-[#070d13]">
            <img
              :src="activeCard.imageSrc"
              :alt="activeCard.imageAlt"
              class="max-w-full max-h-[65vh] object-contain rounded-md shadow-2xl border border-line"
            />
          </div>

          <!-- Rodapé com Ação de Download -->
          <div
            class="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-3.5 border-t border-line bg-surface text-xs text-ink-muted"
          >
            <span>Carta em alta definição para impressão</span>
            <AppButton
              variant="gold"
              size="sm"
              :href="activeCard.imageSrc"
              :download="`bastidores-do-poder-${activeCard.slug}.png`"
            >
              <Download class="w-3.5 h-3.5" aria-hidden="true" />
              <span>Baixar esta carta</span>
            </AppButton>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

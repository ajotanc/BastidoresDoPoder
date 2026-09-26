<script setup lang="ts">
import Card from '@/components/game/Card.vue';
import type { RoleCard } from '@/types/game';
import { useLightbox } from '@/composables/useLightbox';
import { ZoomIn, BookOpen } from 'lucide-vue-next';

interface Props {
  card: RoleCard;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'show-rules', card: RoleCard): void;
}>();

const { openCardLightbox } = useLightbox();

/**
 * Notifica o componente pai para abrir o modal de regras da carta
 */
const handleShowRules = (): void => {
  emit('show-rules', props.card);
};
</script>

<template>
  <article
    :id="props.card.id"
    class="relative flex flex-col h-full rounded-xl overflow-hidden bg-surface-elevated/70 border border-line hover:border-gold-accent/70 transition-all duration-300 shadow-card hover:shadow-card-hover group"
    :style="{ '--role-color': props.card.roleColor }"
  >
    <!-- Cabeçalho do Card: Categoria e Cópias -->
    <div
      class="px-4 py-2.5 flex items-center justify-between text-xs tracking-wider uppercase font-semibold border-b border-line bg-surface/90 rounded-t-xl select-none"
      :style="{ color: props.card.roleColor }"
    >
      <span>{{ props.card.category }}</span>
      <span class="text-ink-muted lowercase first-letter:uppercase tracking-normal">
        {{ props.card.copies }}
      </span>
    </div>

    <!-- Conteúdo Principal do Card (Frente) -->
    <div class="p-4 sm:p-5 flex-1 flex flex-col justify-between">
      <div>
        <button
          type="button"
          @click="openCardLightbox(props.card)"
          class="relative block w-full rounded-sm overflow-hidden focus-visible:outline-none transition-transform duration-300 group-hover:-translate-y-1 shadow-md group/preview cursor-zoom-in"
          :aria-label="`Ampliar carta ${props.card.name}`"
        >
          <Card :card="props.card" />
          <div
            class="absolute inset-0 bg-paper/30 opacity-0 group-hover/preview:opacity-100 transition-opacity flex items-center justify-center pointer-events-none"
          >
            <span
              class="inline-flex items-center justify-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-semibold bg-surface-elevated/95 text-gold-light border border-gold-dark shadow-md text-center z-[30]"
            >
              <ZoomIn class="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
              <span>Ampliar Carta</span>
            </span>
          </div>
        </button>

        <!-- Nome com Ícone encima e Tag embaixo -->
        <div class="mt-4 mb-3 space-y-2">
          <div class="flex items-center gap-2.5">
            <img
              v-if="props.card.iconSrc"
              :src="props.card.iconSrc"
              :alt="`Ícone de ${props.card.name}`"
              class="w-7 h-7 object-contain flex-shrink-0"
            />
            <h3 class="font-serif font-bold text-2xl text-[#f3dfb7] tracking-tight leading-tight">
              {{ props.card.name }}
            </h3>
          </div>
        </div>

        <p class="text-xs sm:text-sm text-ink-muted leading-relaxed min-h-[80px]">
          {{ props.card.summary }}
        </p>
      </div>

      <!-- Botão para abrir o Modal de Regras integrado 100% à apresentação do card -->
      <div class="mt-auto border-t border-line/70 pt-3">
        <button
          type="button"
          @click="handleShowRules"
          class="w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg bg-surface hover:bg-[#15202b] border border-line hover:border-gold/70 text-ink hover:text-gold-light transition-all duration-200 shadow-sm hover:shadow-[0_2px_12px_rgba(230,191,115,0.12)] active:scale-[0.98] select-none focus-visible:outline-none group/rules"
          :aria-label="`Ver regras e habilidades de ${props.card.name}`"
        >
          <div class="flex items-center gap-2 min-w-0">
            <BookOpen
              class="w-4 h-4 text-gold-muted group-hover/rules:text-gold transition-colors flex-shrink-0"
              aria-hidden="true"
            />
            <span class="text-xs font-bold tracking-tight truncate text-[#ede8de] group-hover/rules:text-gold-light transition-colors">
              Regras e Habilidades
            </span>
          </div>

          <span
            class="px-2 py-0.5 rounded-md text-[0.68rem] font-bold tracking-wider bg-[#0a1118] text-gold-muted border border-line-subtle group-hover/rules:border-gold/60 group-hover/rules:text-gold-light group-hover/rules:bg-[#101a24] transition-all flex-shrink-0"
            title="Quantidade de regras e poderes deste personagem"
          >
            {{ props.card.rules.length }}
          </span>
        </button>
      </div>
    </div>
  </article>
</template>

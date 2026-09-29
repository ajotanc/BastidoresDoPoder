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
          class="rules-action flex w-full min-h-11 justify-between rounded border text-gold-light transition-colors group/rules"
          :aria-label="`Ver regras e habilidades de ${props.card.name}`"
        >
          <div class="flex items-center gap-3 min-w-0">
            <BookOpen
              class="w-4 h-4 text-gold-muted group-hover/rules:text-gold transition-colors flex-shrink-0"
              aria-hidden="true"
            />
            <span class="min-w-0 text-left leading-tight">
              <span class="block text-[10px] font-medium uppercase tracking-[0.1em] text-gold-muted">Regras e</span>
              <span class="block text-sm font-semibold text-gold-light">Habilidades</span>
            </span>
          </div>

          <span
            class="rules-count inline-flex h-6 w-6 aspect-square items-center justify-center text-xs leading-none font-bold tabular-nums text-gold-light border border-gold/30 transition-colors flex-shrink-0"
            title="Quantidade de regras e poderes deste personagem"
          >
            {{ props.card.rules.length }}
          </span>
        </button>
      </div>
    </div>
  </article>
</template>

<style scoped>
button.rules-action {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 12px;
  border-color: rgb(230 191 115 / 35%);
  background: linear-gradient(110deg, rgb(230 191 115 / 13%), rgb(230 191 115 / 3%));
  box-shadow: inset 0 1px 0 rgb(255 228 170 / 8%);
}
button.rules-action:hover {
  border-color: var(--gold);
  background-color: rgb(230 191 115 / 10%);
}
.rules-count {
  border-radius: calc(var(--ui-radius) / 2);
  background: rgb(8 15 22 / 60%);
}
</style>

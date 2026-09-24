<script setup lang="ts">
import { ref } from 'vue';
import type { RoleCard } from '@/types/game';
import { useLightbox } from '@/composables/useLightbox';
import AppBadge from '@/components/ui/AppBadge.vue';
import { ZoomIn, ChevronDown, ShieldCheck, Swords, Info } from 'lucide-vue-next';

interface Props {
  card: RoleCard;
}

const props = defineProps<Props>();
const { openCardLightbox } = useLightbox();

const isRulesOpen = ref<boolean>(false);

const toggleRules = (): void => {
  isRulesOpen.value = !isRulesOpen.value;
};
</script>

<template>
  <article
    :id="props.card.id"
    class="flex flex-col rounded-xl overflow-hidden bg-surface-elevated/70 border border-line hover:border-gold-accent/70 transition-all duration-300 shadow-card hover:shadow-card-hover group"
    :style="{ '--role-color': props.card.roleColor }"
  >
    <!-- Cabeçalho do Card: Categoria e Cópias -->
    <div
      class="px-4 py-2.5 flex items-center justify-between text-xs tracking-wider uppercase font-semibold border-b border-line bg-surface/90"
      :style="{ color: props.card.roleColor }"
    >
      <span>{{ props.card.category }}</span>
      <span class="text-ink-muted lowercase first-letter:uppercase tracking-normal">
        {{ props.card.copies }}
      </span>
    </div>

    <!-- Pré-visualização da Carta com Zoom -->
    <div class="p-4 sm:p-5 flex-1 flex flex-col">
      <button
        type="button"
        @click="openCardLightbox(props.card)"
        class="relative block w-full rounded-lg overflow-hidden border border-[#766343] bg-[#0d1720] shadow-md group/preview cursor-zoom-in focus-visible:outline-none transition-transform duration-300 group-hover:-translate-y-1"
        :aria-label="`Ampliar carta ${props.card.name}`"
      >
        <img
          :src="props.card.imageSrc"
          :alt="props.card.imageAlt"
          loading="lazy"
          class="w-full h-auto aspect-[2/3] object-cover transition-transform duration-300 group-hover/preview:scale-[1.02]"
        />
        <div
          class="absolute inset-0 bg-paper/30 opacity-0 group-hover/preview:opacity-100 transition-opacity flex items-center justify-center pointer-events-none"
        >
          <span
            class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-surface-elevated/95 text-gold-light border border-gold-dark shadow-md"
          >
            <ZoomIn class="w-3.5 h-3.5" aria-hidden="true" />
            Ampliar Carta
          </span>
        </div>
      </button>

      <!-- Nome e Função -->
      <div class="mt-4 mb-2 flex items-baseline justify-between gap-2">
        <h3 class="font-serif font-bold text-2xl text-[#f3dfb7] tracking-tight">
          {{ props.card.name }}
        </h3>
        <AppBadge
          variant="outline"
          :custom-color="props.card.roleColor"
          class="text-[0.7rem]"
        >
          {{ props.card.kind }}
        </AppBadge>
      </div>

      <p class="text-xs sm:text-sm text-ink-muted leading-relaxed mb-4">
        {{ props.card.summary }}
      </p>

      <!-- Regras e Poderes da Carta -->
      <div class="mt-auto border-t border-line/70 pt-3">
        <button
          type="button"
          @click="toggleRules"
          class="w-full flex items-center justify-between py-2 text-xs font-semibold text-ink-muted hover:text-gold-light transition-colors select-none focus-visible:outline-none"
          :aria-expanded="isRulesOpen"
        >
          <span>Regras e habilidades ({{ props.card.rules.length }})</span>
          <ChevronDown
            class="w-4 h-4 text-gold transition-transform duration-200"
            :class="{ 'rotate-180': isRulesOpen }"
            aria-hidden="true"
          />
        </button>

        <div v-show="isRulesOpen" class="space-y-2.5 pt-2 animate-fadeIn">
          <div
            v-for="(rule, idx) in props.card.rules"
            :key="idx"
            class="p-3 rounded bg-surface border-l-2 text-xs leading-relaxed"
            :style="{ borderLeftColor: props.card.roleColor }"
          >
            <div class="flex items-center gap-1.5 font-bold mb-1" :style="{ color: props.card.roleColor }">
              <Swords v-if="rule.type === 'action'" class="w-3 h-3" aria-hidden="true" />
              <ShieldCheck v-else-if="rule.type === 'defense'" class="w-3 h-3" aria-hidden="true" />
              <Info v-else class="w-3 h-3" aria-hidden="true" />
              <span>{{ rule.title }}</span>
            </div>
            <p class="text-ink-muted">
              {{ rule.description }}
            </p>
          </div>

          <div
            v-if="props.card.officialRuleNotice"
            class="p-2.5 rounded bg-surface/50 border border-line text-[0.75rem] text-ink-subtle italic"
          >
            {{ props.card.officialRuleNotice }}
          </div>
        </div>
      </div>
    </div>
  </article>
</template>

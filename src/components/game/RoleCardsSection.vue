<script setup lang="ts">
import { ref, computed } from 'vue';
import { ROLE_CARDS } from '@/constants/gameData';
import type { RoleCard } from '@/types/game';
import AppSectionHeader from '@/components/ui/AppSectionHeader.vue';
import RoleCardItem from '@/components/game/RoleCardItem.vue';
import RoleCardRulesModal from '@/components/game/RoleCardRulesModal.vue';
import { normalizeSearch } from '@/utils/search';
import { Search } from 'lucide-vue-next';

const searchQuery = ref<string>('');
const selectedCategory = ref<string>('all');
const selectedRulesCard = ref<RoleCard | null>(null);

/**
 * Abre o modal de regras da carta selecionada
 */
const openCardRules = (card: RoleCard): void => {
  selectedRulesCard.value = card;
};

/**
 * Fecha o modal de regras da carta
 */
const closeCardRules = (): void => {
  selectedRulesCard.value = null;
};

const filterCategories = [
  { id: 'all', label: `Todos (${ROLE_CARDS.length})` },
  { id: 'attack', label: 'Ataque & Eliminação' },
  { id: 'defense', label: 'Blindagem & Defesa' },
  { id: 'economy', label: 'Economia & Negociação' },
] as const;

const filteredCards = computed<readonly RoleCard[]>(() => {
  const query = normalizeSearch(searchQuery.value);

  return ROLE_CARDS.filter((card) => {
    // Filtro por texto
    const matchesQuery =
      !query ||
      normalizeSearch(card.name).includes(query) ||
      normalizeSearch(card.summary).includes(query) ||
      normalizeSearch(card.kind).includes(query) ||
      card.rules.some(
        (r) =>
          normalizeSearch(r.title).includes(query) ||
          normalizeSearch(r.description).includes(query)
      );

    if (!matchesQuery) return false;

    // Filtro por categoria
    if (selectedCategory.value === 'all') return true;
    if (selectedCategory.value === 'attack') {
      return ['colonel', 'executor', 'investigator'].includes(card.slug);
    }
    if (selectedCategory.value === 'defense') {
      return ['untouchable', 'lawyer'].includes(card.slug);
    }
    if (selectedCategory.value === 'economy') {
      return ['baron', 'marketer', 'coordinator'].includes(card.slug);
    }

    return true;
  });
});
</script>

<template>
  <section id="cards" class="pt-12 border-t border-line/70">
    <AppSectionHeader
      label="Cartas e guia de ajuda"
      title="Oito personagens. Um guia de mesa."
      description="Cada personagem possui sua própria identidade e poderes secretos. Toque na carta para ampliar e abra as regras para consultar os detalhes. A nona carta é o Guia de Mesa e não entra no baralho de apoio."
    />

    <!-- Controles de filtro e busca -->
    <div class="mb-8 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
      <div class="flex items-center gap-1.5 overflow-x-auto pb-1">
        <button
          v-for="cat in filterCategories"
          :key="cat.id"
          type="button"
          @click="selectedCategory = cat.id"
          :aria-pressed="selectedCategory === cat.id"
          :class="[
            'px-3 py-1.5 rounded-md text-xs font-semibold transition-all whitespace-nowrap',
            selectedCategory === cat.id
              ? 'bg-gold text-surface-elevated shadow-sm'
              : 'bg-surface hover:bg-surface-hover text-ink-muted border border-line'
          ]"
        >
          {{ cat.label }}
        </button>
      </div>

      <div class="relative w-full sm:w-72">
        <Search
          class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted/70 pointer-events-none"
          aria-hidden="true"
        />
        <input
          v-model="searchQuery"
          type="search"
          aria-label="Buscar personagem ou poder"
          placeholder="Buscar personagem ou poder..."
          class="w-full bg-surface border border-line rounded-lg pl-9 pr-3 py-1.5 text-xs sm:text-sm text-ink placeholder:text-ink-muted/60 focus:border-gold focus:outline-none transition-colors"
        />
      </div>
    </div>

    <!-- Grid de Cartas -->
    <div
      v-if="filteredCards.length > 0"
      class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
    >
      <RoleCardItem
        v-for="card in filteredCards"
        :key="card.id"
        :card="card"
        @show-rules="openCardRules"
      />
    </div>

    <div
      v-else
      class="p-12 text-center bg-surface border border-line rounded-lg text-ink-muted"
    >
      Nenhuma carta encontrada para a busca "{{ searchQuery }}".
    </div>

    <!-- Modal de Regras e Habilidades com o mesmo Overlay padronizado do Lightbox -->
    <RoleCardRulesModal
      :card="selectedRulesCard"
      :is-open="!!selectedRulesCard"
      @close="closeCardRules"
    />
  </section>
</template>

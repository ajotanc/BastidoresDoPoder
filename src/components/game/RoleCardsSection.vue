<script setup lang="ts">
import { ref, computed } from 'vue';
import { ROLE_CARDS } from '@/constants/gameData';
import type { RoleCard } from '@/types/game';
import AppSectionHeader from '@/components/ui/AppSectionHeader.vue';
import RoleCardItem from '@/components/game/RoleCardItem.vue';
import { Search } from 'lucide-vue-next';

const searchQuery = ref<string>('');
const selectedCategory = ref<string>('all');

const filterCategories = [
  { id: 'all', label: 'Todos (8)' },
  { id: 'attack', label: 'Ataque & Eliminação' },
  { id: 'defense', label: 'Blindagem & Defesa' },
  { id: 'economy', label: 'Economia & Troca' },
] as const;

const filteredCards = computed<readonly RoleCard[]>(() => {
  const query = searchQuery.value.trim().toLowerCase();

  return ROLE_CARDS.filter((card) => {
    // Filtro por texto
    const matchesQuery =
      !query ||
      card.name.toLowerCase().includes(query) ||
      card.summary.toLowerCase().includes(query) ||
      card.kind.toLowerCase().includes(query) ||
      card.rules.some(
        (r) =>
          r.title.toLowerCase().includes(query) ||
          r.description.toLowerCase().includes(query)
      );

    if (!matchesQuery) return false;

    // Filtro por categoria
    if (selectedCategory.value === 'all') return true;
    if (selectedCategory.value === 'attack') {
      return ['coronel', 'executor', 'investigador'].includes(card.slug);
    }
    if (selectedCategory.value === 'defense') {
      return ['intocavel', 'advogado'].includes(card.slug);
    }
    if (selectedCategory.value === 'economy') {
      return ['barao', 'marqueteiro'].includes(card.slug);
    }

    return true;
  });
});
</script>

<template>
  <section id="personagens" class="scroll-mt-24 pt-12">
    <AppSectionHeader
      label="01 / Cartas e guia de ajuda"
      title="Sete personagens. Um guia de mesa."
      description="Cada personagem possui sua própria identidade e poderes secretos. Toque na carta para ampliar e abra as regras para consultar os detalhes. A oitava carta é o Guia de Mesa e não entra no baralho de influência."
    />

    <!-- Controles de filtro e busca -->
    <div class="mb-8 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
      <div class="flex items-center gap-1.5 overflow-x-auto pb-1">
        <button
          v-for="cat in filterCategories"
          :key="cat.id"
          type="button"
          @click="selectedCategory = cat.id"
          :class="[
            'px-3 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap',
            selectedCategory === cat.id
              ? 'bg-gold text-surface-elevated shadow-sm'
              : 'bg-surface text-ink-muted hover:text-gold-light border border-line hover:border-gold-dark',
          ]"
        >
          {{ cat.label }}
        </button>
      </div>

      <div class="relative w-full sm:w-64">
        <Search
          class="w-4 h-4 text-ink-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
          aria-hidden="true"
        />
        <input
          v-model="searchQuery"
          type="search"
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
      />
    </div>

    <div
      v-else
      class="p-12 text-center bg-surface border border-line rounded-lg text-ink-muted"
    >
      Nenhuma carta encontrada para a busca "{{ searchQuery }}".
    </div>
  </section>
</template>

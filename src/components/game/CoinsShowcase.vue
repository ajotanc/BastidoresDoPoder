<script setup lang="ts">
import { GAME_COINS } from '@/constants/gameData';
import { useCoinLightbox } from '@/composables/useCoinLightbox';
import CoinBadge from '@/components/game/CoinBadge.vue';
import { ZoomIn } from 'lucide-vue-next';

const { openCoinLightbox } = useCoinLightbox();
</script>

<template>
  <div class="my-8 p-5 sm:p-6 rounded-lg bg-surface-elevated/70 border border-line">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
      <div>
        <h3 class="font-serif text-lg sm:text-xl font-bold text-gold-light tracking-tight">
          Moedas Oficiais · Contos (C$)
        </h3>
        <p class="text-xs sm:text-sm text-ink-muted leading-relaxed mb-0">
          A moeda que financia golpes e alianças nos bastidores. Clique em qualquer moeda para examiná-la em alta resolução:
        </p>
      </div>
    </div>

    <!-- Grid das 3 Moedas com o padrão de tags e borders do sistema -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
      <button
        v-for="coin in GAME_COINS"
        :key="coin.id"
        type="button"
        @click="openCoinLightbox(coin)"
        class="group/coin flex items-center gap-3.5 p-3.5 rounded-md bg-surface/90 border border-line hover:border-gold-dark/70 text-left transition-all duration-200 cursor-pointer shadow-sm hover:shadow-card focus-visible:outline-none"
        :aria-label="`Ver ${coin.name} em alta resolução`"
      >
        <!-- Miniatura em container com rounded-md (padrão do sistema, sem rounded-full) -->
        <div
          class="w-12 h-12 flex-shrink-0 flex items-center justify-center rounded-md bg-surface-elevated border border-line p-1 group-hover/coin:scale-105 transition-transform duration-200"
          :style="{ borderColor: coin.color + '40' }"
        >
          <img
            :src="coin.imageSrc"
            :alt="coin.imageAlt"
            class="w-full h-full object-contain drop-shadow pointer-events-none select-none"
          />
        </div>

        <!-- Conteúdo com Tag Oficial e Detalhes -->
        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-2 mb-1">
            <CoinBadge :slug="coin.slug" size="sm" :clickable="false" />
            <span class="text-[11px] text-ink-muted">· {{ coin.material }}</span>
          </div>

          <strong class="block text-xs sm:text-sm text-ink font-semibold group-hover/coin:text-gold transition-colors truncate">
            {{ coin.name }}
          </strong>

          <span class="inline-flex items-center gap-1 text-[11px] text-ink-muted group-hover/coin:text-gold-light transition-colors mt-0.5">
            <ZoomIn class="w-3 h-3 flex-shrink-0 opacity-70" aria-hidden="true" />
            <span>Ver em alta resolução</span>
          </span>
        </div>
      </button>
    </div>
  </div>
</template>

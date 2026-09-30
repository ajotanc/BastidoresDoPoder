<script setup lang="ts">
import { MIN_PLAYERS_TO_START, MAX_PLAYERS_PER_ROOM } from "@/constants/gameConfig";
import { GAME_NAME } from "@/constants/gameConfig";
import dayjs from 'dayjs';
import { scrollToSection } from '@/utils/navigation';
import { APP_VERSION } from '@/constants/appVersion';
const currentYear = dayjs().year();

/**
 * Rola suavemente até o topo sem expor #manual na URL
 */
const handleBackToTop = (event: MouseEvent): void => {
  scrollToSection('home', event);
};
</script>

<template>
  <footer class="gold-divider-top relative pt-8 pb-12 mt-16 text-sm text-ink-muted text-center sm:text-left"
    role="contentinfo">
    <div class="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-6">
      <div class="space-y-1">
        <div class="flex items-center justify-center sm:justify-start gap-2.5">
          <img src="/images/bdp.webp" :alt="`Logo ${GAME_NAME}`" class="w-7 h-7 object-contain rounded" />
          <p class="font-serif font-bold text-gold-light text-base">
            {{ GAME_NAME }} <span class="font-sans font-normal text-xs text-ink-muted">· Manual v{{ APP_VERSION }}
              para testes</span>
          </p>
        </div>
        <p class="text-xs text-ink-muted max-w-xl">
          Jogo de blefe e disputa política brasileira para {{ MIN_PLAYERS_TO_START }} a {{ MAX_PLAYERS_PER_ROOM }} jogadores. Este manual apresenta as regras do protótipo, sujeitas a ajustes após testes de equilíbrio.
        </p>
      </div>

      <div class="flex shrink-0 flex-wrap items-center justify-center gap-4 text-xs">
        <span class="whitespace-nowrap"><a href="https://www.instagram.com/ajotanc/" target="_blank" rel="noopener noreferrer" class="font-semibold text-gold hover:text-gold-light hover:underline transition-colors" aria-label="AJOTA no Instagram (abre em nova aba)">AJOTA</a> © {{ currentYear }}</span>
        <a href="#home" @click="handleBackToTop"
          class="text-gold hover:text-gold-light hover:underline transition-colors">
          Voltar ao topo ↑
        </a>
      </div>
    </div>
  </footer>
</template>

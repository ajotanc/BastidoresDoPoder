<script setup lang="ts">
import { Shield } from 'lucide-vue-next';
import { scrollToSection } from '@/utils/navigation';
import { APP_VERSION } from '@/constants/appVersion';

/**
 * Rola suavemente até o topo sem expor #manual na URL
 */
const handleBackToTop = (event: MouseEvent): void => {
  scrollToSection('manual', event);
};
</script>

<template>
  <footer class="border-t border-line-gold/70 pt-8 pb-12 mt-16 text-sm text-ink-muted text-center sm:text-left"
    role="contentinfo">
    <div class="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-6">
      <div class="space-y-1">
        <div class="flex items-center justify-center sm:justify-start gap-2.5">
          <img src="/images/bdp.webp" alt="Logo Bastidores do Poder" class="w-7 h-7 object-contain rounded" />
          <p class="font-serif font-bold text-gold-light text-base">
            Bastidores do Poder <span class="font-sans font-normal text-xs text-ink-muted">· Manual v{{ APP_VERSION }}
              para testes</span>
          </p>
        </div>
        <p class="text-xs text-ink-muted max-w-xl">
          Jogo de blefe e disputa política brasileira para 3 a 8 jogadores. Este manual apresenta as regras do protótipo, sujeitas a ajustes após testes de equilíbrio.
        </p>
      </div>

      <div class="flex items-center gap-4 text-xs">
        <span
          class="inline-flex items-center gap-1.5 text-gold-muted border border-line px-2.5 py-1 rounded bg-surface">
          <Shield class="w-3.5 h-3.5 text-gold" aria-hidden="true" />
          Protótipo Ativo
        </span>
        <a href="#manual" @click="handleBackToTop"
          class="text-gold hover:text-gold-light hover:underline transition-colors">
          Voltar ao topo ↑
        </a>
      </div>
    </div>
  </footer>
</template>

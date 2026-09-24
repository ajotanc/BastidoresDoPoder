<script setup lang="ts">
import { NAVIGATION_SECTIONS } from '@/constants/gameData';
import { usePwaInstall } from '@/composables/usePwaInstall';
import { Download, Printer } from 'lucide-vue-next';

interface Props {
  activeSectionId: string;
}

const props = defineProps<Props>();
const { isInstallable, installApp } = usePwaInstall();

/**
 * Dispara a impressão nativa da página formatada para manual físico
 */
const triggerPrint = (): void => {
  if (typeof window !== 'undefined') {
    window.print();
  }
};
</script>

<template>
  <header
    class="sticky top-0 z-40 bg-[#0a111af2] backdrop-blur-md border-b border-line-gold px-4 sm:px-8 py-3.5 transition-all"
    role="banner"
  >
    <div class="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
      <!-- Marca do Jogo -->
      <a
        href="#manual"
        class="flex items-center gap-3 group text-decoration-none focus-visible:outline-none"
        aria-label="Bastidores do Poder, início do manual"
      >
        <span
          class="inline-flex items-center justify-center w-9 h-11 border border-gold-dark rounded font-serif font-bold text-xl text-gold shadow-[inset_0_0_0_3px_#0b1119,inset_0_0_0_4px_#514733] transition-transform group-hover:scale-105"
          aria-hidden="true"
        >
          B
        </span>
        <div class="leading-tight">
          <span class="block font-serif font-bold text-lg text-gold-light tracking-tight">
            Bastidores
          </span>
          <span class="block text-xs uppercase tracking-wider text-gold-muted font-semibold">
            do Poder
          </span>
        </div>
      </a>

      <!-- Navegação das seções do manual -->
      <nav
        aria-label="Índice do manual"
        class="flex items-center gap-1 overflow-x-auto py-1 scrollbar-thin max-w-full"
      >
        <a
          v-for="item in NAVIGATION_SECTIONS"
          :key="item.id"
          :href="`#${item.id}`"
          :class="[
            'flex items-center gap-1.5 px-3 py-1.5 rounded text-xs sm:text-sm font-medium transition-all whitespace-nowrap',
            props.activeSectionId === item.id
              ? 'text-gold-light bg-[#1e252b] border border-gold-dark/60 font-semibold'
              : 'text-ink-muted hover:text-gold-light hover:bg-[#151e27] border border-transparent',
          ]"
          :aria-current="props.activeSectionId === item.id ? 'location' : undefined"
        >
          <span class="text-[0.7rem] text-gold-muted font-serif" aria-hidden="true">
            {{ item.number }}
          </span>
          <span>{{ item.label }}</span>
        </a>
      </nav>

      <!-- Ações rápidas: PWA e Impressão -->
      <div class="flex items-center gap-2">
        <button
          v-if="isInstallable"
          type="button"
          @click="installApp"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold bg-gold text-surface-elevated hover:bg-gold-light transition-all shadow-sm"
          title="Instalar manual no dispositivo para jogar offline"
        >
          <Download class="w-3.5 h-3.5" aria-hidden="true" />
          <span>Instalar App</span>
        </button>

        <button
          type="button"
          @click="triggerPrint"
          class="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs text-ink-muted hover:text-gold-light hover:bg-surface-elevated border border-line transition-all"
          title="Imprimir ou salvar manual em PDF"
        >
          <Printer class="w-3.5 h-3.5" aria-hidden="true" />
          <span class="hidden sm:inline">Imprimir</span>
        </button>
      </div>
    </div>
  </header>
</template>

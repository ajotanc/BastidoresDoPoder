<script setup lang="ts">
import { NAVIGATION_SECTIONS } from '@/constants/gameData';
import { usePwaInstall } from '@/composables/usePwaInstall';
import { scrollToSection } from '@/utils/navigation';
import { Download } from 'lucide-vue-next';

interface Props {
  activeSectionId: string;
}

const props = defineProps<Props>();
const { isInstallable, installApp } = usePwaInstall();

/**
 * Realiza a rolagem suave até a seção sem expor o hash na barra de endereços
 */
const handleNavigate = (sectionId: string, event: MouseEvent): void => {
  scrollToSection(sectionId, event);
};
</script>

<template>
  <header
    class="sticky top-0 z-30 bg-[#0a111af2] backdrop-blur-md border-b border-line-gold px-4 sm:px-8 py-3.5 transition-all"
    role="banner">
    <div class="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
      <!-- Marca do Jogo com Logo Oficial -->
      <a href="#manual" @click="handleNavigate('manual', $event)" class="flex items-center gap-3 group text-decoration-none focus-visible:outline-none"
        aria-label="Bastidores do Poder, início do manual">
        <img src="/images/logo.png" alt="Logo Bastidores do Poder"
          class="w-10 h-10 object-contain rounded-md shadow-sm transition-transform duration-200 group-hover:scale-105" />
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
      <nav aria-label="Índice do manual" class="flex items-center gap-1 overflow-x-auto py-1 scrollbar-thin max-w-full">
        <a v-for="item in NAVIGATION_SECTIONS" :key="item.id" :href="`#${item.id}`" @click="handleNavigate(item.id, $event)" :class="[
          'flex items-center gap-1.5 px-3 py-1.5 rounded text-xs sm:text-sm font-medium transition-all whitespace-nowrap',
          props.activeSectionId === item.id
            ? 'text-gold-light bg-[#1e252b] border border-gold-dark/60 font-semibold'
            : 'text-ink-muted hover:text-gold-light hover:bg-[#151e27] border border-transparent',
        ]" :aria-current="props.activeSectionId === item.id ? 'location' : undefined">
          <span>{{ item.label }}</span>
        </a>
      </nav>

      <!-- Ações rápidas: PWA e Impressão -->
      <div class="flex items-center gap-2">
        <button v-if="isInstallable" type="button" @click="installApp"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold bg-gold text-surface-elevated hover:bg-gold-light transition-all shadow-sm"
          title="Instalar manual no dispositivo para jogar offline">
          <Download class="w-3.5 h-3.5" aria-hidden="true" />
          <span>Instalar App</span>
        </button>
      </div>
    </div>
  </header>
</template>

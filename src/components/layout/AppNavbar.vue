<script setup lang="ts">
import AppButton from '@/components/ui/AppButton.vue';
import { GAME_NAME, GAME_NAME_FIRST_LINE, GAME_NAME_SECOND_LINE } from "@/constants/gameConfig";
import { ref, watch } from 'vue';
import { NAVIGATION_SECTIONS } from '@/constants/gameData';
import { usePwaInstall } from '@/composables/usePwaInstall';
import { scrollToSection } from '@/utils/navigation';
import { Download, BookOpen, Menu, X, ArrowUpRight, ChevronRight } from '@lucide/vue';
const props = withDefaults(defineProps<{ activeSectionId: string; isOnlineActive?: boolean }>(), { isOnlineActive: false });
const emit = defineEmits<{ (e: 'navigate', sectionId: string): void; (e: 'toggle-online'): void }>();
const { isInstallable, installApp } = usePwaInstall();
const menuOpen = ref(false);
const menuButton = ref<HTMLElement | null>(null);
watch(() => props.isOnlineActive, () => { menuOpen.value = false; });
const handleNavigate = (sectionId: string, event: MouseEvent): void => {
  if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
  menuOpen.value = false;
  emit('navigate', sectionId);
  if (!props.isOnlineActive) scrollToSection(sectionId, event);
  else event.preventDefault();
};
const toggleOnline = () => { menuOpen.value = false; emit('toggle-online'); };
const closeMenu = () => { if (menuOpen.value) { menuOpen.value = false; menuButton.value?.focus(); } };
</script>

<template>
  <header class="app-nav gold-divider-bottom sticky top-0 z-30 bg-paper/95 backdrop-blur-xl" @keydown.esc="closeMenu">
    <div class="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-2 px-3 sm:px-6">
      <a href="#home" @click="handleNavigate('home', $event)" class="flex min-w-0 items-center gap-1.5 sm:gap-2" :aria-label="`${GAME_NAME}, início do manual`">
        <img src="/images/bdp.webp" alt="" class="h-8 w-7 object-contain" />
        <span class="min-w-0 leading-tight"><span class="block truncate font-serif font-bold text-gold-light">{{ GAME_NAME_FIRST_LINE }}</span><span class="block text-[10px] uppercase tracking-[.12em] text-gold-muted sm:tracking-[.16em]">{{ GAME_NAME_SECOND_LINE }}</span></span>
      </a>
      <nav v-if="!isOnlineActive" aria-label="Índice do manual" class="hidden min-w-0 items-center gap-1 overflow-x-auto lg:flex">
        <a v-for="item in NAVIGATION_SECTIONS" :key="item.id" :href="`#${item.id}`" @click="handleNavigate(item.id, $event)" :aria-current="activeSectionId === item.id ? 'location' : undefined" class="rounded-lg px-3 py-3 text-xs whitespace-nowrap hover:bg-surface-elevated" :class="activeSectionId === item.id ? 'text-gold bg-gold/10' : 'text-ink-muted'">{{ item.label }}</a>
      </nav>
      <div class="flex shrink-0 items-center gap-1.5">
        <AppButton :variant="isOnlineActive ? 'outline' : 'gold'" class="nav-action text-xs font-semibold" @click="toggleOnline">
          <BookOpen v-if="isOnlineActive" class="h-4 w-4" aria-hidden="true" /><ArrowUpRight v-else class="h-4 w-4" aria-hidden="true" />
          <span>{{ isOnlineActive ? 'Ver regras' : 'Jogar online' }}</span>
        </AppButton>
        <AppButton variant="outline" class="hidden text-xs font-semibold sm:flex" v-if="isInstallable" @click="installApp"><Download class="h-4 w-4" aria-hidden="true" />Instalar App</AppButton>
        <button ref="menuButton" type="button" class="flex h-11 w-11 items-center justify-center rounded-lg border border-line-gold text-gold-light hover:border-gold hover:bg-gold/10 hover:text-gold transition-colors duration-150 lg:hidden" :aria-expanded="menuOpen" aria-controls="mobile-navigation" :aria-label="menuOpen ? 'Fechar menu' : 'Abrir menu'" @click="menuOpen = !menuOpen"><X v-if="menuOpen" class="h-5 w-5" aria-hidden="true" /><Menu v-else class="h-5 w-5" aria-hidden="true" /></button>
      </div>
    </div>
    <div v-if="menuOpen" class="fixed inset-0 top-16 bg-black/30 lg:hidden" aria-hidden="true" @click="closeMenu"></div>
    <nav v-if="menuOpen" id="mobile-navigation" aria-label="Menu mobile" class="gold-divider-bottom absolute z-10 inset-x-0 top-full bg-paper shadow-modal max-h-[75dvh] overflow-y-auto border-t border-line-gold/40 px-3.5 py-4 lg:hidden">
      <div class="flex items-center justify-between border-b border-line-gold/30 px-1 pb-3 mb-3">
        <h2 class="game-section-title text-base">Manual de Regras</h2>
        <span class="text-[10px] font-sans font-semibold uppercase tracking-wider text-gold-muted">Capítulos</span>
      </div>
      <div class="grid grid-cols-2 gap-1.5 sm:gap-2">
        <a
          v-for="(item, index) in NAVIGATION_SECTIONS"
          :key="item.id"
          :href="`#${item.id}`"
          @click="handleNavigate(item.id, $event)"
          :aria-current="activeSectionId === item.id ? 'location' : undefined"
          class="group flex min-h-12 items-center justify-between rounded-lg border px-3 py-2 text-xs sm:text-sm transition-all duration-150"
          :class="activeSectionId === item.id
            ? 'border-line-gold bg-gold/15 text-gold-light font-semibold shadow-sm'
            : 'border-line/60 bg-surface/50 text-ink-muted hover:border-line-gold/50 hover:bg-surface-elevated hover:text-ink'"
        >
          <div class="flex items-center gap-2 min-w-0">
            <span class="text-[10px] font-bold text-gold-muted tabular-nums group-hover:text-gold shrink-0">
              {{ String(index + 1).padStart(2, '0') }}
            </span>
            <span class="truncate">{{ item.label }}</span>
          </div>
          <ChevronRight class="h-3.5 w-3.5 shrink-0 opacity-40 group-hover:opacity-100 group-hover:text-gold transition-opacity" aria-hidden="true" />
        </a>
      </div>
      <div v-if="isInstallable" class="mt-3.5 pt-3 border-t border-line/60">
        <AppButton variant="outline" class="w-full border-line-gold/40 text-gold-light" @click="installApp"><Download class="h-4 w-4" aria-hidden="true" /><span>Instalar Aplicativo Oficial</span></AppButton>
      </div>
    </nav>
  </header>
</template>

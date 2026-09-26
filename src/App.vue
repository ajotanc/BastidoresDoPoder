<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { NAVIGATION_SECTIONS } from '@/constants/gameData';
import { useActiveSection } from '@/composables/useActiveSection';
import { scrollToSection } from '@/utils/navigation';
import AppNavbar from '@/components/layout/AppNavbar.vue';
import AppFooter from '@/components/layout/AppFooter.vue';
import CardLightboxModal from '@/components/game/CardLightboxModal.vue';
import CoinLightboxModal from '@/components/game/CoinLightboxModal.vue';

const route = useRoute();
const router = useRouter();

const sectionIds = NAVIGATION_SECTIONS.map((s) => s.id);
const { activeSectionId, setActiveSection } = useActiveSection(sectionIds);

const isOnlineActive = computed(() => {
  return route.name === 'online' || route.name === 'game';
});

const handleToggleOnline = (): void => {
  if (isOnlineActive.value) {
    router.push('/');
  } else {
    router.push('/online');
  }
};

const handleNavbarNavigate = (sectionId: string): void => {
  setActiveSection(sectionId);
  if (isOnlineActive.value) {
    router.push('/').then(() => {
      setTimeout(() => {
        scrollToSection(sectionId);
      }, 120);
    });
  }
};
</script>

<template>
  <div class="min-h-screen flex flex-col bg-paper text-ink font-sans selection:bg-gold selection:text-paper">
    <!-- Link de acessibilidade para navegação por teclado -->
    <a
      href="#home"
      @click="scrollToSection('home', $event)"
      class="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-gold focus:text-surface-elevated focus:font-bold focus:rounded focus:shadow-lg"
    >
      Pular para o manual principal
    </a>

    <!-- Barra de Navegação Superior Sticky -->
    <AppNavbar
      :active-section-id="activeSectionId"
      :is-online-active="isOnlineActive"
      @navigate="handleNavbarNavigate"
      @toggle-online="handleToggleOnline"
    />

    <!-- Conteúdo Principal: Renderizado pelo Vue Router -->
    <main class="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-8 py-8 sm:py-12">
      <RouterView />
    </main>

    <!-- Rodapé -->
    <AppFooter />

    <!-- Modal Lightbox para Ampliação e Download de Cartas -->
    <CardLightboxModal />

    <!-- Modal Lightbox para Ampliação e Download de Moedas (Contos) -->
    <CoinLightboxModal />
  </div>
</template>

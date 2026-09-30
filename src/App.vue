<script setup lang="ts">
import { computed, ref } from 'vue';
import { registerSW } from 'virtual:pwa-register';
import { useGameStore } from '@/stores/gameStore';
import { useSessionProtection } from '@/composables/useSessionProtection';
import { useRoute, useRouter } from 'vue-router';
import { NAVIGATION_SECTIONS } from '@/constants/gameData';
import { useActiveSection } from '@/composables/useActiveSection';
import { scrollToSection } from '@/utils/navigation';
import AppNavbar from '@/components/layout/AppNavbar.vue';
import AppFooter from '@/components/layout/AppFooter.vue';
import CardLightboxModal from '@/components/game/CardLightboxModal.vue';
import CoinLightboxModal from '@/components/game/CoinLightboxModal.vue';

const game = useGameStore();
const sessionActive = computed(() => ['creating', 'joining', 'lobby', 'playing'].includes(game.mode) && game.gameState?.phase !== 'FINISHED');
useSessionProtection(sessionActive);
const updateAvailable = ref(false);
// Never activate a waiting worker from an open tab: other tabs may host a match.
registerSW({ immediate: true, onNeedRefresh: () => { updateAvailable.value = true; } });
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
      href="#main-content"
      @click="scrollToSection('main-content', $event)"
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
    <main
      id="main-content"
      tabindex="-1"
      class="flex-1 max-w-6xl w-full mx-auto transition-all"
      :class="[
        isOnlineActive ? 'px-3 sm:px-6 py-3 sm:py-6' : 'px-4 sm:px-8 py-8 sm:py-12'
      ]"
    >
      <div v-if="updateAvailable && !sessionActive" role="status" class="mb-4 rounded border border-gold/30 bg-surface p-4 text-sm text-ink-muted">
        Uma nova versão está pronta. Ela será aplicada quando todas as abas do jogo forem fechadas e você abrir novamente.
      </div>
      <div v-if="sessionActive && !isOnlineActive && game.currentRoomCode" class="mb-4 rounded border border-gold/30 bg-surface p-4 text-sm text-ink-muted">
        Sua mesa continua aberta.
        <RouterLink :to="`/game/${game.currentRoomCode}`" class="ml-2 inline-flex min-h-11 items-center font-semibold text-gold">Voltar à mesa</RouterLink>
      </div>
      <RouterView />
    </main>

    <!-- Rodapé (oculto no modo de jogo para foco total no tabuleiro) -->
    <AppFooter v-if="!isOnlineActive" />

    <!-- Modal Lightbox para Ampliação e Download de Cartas -->
    <CardLightboxModal />

    <!-- Modal Lightbox para Ampliação e Download de Moedas (Contos) -->
    <CoinLightboxModal />
  </div>
</template>

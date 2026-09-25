<script setup lang="ts">
import { onMounted } from 'vue';
import { NAVIGATION_SECTIONS } from '@/constants/gameData';
import { useActiveSection } from '@/composables/useActiveSection';
import { scrollToSection } from '@/utils/navigation';
import AppNavbar from '@/components/layout/AppNavbar.vue';
import AppFooter from '@/components/layout/AppFooter.vue';
import HeroMasthead from '@/components/game/HeroMasthead.vue';
import GameGoalSection from '@/components/game/GameGoalSection.vue';
import RoleCardsSection from '@/components/game/RoleCardsSection.vue';
import SetupSection from '@/components/game/SetupSection.vue';
import GeneralActionsSection from '@/components/game/GeneralActionsSection.vue';
import TurnOrderSection from '@/components/game/TurnOrderSection.vue';
import InvestigationSection from '@/components/game/InvestigationSection.vue';
import GameExamplesSection from '@/components/game/GameExamplesSection.vue';
import QuickReferenceSection from '@/components/game/QuickReferenceSection.vue';
import CardLightboxModal from '@/components/game/CardLightboxModal.vue';
import CoinLightboxModal from '@/components/game/CoinLightboxModal.vue';

const sectionIds = NAVIGATION_SECTIONS.map((s) => s.id);
const { activeSectionId, setActiveSection } = useActiveSection(sectionIds);

onMounted(() => {
  if (window.location.hash) scrollToSection(window.location.hash);
});
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
    <AppNavbar :active-section-id="activeSectionId" @navigate="setActiveSection" />

    <!-- Conteúdo Principal do Manual -->
    <main class="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-8 py-8 sm:py-12 space-y-12">
      <!-- Masthead com Arte Heroica -->
      <HeroMasthead />

      <!-- 01 / O Jogo e Objetivos -->
      <GameGoalSection />

      <!-- 02 / Cartas e Guia de Ajuda -->
      <RoleCardsSection />

      <!-- 03 / Preparação e Montagem -->
      <SetupSection />

      <!-- 04 / Ações Gerais -->
      <GeneralActionsSection />

      <!-- 05 / Ordem da Jogada -->
      <TurnOrderSection />

      <!-- 06 / Mandado de Busca -->
      <InvestigationSection />

      <!-- 07 / Situações Práticas de Mesa -->
      <GameExamplesSection />

      <!-- 08 / Consulta Rápida -->
      <QuickReferenceSection />
    </main>

    <!-- Rodapé -->
    <AppFooter />

    <!-- Modal Lightbox para Ampliação e Download de Cartas -->
    <CardLightboxModal />

    <!-- Modal Lightbox para Ampliação e Download de Moedas (Contos) -->
    <CoinLightboxModal />
  </div>
</template>

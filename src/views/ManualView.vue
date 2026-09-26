<script setup lang="ts">
import HeroMasthead from '@/components/game/HeroMasthead.vue';
import GameGoalSection from '@/components/game/GameGoalSection.vue';
import RoleCardsSection from '@/components/game/RoleCardsSection.vue';
import SetupSection from '@/components/game/SetupSection.vue';
import GeneralActionsSection from '@/components/game/GeneralActionsSection.vue';
import TurnOrderSection from '@/components/game/TurnOrderSection.vue';
import InvestigationSection from '@/components/game/InvestigationSection.vue';
import GameExamplesSection from '@/components/game/GameExamplesSection.vue';
import QuickReferenceSection from '@/components/game/QuickReferenceSection.vue';
</script>

<template>
  <div class="space-y-12 animate-fadeIn">
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
  </div>
</template>

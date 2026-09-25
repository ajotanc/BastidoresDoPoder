<script setup lang="ts">
import { GAME_META_STATS } from '@/constants/gameData';
import AppButton from '@/components/ui/AppButton.vue';
import { ArrowDown, BookOpen } from 'lucide-vue-next';
</script>

<template>
  <header
    id="home"
    class="relative overflow-hidden isolate border border-[#5b4b32] min-h-[380px] p-8 sm:p-12 flex flex-col justify-between rounded-lg shadow-card bg-[#0d1721]">
    <!-- Imagem de fundo com gradiente sutil -->
    <img class="absolute inset-0 w-full h-full bg-center object-cover object-[100%_100%] z-0"
      alt="Ilustração dos personagens em torno de uma mesa de cartas nos bastidores de Brasília"
      src="/images/hero-art.webp" loading="eager" />
    <div
      class="absolute inset-0 z-[1] bg-gradient-to-r from-[#0d1721] via-[#0d1721ee] sm:via-[#0d1721b3] to-transparent pointer-events-none">
    </div>
    <div
      class="absolute inset-0 z-[1] bg-gradient-to-t from-[#091117] via-transparent to-transparent pointer-events-none">
    </div>

    <!-- Conteúdo principal -->
    <div class="relative flex flex-col gap-6 z-10 max-w-xl">
      <div class="flex justify-center items-center gap-3">
        <img src="/images/bdp.webp" alt="Brasão Oficial de Bastidores do Poder"
          class="w-20 h-20 sm:w-32 sm:h-32 object-contain drop-shadow-md rounded-md" />
        <h1 class="font-serif font-bold text-3xl sm:text-5xl lg:text-6xl text-[#f7f0df] tracking-tight leading-tight">
          Bastidores <span class="text-gold">do Poder</span>
        </h1>
      </div>
      <p class="text-ink-muted text-base sm:text-lg leading-relaxed max-w-lg">
        Blefe, chantagem, conspiração e sobrevivência nos corredores de Brasília.
        Gerencie seus Contos, declare seus apoios e elimine seus rivais até que reste apenas um no poder.
      </p>

      <div>
        <span class="block text-xs uppercase tracking-[0.16em] text-gold-light font-bold">
          Manual Completo · 3 a 8 jogadores
        </span>
        <span class="block text-[0.75rem] text-gold-muted/80 tracking-wide">
          Edição Oficial de Testes
        </span>
      </div>

      <!-- Botões de atalho -->
      <div class="flex flex-wrap items-center gap-3">
        <AppButton variant="gold" size="md" href="#cards">
          <BookOpen class="w-4 h-4 flex-shrink-0" aria-hidden="true" />
          <span class="leading-none">Ver as Cartas</span>
        </AppButton>
        <AppButton variant="primary" size="md" href="#actions">
          <ArrowDown class="w-4 h-4 flex-shrink-0" aria-hidden="true" />
          <span class="leading-none">Ações do Turno</span>
        </AppButton>
      </div>
    </div>

    <!-- Estatísticas rápidas de mesa -->
    <div
      class="relative z-10 mt-8 grid grid-cols-2 sm:grid-cols-4 bg-[#15212a]/95 border border-[#354047] rounded-md backdrop-blur-sm divide-y sm:divide-y-0 sm:divide-x divide-[#354047]"
      aria-label="Resumo do jogo">
      <div v-for="(stat, index) in GAME_META_STATS" :key="index"
        class="p-3.5 sm:p-4 text-center flex flex-col justify-center">
        <strong class="block font-serif font-bold text-2xl sm:text-3xl text-gold mb-0.5">
          {{ stat.value }}
        </strong>
        <small class="text-xs text-ink-muted tracking-wide">
          {{ stat.label }}
        </small>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { GAME_META_STATS } from '@/constants/gameData';
import AppButton from '@/components/ui/AppButton.vue';
import { ArrowDown, BookOpen } from 'lucide-vue-next';
</script>

<template>
  <header
    class="relative overflow-hidden isolate border border-[#5b4b32] min-h-[380px] p-8 sm:p-12 flex flex-col justify-between rounded-lg shadow-card bg-[#0d1721]"
  >
    <!-- Imagem de fundo com gradiente sutil -->
    <img
      class="absolute inset-0 w-full h-full object-cover object-[70%_48%] z-0"
      alt="Ilustração dos personagens em torno de uma mesa de cartas nos bastidores de Brasília"
      src="/images/hero-art.png"
      loading="eager"
    />
    <div
      class="absolute inset-0 z-[1] bg-gradient-to-r from-[#0d1721] via-[#0d1721ee] sm:via-[#0d1721b3] to-transparent pointer-events-none"
    ></div>
    <div
      class="absolute inset-0 z-[1] bg-gradient-to-t from-[#091117] via-transparent to-transparent pointer-events-none"
    ></div>

    <!-- Conteúdo principal -->
    <div class="relative z-10 max-w-xl">
      <div class="text-xs uppercase tracking-[0.16em] text-gold-light font-bold mb-2">
        Manual Completo · 3 a 8 jogadores
      </div>
      <h1 class="font-serif font-bold text-4xl sm:text-5xl lg:text-6xl text-[#f7f0df] tracking-tight leading-[1.05] mb-5">
        Bastidores <span class="block text-gold">do Poder</span>
      </h1>
      <p class="text-ink-muted text-base sm:text-lg leading-relaxed max-w-lg mb-6">
        Blefe, chantagem, conspiração e sobrevivência nos corredores de Brasília.
        Gerencie seus Contos, declare suas influências e elimine seus rivais até que reste apenas um no poder.
      </p>

      <!-- Botões de atalho -->
      <div class="flex flex-wrap gap-3">
        <AppButton variant="gold" size="md" href="#personagens">
          <BookOpen class="w-4 h-4" aria-hidden="true" />
          <span>Ver as Cartas</span>
        </AppButton>
        <AppButton variant="primary" size="md" href="#acoes">
          <ArrowDown class="w-4 h-4" aria-hidden="true" />
          <span>Ações do Turno</span>
        </AppButton>
      </div>
    </div>

    <!-- Estatísticas rápidas de mesa -->
    <div
      class="relative z-10 mt-8 grid grid-cols-2 sm:grid-cols-4 bg-[#15212a]/95 border border-[#354047] rounded-md backdrop-blur-sm divide-y sm:divide-y-0 sm:divide-x divide-[#354047]"
      aria-label="Resumo do jogo"
    >
      <div
        v-for="(stat, index) in GAME_META_STATS"
        :key="index"
        class="p-3.5 sm:p-4 text-center flex flex-col justify-center"
      >
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

<script setup lang="ts">
import { GAME_EXAMPLES } from '@/constants/gameData';
import AppSectionHeader from '@/components/ui/AppSectionHeader.vue';
</script>

<template>
  <section id="exemplos" class="scroll-mt-24 pt-12 border-t border-line/70">
    <AppSectionHeader
      label="07 / Situações de mesa"
      title="Veja a resolução na prática."
      description="Dúvidas comuns resolvidas passo a passo através de casos reais de partidas de teste."
    />

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
      <article
        v-for="(example, index) in GAME_EXAMPLES"
        :key="example.id"
        class="p-5 rounded-r-md bg-surface border border-line border-l-4 border-l-gold transition-all hover:bg-surface-elevated/80 flex flex-col justify-between"
      >
        <div>
          <div class="flex items-center gap-2 mb-2 font-serif text-xs text-gold-muted font-bold tracking-widest uppercase">
            <span>{{ String(index + 1).padStart(2, '0') }} / CASO</span>
          </div>
          <h3 class="font-serif font-bold text-lg text-gold-light mb-2 tracking-tight">
            {{ example.title }}
          </h3>
          <p class="text-xs sm:text-sm text-ink-muted leading-relaxed mb-3">
            {{ example.description }}
          </p>
        </div>

        <div
          v-if="example.highlight"
          class="mt-2 pt-2 border-t border-line/60 text-xs font-semibold text-gold"
        >
          {{ example.highlight }}
        </div>
      </article>
    </div>
  </section>
</template>

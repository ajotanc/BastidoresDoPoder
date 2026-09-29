<script setup lang="ts">
import { RouterLink } from 'vue-router';
import { Users, Bot, ArrowRight } from 'lucide-vue-next';
import AppSectionHeader from '@/components/ui/AppSectionHeader.vue';
</script>

<template>
  <section id="online-mode" class="border-t border-line/70 pt-12">
    <AppSectionHeader
      label="Da leitura à mesa"
      title="Jogue com amigos. Treine com bots."
      description="No modo online, você coloca as regras em prática: experimenta ações, aprende a contestar e ganha confiança para blefar."
    />
    <div class="my-6 grid gap-4 md:grid-cols-2">
      <article class="online-mode-card rounded border border-line p-5 sm:p-6">
        <div class="mb-5 flex items-center justify-between gap-3">
          <span class="flex h-11 w-11 items-center justify-center rounded border border-gold/30 bg-gold/10 text-gold"><Users class="h-5 w-5" aria-hidden="true" /></span>
          <div class="flex -space-x-2" aria-hidden="true"><img v-for="role in ['colonel', 'lawyer', 'baron']" :key="role" :src="`/images/characters/${role}.webp`" alt="" class="h-11 w-11 rounded border-2 border-surface object-cover" loading="lazy" /></div>
        </div>
        <h3 class="mb-3 font-serif text-lg font-bold text-gold-light">Sua mesa, seus aliados.</h3>
        <p class="text-sm leading-relaxed text-ink-muted">Crie uma sala e compartilhe o convite ou o código com seus amigos. Cada jogador entra pelo próprio navegador, escolhe seu perfil e marca que está pronto para começar.</p>
      </article>
      <article class="online-mode-card rounded border border-line p-5 sm:p-6">
        <div class="mb-5 flex items-center justify-between gap-3">
          <span class="flex h-11 w-11 items-center justify-center rounded border border-gold/30 bg-gold/10 text-gold"><Bot class="h-5 w-5" aria-hidden="true" /></span>
          <span class="rounded border border-line px-3 py-1.5 text-xs font-semibold text-ink-muted">Treino com bots</span>
        </div>
        <h3 class="mb-3 font-serif text-lg font-bold text-gold-light">Seu próximo blefe começa aqui.</h3>
        <p class="text-sm leading-relaxed text-ink-muted">Ao criar a sala, marque “Jogar contra bot” e escolha a quantidade. Os bots fazem jogadas, blefam e contestam: uma forma de treinar e conhecer as possibilidades de cada personagem. Você também pode reunir amigos e bots na mesma partida.</p>
      </article>
    </div>
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <p class="text-sm leading-relaxed text-ink-muted">Comece com bots para aprender o ritmo da mesa e depois desafie seus amigos.</p>
      <RouterLink to="/online" class="online-primary w-full justify-between shrink-0 sm:w-40">Jogar online<ArrowRight class="h-4 w-4" aria-hidden="true" /></RouterLink>
    </div>
  </section>
</template>

<style scoped>
.online-mode-card {
  background: linear-gradient(145deg, rgb(19 31 42 / 92%), rgb(10 17 24 / 96%)), url('/images/bg-card.png') center / cover;
  box-shadow: inset 0 1px 0 rgb(255 255 255 / 4%);
}
</style>

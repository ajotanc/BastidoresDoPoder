<script setup lang="ts">
import { RouterLink } from 'vue-router';
import { Users, Bot, ArrowRight, EyeOff } from 'lucide-vue-next';
import AppSectionHeader from '@/components/ui/AppSectionHeader.vue';
import { BOT_DIFFICULTIES } from '@/game/bots/botDifficulty';

const levelDetails = {
  easy: { example: 'Decisões menos precisas abrem espaço para você experimentar ações e aprender quando contestar.' },
  intermediate: { example: 'Os bots observam ameaças e alegações recentes. Um blefe vantajoso pode funcionar, mas o risco entra na conta.' },
  hard: { example: 'Podem extorquir para impedir um ataque, preservar uma defesa útil e preferir uma vitória garantida a uma jogada arriscada.' },
};
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
        <p class="text-sm leading-relaxed text-ink-muted">Ao criar a sala, marque “Adicionar bots à mesa”, escolha a quantidade e ajuste o seletor “Nível dos bots”. Os bots fazem jogadas, blefam e contestam. Você também pode reunir amigos e bots na mesma partida.</p>
      </article>
    </div>
    <div class="mb-6">
      <h3 class="mb-2 font-serif text-xl font-bold text-gold-light">A mesma mesa. Três desafios.</h3>
      <p class="mb-5 max-w-2xl text-sm leading-relaxed text-ink-muted">Comece no seu ritmo e aumente a dificuldade quando quiser. Todos os níveis blefam e contestam; o que muda é o cuidado com cada decisão.</p>
      <div class="grid overflow-hidden rounded border border-line bg-surface divide-y divide-line md:grid-cols-3 md:divide-x md:divide-y-0">
        <article v-for="level in BOT_DIFFICULTIES" :key="level.value" class="p-5">
          <div class="mb-3 flex flex-wrap items-center gap-2">
          <h4 class="inline-flex rounded border px-2.5 py-1 text-xs font-semibold" :class="{
            'border-status-green/30 bg-status-green/10 text-status-green': level.value === 'easy',
            'border-gold/25 bg-gold/10 text-gold': level.value === 'intermediate',
            'border-status-red/30 bg-status-red/10 text-status-red': level.value === 'hard',
          }">{{ level.label }}</h4>
          <span v-if="level.value === 'intermediate'" class="text-xs text-ink-subtle">Nível inicial</span>
          </div>
          <p class="text-sm leading-relaxed text-ink-muted">{{ levelDetails[level.value].example }}</p>
        </article>
      </div>
      <div class="mt-4 flex items-start gap-3 rounded bg-surface px-4 py-3">
        <EyeOff class="mt-0.5 size-4 shrink-0 text-gold-muted" aria-hidden="true" />
        <p class="text-xs leading-relaxed text-ink-muted"><strong class="font-semibold text-ink">Cartas escondidas continuam escondidas.</strong> Mesmo no difícil, os bots usam apenas a própria mão e o que aconteceu publicamente na mesa.</p>
      </div>
      <p class="mt-3 text-xs leading-relaxed text-ink-subtle">Escolha em “Nível dos bots” ao criar a sala. A dificuldade vale para todos os bots, e sua preferência fica salva neste navegador.</p>
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

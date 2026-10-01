<script setup lang="ts">
import { RouterLink } from 'vue-router';
import { Users, Bot, ArrowRight, EyeOff, BookOpen } from '@lucide/vue';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import AppSectionHeader from '@/components/ui/AppSectionHeader.vue';
import Discord from '@/components/ui/icons/Discord.vue';
import { BOT_DIFFICULTIES, BOT_DIFFICULTY_TAG_CLASSES } from '@/game/bots/botDifficulty';
import { ACTION_TIMEOUT_SECONDS, RESPONSE_TIMEOUT_SECONDS, MIN_PLAYERS_TO_START } from '@/constants/gameConfig';

const levelDetails = {
  easy: { example: 'Decisões menos precisas abrem espaço para você experimentar ações e aprender quando contestar.' },
  intermediate: { example: 'Os bots observam ameaças e alegações recentes. Um blefe vantajoso pode funcionar, mas o risco entra na conta.' },
  hard: { example: 'Podem extorquir para impedir um ataque, preservar uma defesa útil e preferir uma vitória garantida a uma jogada arriscada.' },
  pro: { example: 'Comparam o risco de retaliação após cada ação, preservam moedas para defender e avaliam quando desarmar ou eliminar uma ameaça.' },
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
    <article class="online-mode-card mb-6 rounded border border-line p-5 sm:p-6" aria-labelledby="online-discord-title">
      <div class="mb-5 flex items-center justify-between gap-3">
        <span class="flex h-11 w-11 items-center justify-center rounded border border-gold/30 bg-gold/10 text-gold"><Discord class="h-5 w-5" /></span>
      </div>
      <h3 id="online-discord-title" class="mb-3 font-serif text-lg font-bold text-gold-light">Conversa da mesa no Discord</h3>
      <p class="text-sm leading-relaxed text-ink-muted">Ative a conversa no Discord nas configurações da partida para reunir os jogadores em uma sala de voz.</p>
    </article>
    <div class="mb-6">
      <h3 class="mb-2 font-serif text-xl font-bold text-gold-light">A mesma mesa. Quatro desafios.</h3>
      <p class="mb-5 max-w-2xl text-sm leading-relaxed text-ink-muted">Comece no seu ritmo e aumente a dificuldade quando quiser. Todos os níveis blefam e contestam; o que muda é o cuidado com cada decisão.</p>
      <div class="grid gap-px overflow-hidden rounded border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
        <article v-for="level in BOT_DIFFICULTIES" :key="level.value" class="bg-surface p-5">
          <div class="mb-3 flex flex-wrap items-center gap-2">
          <h4 class="inline-flex rounded border px-2.5 py-1 text-xs font-semibold" :class="BOT_DIFFICULTY_TAG_CLASSES[level.value]">{{ level.label }}</h4>
          </div>
          <p class="text-sm leading-relaxed text-ink-muted">{{ levelDetails[level.value].example }}</p>
        </article>
      </div>
      <div class="mt-4 flex items-start gap-3 rounded bg-surface px-4 py-3">
        <EyeOff class="mt-0.5 size-4 shrink-0 text-gold-muted" aria-hidden="true" />
        <p class="text-xs leading-relaxed text-ink-muted"><strong class="font-semibold text-ink">Cartas escondidas continuam escondidas.</strong> Mesmo no Pro, os bots usam apenas a própria mão e o que aconteceu publicamente na mesa. Eles não aprendem entre partidas.</p>
      </div>
      <p class="mt-3 text-xs leading-relaxed text-ink-subtle">Escolha em “Nível dos bots” ao criar a sala. A dificuldade vale para todos os bots, e sua preferência fica salva neste navegador.</p>
    </div>
    <Accordion type="single" collapsible class="mb-6">
      <AccordionItem value="online-guide">
        <AccordionTrigger aria-label="Como a mesa online funciona">
          <span class="flex items-center gap-3">
            <span class="flex size-8 shrink-0 items-center justify-center rounded border border-gold/25 bg-gold/10 text-gold sm:size-10"><BookOpen class="size-4 sm:size-5" aria-hidden="true" /></span>
            <span class="min-w-0">
              <span class="block font-serif text-base font-bold leading-snug sm:hidden" aria-hidden="true">Mesa online</span>
              <span class="hidden font-serif text-base font-bold leading-snug sm:block" aria-hidden="true">Como a mesa online funciona</span>
              <span class="mt-1 block text-xs font-normal leading-relaxed text-ink-muted"><span class="sm:hidden">Entenda como funciona</span><span class="hidden sm:inline">Do primeiro turno ao resultado da partida.</span></span>
            </span>
          </span>
        </AccordionTrigger>
      <AccordionContent class="space-y-4">
        <p><strong class="text-ink">Início:</strong> reúna ao menos {{ MIN_PLAYERS_TO_START }} participantes, contando amigos e bots. Todos devem estar conectados e prontos para o anfitrião iniciar. O anfitrião joga primeiro.</p>
        <p><strong class="text-ink">Conexão:</strong> mantenha a aba da partida aberta. O navegador do anfitrião mantém a mesa funcionando; fechar ou atualizar essa aba interrompe a sala.</p>
        <p><strong class="text-ink">Tempo para decidir:</strong> o anfitrião pode definir os tempos em “Configurações da partida”. Sem alterações, cada turno permite até {{ ACTION_TIMEOUT_SECONDS }} segundos para declarar a ação e cada resposta permite até {{ RESPONSE_TIMEOUT_SECONDS }} segundos. Os tempos escolhidos valem para todos e aparecem na sala de espera. Sem resposta, o jogo passa a oportunidade; sem ação no prazo, aplica Salário Oficial ou, com C$ 10 ou mais, Impeachment definitivo contra o próximo adversário vivo.</p>
        <p><strong class="text-ink">Escolha de cartas:</strong> se o prazo terminar, o jogo escolhe o primeiro apoio ativo para a perda. Na troca, devolve as duas cartas recém-compradas, mantendo a mão anterior.</p>
        <p><strong class="text-ink">Fim da partida:</strong> a mesa permanece aberta com o resultado, as cartas reveladas e os acontecimentos recentes. Toque nas cartas restantes do vencedor para virá-las. “Jogar novamente” leva à tela de criar ou entrar em uma sala.</p>
      </AccordionContent>
      </AccordionItem>
    </Accordion>
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

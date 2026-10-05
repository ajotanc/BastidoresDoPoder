<script setup lang="ts">
import AppSectionHeader from '@/components/ui/AppSectionHeader.vue';
import AppPanel from '@/components/ui/AppPanel.vue';
import AppCallout from '@/components/ui/AppCallout.vue';
</script>

<template>
  <section id="game" class="pt-12 border-t border-line/70">
    <AppSectionHeader
      label="O jogo"
      title="Seus apoios são cartas secretas."
      description="Você disputa o poder nos bastidores da política nacional. Ganha quem eliminar todos os apoios dos adversários e sobrar sozinho na mesa."
    />

    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 my-6">
      <AppPanel title="Apoio e eliminação">
        <p class="text-sm text-ink-muted leading-relaxed mb-3">
          Cada carta virada para baixo representa um <strong class="text-ink">apoio vivo</strong>.
          Você começa com dois apoios secretos. Ao perder um apoio por ataque ou contestação, escolha qual carta ativa revelar. A exceção é o Mandado de Busca: se encontrar o personagem procurado, é uma carta desse personagem que será perdida.
        </p>
        <p class="text-sm text-ink-muted leading-relaxed mb-0">
          Cartas perdidas permanecem abertas na mesa até o fim da partida. Se perder ambas as cartas, você é <strong class="text-status-red">imediatamente eliminado</strong> e devolve todo o seu dinheiro ao cofre central.
        </p>
      </AppPanel>

      <AppPanel title="Blefar faz parte do jogo">
        <p class="text-sm text-ink-muted leading-relaxed mb-3">
          Você pode reivindicar os poderes de qualquer personagem que quiser, quando a ação for permitida, mesmo sem ter a carta na mão.
        </p>
        <p class="text-sm text-ink-muted leading-relaxed mb-0">
          Seus adversários precisam decidir se acreditam em você ou se arriscam uma <strong class="text-gold">contestação</strong>. Quem contesta e erra, perde apoio. Quem blefa e é pego, também perde apoio.
        </p>
      </AppPanel>
    </div>

    <AppCallout variant="gold" title="Segredo:">
      <p class="text-sm leading-relaxed mb-0">
        Durante a partida, mantenha seus apoios em segredo. Revele uma carta somente para comprovar uma alegação contestada ou ao perder esse apoio. No online, depois do encerramento, os apoios restantes do vencedor podem ser virados para consulta.
      </p>
    </AppCallout>
  </section>
</template>

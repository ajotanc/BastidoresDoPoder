<script setup lang="ts">
import AppSectionHeader from '@/components/ui/AppSectionHeader.vue';
import AppPanel from '@/components/ui/AppPanel.vue';
import AppCallout from '@/components/ui/AppCallout.vue';
</script>

<template>
  <section id="objetivo" class="scroll-mt-24 pt-12 border-t border-line/70">
    <AppSectionHeader
      label="02 / O jogo"
      title="Seu poder está nas cartas secretas."
      description="Você é uma figura poderosa disputando a hegemonia nos bastidores da política nacional. O objetivo é eliminar todas as influências dos seus adversários e ser o único sobrevivente à mesa."
    />

    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 my-6">
      <AppPanel title="Influência e Eliminação">
        <p class="text-sm text-ink-muted leading-relaxed mb-3">
          Cada carta virada para baixo representa uma <strong class="text-ink">influência viva</strong>.
          Você começa com duas influências secretas. Quando for forçado a perder uma influência por ataque ou desafio perdido, você escolhe qual das suas cartas vivas revelará.
        </p>
        <p class="text-sm text-ink-muted leading-relaxed mb-0">
          Cartas perdidas permanecem abertas na mesa até o fim da partida. Se perder ambas as cartas, você é <strong class="text-status-red">imediatamente eliminado</strong> e devolve todo o seu dinheiro ao cofre central.
        </p>
      </AppPanel>

      <AppPanel title="Blefe é Regra, não Trapaça">
        <p class="text-sm text-ink-muted leading-relaxed mb-3">
          Você pode reivindicar os poderes de qualquer personagem que quiser, no momento em que a ação for permitida — mesmo que não tenha a respectiva carta na mão!
        </p>
        <p class="text-sm text-ink-muted leading-relaxed mb-0">
          Seus adversários precisam decidir se acreditam em você ou se arriscam uma <strong class="text-gold">contestação</strong>. Quem contesta e erra, perde influência. Quem blefa e é pego, também perde influência.
        </p>
      </AppPanel>
    </div>

    <AppCallout variant="gold" title="Atenção à Regra de Ouro:">
      <p class="text-sm">
        Nunca revele suas cartas voluntariamente fora de um desafio oficial. A única forma legítima de mostrar uma carta é ao ser contestado para comprovar sua alegação, ou ao ser eliminado.
      </p>
    </AppCallout>
  </section>
</template>

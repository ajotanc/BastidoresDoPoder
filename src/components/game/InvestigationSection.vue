<script setup lang="ts">
import AppSectionHeader from '@/components/ui/AppSectionHeader.vue';
import AppPanel from '@/components/ui/AppPanel.vue';
import AppCallout from '@/components/ui/AppCallout.vue';
import { UserCheck, UserX } from 'lucide-vue-next';
</script>

<template>
  <section id="investigation" class="pt-12 border-t border-line/70">
    <AppSectionHeader label="Mandado de Busca" title="O personagem pode ser blefe. O resultado, não."
      description="O Investigador permite vasculhar a mão de um adversário por um personagem específico com um mandado judicial implacável." />

    <p class="text-sm text-ink-muted leading-relaxed mb-6">
      Declare tudo antes de abrir para contestações ou defesas:
      <strong class="text-gold-light font-serif">“Pago C$ 5 e uso Investigador contra Bruno, procurando
        Advogada.”</strong>
      Resolva primeiro o desafio à alegação do Investigador e eventuais bloqueios de Advogada ou Coronel. Somente se o
      mandado for aprovado, consulte os apoios vivos que o alvo possui naquele instante.
    </p>

    <!-- Comparativo de Resultado -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 my-6">
      <AppPanel title="Encontrou o Personagem Procurado">
        <div class="flex items-start gap-3">
          <UserCheck class="w-6 h-6 text-status-green flex-shrink-0 mt-1" aria-hidden="true" />
          <p class="text-sm text-ink-muted leading-relaxed mb-0">
            O alvo <strong class="text-ink">revela e perde imediatamente</strong> um apoio daquele personagem procurado.
            A carta fica aberta na mesa. Os C$ 5 de taxa judicial continuam no cofre.
          </p>
        </div>
      </AppPanel>

      <AppPanel title="Não Encontrou Nada na Mão">
        <div class="flex items-start gap-3">
          <UserX class="w-6 h-6 text-status-red flex-shrink-0 mt-1" aria-hidden="true" />
          <p class="text-sm text-ink-muted leading-relaxed mb-0">
            O alvo declara firmemente <strong class="text-ink">“Nada encontrado”</strong>. Ele NÃO mostra as cartas da
            sua mão para provar a ausência, nem perde apoios. Os C$ 5 de taxa continuam gastos no cofre.
          </p>
        </div>
      </AppPanel>
    </div>

    <!-- Regra Digital vs Física -->
    <AppCallout variant="green" title="Versão Digital vs Cartas Físicas:">
      <div class="space-y-3 text-sm leading-relaxed">
        <p>
          <strong class="text-ink">No jogo digital:</strong> a verificação deve ser feita automaticamente e em segredo
          pelo sistema, revelando apenas o veredito final permitido. O alvo não pode mentir sobre a presença da carta.
          “Nada encontrado” não abre um novo desafio.
        </p>
        <p class="mb-0">
          <strong class="text-ink">Com cartas físicas na mesa:</strong> recomenda-se um mediador neutro fora da disputa,
          ou confiança estrita na integridade dos participantes.
        </p>
      </div>
    </AppCallout>

    <p class="text-sm text-ink-muted leading-relaxed italic border-l-2 border-line pl-3 py-1">
      O Mandado consulta a mão <strong class="text-ink">após os desafios</strong>. Uma carta perdida durante a
      contestação já não está na mão do alvo. Uma prova seguida de reposição também pode ter alterado os personagens
      disponíveis.
    </p>
  </section>
</template>

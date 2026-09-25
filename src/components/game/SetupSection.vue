<script setup lang="ts">
import {
  SETUP_PLAYERS_TABLE,
  SUPPORT_CARDS_LENGTH,
  SUPPORT_CARDS_PER_ROLE,
  CARDS_LENGTH
} from '@/constants/gameData';
import AppSectionHeader from '@/components/ui/AppSectionHeader.vue';
import AppPanel from '@/components/ui/AppPanel.vue';
import AppCallout from '@/components/ui/AppCallout.vue';
import CoinsShowcase from '@/components/game/CoinsShowcase.vue';
</script>

<template>
  <section id="setup" class="pt-12 border-t border-line/70">
    <AppSectionHeader label="Cartas e preparação" title="Quantas cartas usar?"
      :description="`Bastidores do Poder utiliza sempre as ${SUPPORT_CARDS_LENGTH} cartas de apoio (${SUPPORT_CARDS_PER_ROLE} cópias de cada um dos ${CARDS_LENGTH} personagens), independentemente do número de participantes de 3 a 8 jogadores.`" />

    <!-- Tabela de contagem por número de jogadores -->
    <div class="overflow-x-auto my-6 bg-surface border border-line rounded-lg">
      <table class="w-full text-left border-collapse text-xs sm:text-sm">
        <thead>
          <tr class="bg-surface-elevated text-gold-light border-b border-line">
            <th class="py-3 px-4 font-semibold">Jogadores</th>
            <th class="py-3 px-4 font-semibold text-center">Cartas por personagem</th>
            <th class="py-3 px-4 font-semibold text-center">Apoios no baralho</th>
            <th class="py-3 px-4 font-semibold text-center">Cartas de ajuda física</th>
            <th class="py-3 px-4 font-semibold text-center">Saldo inicial</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-line text-ink-muted">
          <tr v-for="row in SETUP_PLAYERS_TABLE" :key="row.players" class="hover:bg-surface-hover/50 transition-colors">
            <td class="py-3 px-4 font-bold text-ink">
              {{ row.players }} jogadores
            </td>
            <td class="py-3 px-4 text-center font-serif text-base text-gold">
              {{ row.cardsPerRole }}
            </td>
            <td class="py-3 px-4 text-center font-serif text-base text-gold">
              {{ row.totalDeckCards }}
            </td>
            <td class="py-3 px-4 text-center">
              {{ row.players }} cartas
            </td>
            <td class="py-3 px-4 text-center font-bold text-ink">
              C$ {{ row.initialCoins }}
            </td>
          </tr>
        </tbody>
        <tfoot>
          <tr class="bg-[#2e2a21] text-gold-light border-t border-gold-dark/60 font-semibold text-xs">
            <td class="py-2.5 px-4" colspan="5">
              Cada jogador recebe 2 apoios secretos + 1 carta de ajuda + C$ 2 no início da partida.
            </td>
          </tr>
        </tfoot>
      </table>
    </div>

    <AppCallout variant="gold" title="Carta de ajuda de mesa:">
      <p class="text-sm leading-relaxed mb-0">
        Prepare uma cópia da carta de ajuda por jogador, separada dos {{ SUPPORT_CARDS_LENGTH }} apoios. Assim, mesas de
        3, 4, 5, 6, 7 e 8 jogadores usam respectivamente <strong>{{ SUPPORT_CARDS_LENGTH + 3 }}, {{ SUPPORT_CARDS_LENGTH
          + 4 }}, {{ SUPPORT_CARDS_LENGTH + 5 }}, {{ SUPPORT_CARDS_LENGTH + 6 }}, {{ SUPPORT_CARDS_LENGTH + 7 }} e {{
            SUPPORT_CARDS_LENGTH + 8 }} cartas físicas</strong>, contando as ajudas. A distribuição de apoios continua
        sendo dois por pessoa.
      </p>
    </AppCallout>

    <!-- Passos de montagem da mesa -->
    <div class="my-6">
      <h3 class="font-serif text-xl font-bold text-gold-light mb-4">
        Monte a mesa em 5 passos
      </h3>
      <ol class="space-y-3 pl-0 list-none">
        <li class="flex items-start gap-4 p-4 rounded-md bg-surface-elevated/70 border border-line text-sm leading-relaxed">
          <span
            class="flex-shrink-0 w-8 h-8 rounded-md bg-surface border border-gold-dark text-gold font-serif font-bold text-base flex items-center justify-center">
            1
          </span>
          <p class="text-ink-muted leading-relaxed mb-0 pt-0.5">
            Embaralhe as {{ SUPPORT_CARDS_LENGTH }} cartas e distribua <strong class="text-ink">duas cartas
              secretas</strong> para cada jogador. Cartas repetidas na mesma mão são permitidas.
          </p>
        </li>
        <li class="flex items-start gap-4 p-4 rounded-md bg-surface-elevated/70 border border-line text-sm leading-relaxed">
          <span
            class="flex-shrink-0 w-8 h-8 rounded-md bg-surface border border-gold-dark text-gold font-serif font-bold text-base flex items-center justify-center">
            2
          </span>
          <p class="text-ink-muted leading-relaxed mb-0 pt-0.5">
            Deixe o restante virado para baixo como <strong class="text-ink">baralho central</strong>. Todos podem
            consultar os próprios apoios vivos em segredo, mas não mostrá-las livremente.
          </p>
        </li>
        <li class="flex items-start gap-4 p-4 rounded-md bg-surface-elevated/70 border border-line text-sm leading-relaxed">
          <span
            class="flex-shrink-0 w-8 h-8 rounded-md bg-surface border border-gold-dark text-gold font-serif font-bold text-base flex items-center justify-center">
            3
          </span>
          <p class="text-ink-muted leading-relaxed mb-0 pt-0.5">
            Entregue <strong class="text-ink">C$ 2 por jogador</strong>. Os saldos ficam públicos e visíveis na mesa. O
            restante do dinheiro forma o cofre central.
          </p>
        </li>
        <li class="flex items-start gap-4 p-4 rounded-md bg-surface-elevated/70 border border-line text-sm leading-relaxed">
          <span
            class="flex-shrink-0 w-8 h-8 rounded-md bg-surface border border-gold-dark text-gold font-serif font-bold text-base flex items-center justify-center">
            4
          </span>
          <p class="text-ink-muted leading-relaxed mb-0 pt-0.5">
            Sorteie quem começa. Os turnos seguem em sentido horário, pulando jogadores já eliminados.
          </p>
        </li>
        <li class="flex items-start gap-4 p-4 rounded-md bg-surface-elevated/70 border border-line text-sm leading-relaxed">
          <span
            class="flex-shrink-0 w-8 h-8 rounded-md bg-surface border border-gold-dark text-gold font-serif font-bold text-base flex items-center justify-center">
            5
          </span>
          <p class="text-ink-muted leading-relaxed mb-0 pt-0.5">
            Em cada turno, escolha uma ação legal. <strong class="text-status-red">Não é permitido passar a
              vez</strong>. Reações e contestações nos turnos alheios não gastam a ação do seu próximo turno.
          </p>
        </li>
      </ol>
    </div>

    <!-- Vitrine de Moedas Oficiais (Contos) -->
    <CoinsShowcase />

    <!-- Painéis complementares -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 my-6">
      <AppPanel title="Contos">
        <p class="text-sm text-ink-muted leading-relaxed mb-2">
          Bronze: <strong>C$ 1</strong>. Prata: <strong>C$ 5</strong>. Ouro: <strong>C$ 10</strong>. Trocar contos
          menores por maiores não altera o saldo nem consome sua ação do turno.
        </p>
        <p class="text-sm text-ink-muted leading-relaxed mb-0">
          O saldo de um jogador nunca fica negativo. Custos de ações devem ser pagos integralmente.
        </p>
      </AppPanel>

      <AppPanel title="Apoio não se recupera">
        <p class="text-sm text-ink-muted leading-relaxed mb-2">
          Cartas perdidas permanecem abertas e fora do jogo até o final. As trocas do Marqueteira e cartas comprovadas
          em desafios mantêm a contagem de cartas vivas.
        </p>
        <p class="text-sm text-ink-muted leading-relaxed mb-0">
          Acordos de boca são permitidos, mas não obrigatórios. É expressamente proibido doar ou emprestar Contos ou
          apoios entre jogadores.
        </p>
      </AppPanel>
    </div>

    <p class="text-sm text-ink-muted leading-relaxed italic border-l-2 border-line pl-3 py-1">
      <strong>Variante para 2 jogadores (duelo):</strong> use as mesmas {{ SUPPORT_CARDS_LENGTH }} cartas e dois apoios
      por pessoa. Quem começa recebe C$ 1; o segundo jogador recebe C$ 2. Sobram {{ SUPPORT_CARDS_LENGTH - 4 }} cartas
      no baralho. O restante das regras segue inalterado.
    </p>
  </section>
</template>

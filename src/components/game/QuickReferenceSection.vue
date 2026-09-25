<script setup lang="ts">
import { QUICK_REFERENCE_DATA, ICON_LEGEND_ITEMS } from '@/constants/gameData';
import AppSectionHeader from '@/components/ui/AppSectionHeader.vue';
import AppCallout from '@/components/ui/AppCallout.vue';
import AppBadge from '@/components/ui/AppBadge.vue';
import RoleIcon from '@/components/game/RoleIcon.vue';
</script>

<template>
  <section id="consulta" class="pt-12 border-t border-line/70">
    <AppSectionHeader
      label="Consulta rápida"
      title="O que bloqueia o quê?"
      description="Consulte rapidamente os bloqueios permitidos, os defensores elegíveis e se cabe contestação em cada ação durante a partida."
    />

    <!-- Legenda de Ícones dos Personagens -->
    <div class="mb-8">
      <h3 class="font-serif text-lg font-bold text-gold-light mb-3">
        Identidade visual e ícones dos personagens
      </h3>
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div
          v-for="item in ICON_LEGEND_ITEMS"
          :key="item.role"
          class="flex items-center gap-3.5 p-3.5 rounded-lg bg-surface border border-line hover:border-gold-dark/60 transition-colors"
        >
          <div
            class="w-10 h-10 flex-shrink-0 flex items-center justify-center rounded bg-surface-elevated/80 border border-line-subtle p-1.5"
          >
            <img
              v-if="item.iconSrc"
              :src="item.iconSrc"
              :alt="`Ícone oficial de ${item.role}`"
              class="w-full h-full object-contain"
            />
            <RoleIcon
              v-else
              :role="item.role"
              :color="item.roleColor"
              :size="26"
            />
          </div>
          <div class="flex flex-col justify-center leading-tight">
            <strong class="block text-xs sm:text-sm text-ink font-semibold">
              {{ item.role }}
            </strong>
            <small class="text-[0.7rem] text-ink-muted">
              {{ item.iconName }}
            </small>
          </div>
        </div>
      </div>
    </div>

    <!-- Tabela de Consulta Rápida -->
    <div class="overflow-x-auto my-6 bg-surface border border-line rounded-lg">
      <table class="w-full text-left border-collapse text-xs sm:text-sm">
        <thead>
          <tr class="bg-surface-elevated text-gold-light border-b border-line">
            <th class="py-3 px-4 font-semibold">Ação</th>
            <th class="py-3 px-4 font-semibold">Bloqueio permitido</th>
            <th class="py-3 px-4 font-semibold">Quem declara a defesa?</th>
            <th class="py-3 px-4 font-semibold text-center">A ação tem contestação?</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-line text-ink-muted">
          <tr
            v-for="row in QUICK_REFERENCE_DATA"
            :key="row.action"
            class="hover:bg-surface-hover/50 transition-colors"
          >
            <th scope="row" class="py-3 px-4 font-bold text-ink">
              {{ row.action }}
            </th>
            <td class="py-3 px-4 font-medium text-gold-light">
              {{ row.allowedBlock }}
            </td>
            <td class="py-3 px-4">
              {{ row.defender }}
            </td>
            <td class="py-3 px-4 text-center">
              <AppBadge
                :variant="row.canChallengeAction === 'Sim' ? 'gold' : 'muted'"
                class="text-[0.65rem] px-2"
              >
                {{ row.canChallengeAction }}
              </AppBadge>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <p class="text-xs sm:text-sm text-ink-muted leading-relaxed mb-6">
      <strong class="text-ink">Todo bloqueio da tabela pode ser contestado.</strong>
      Bloquear cancela o efeito pretendido da ação; contestar verifica a posse real da carta alegada. São etapas cronológicas diferentes na rodada.
    </p>

    <AppCallout variant="gold" title="Antes de começar a partida:">
      <p class="text-xs sm:text-sm mb-0">
        Todos os jogadores devem estar cientes de que há exatamente 3 cópias de cada personagem no baralho, que custos de ataque ou mandado nunca são reembolsados, que um blefe defensivo mal calculado pode eliminar duas influências de uma vez só e que C$ 10 no início da rodada obriga a execução do Impeachment definitivo.
      </p>
    </AppCallout>

    <p class="text-xs text-ink-muted italic border-l-2 border-line pl-3 py-1 mt-4">
      Esta versão consolida as regras oficiais do protótipo com os 7 personagens balanceados para 3 a 8 jogadores.
    </p>
  </section>
</template>

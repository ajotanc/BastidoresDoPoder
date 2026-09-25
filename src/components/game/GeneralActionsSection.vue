<script setup lang="ts">
import { GENERAL_ACTIONS } from '@/constants/gameData';
import AppSectionHeader from '@/components/ui/AppSectionHeader.vue';
import AppCallout from '@/components/ui/AppCallout.vue';
import AppBadge from '@/components/ui/AppBadge.vue';
import { AlertTriangle } from 'lucide-vue-next';
</script>

<template>
  <section id="actions" class="pt-12 border-t border-line/70">
    <AppSectionHeader
      label="Ações gerais"
      title="Não precisa de personagem."
      description="Qualquer jogador vivo pode escolher uma destas ações no próprio turno, desde que consiga pagar o custo. Elas nunca podem ser contestadas, pois não exigem alegação de personagem."
    />

    <!-- Tabela de Ações Gerais -->
    <div class="overflow-x-auto my-6 bg-surface border border-line rounded-lg">
      <table class="w-full text-left border-collapse text-xs sm:text-sm">
        <thead>
          <tr class="bg-surface-elevated text-gold-light border-b border-line">
            <th class="py-3 px-4 font-semibold">Ação</th>
            <th class="py-3 px-4 font-semibold text-center">Custo</th>
            <th class="py-3 px-4 font-semibold">Efeito</th>
            <th class="py-3 px-4 font-semibold">Quem pode bloquear?</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-line text-ink-muted">
          <tr
            v-for="action in GENERAL_ACTIONS"
            :key="action.name"
            class="hover:bg-surface-hover/50 transition-colors"
          >
            <th scope="row" class="py-3.5 px-4 font-bold text-ink">
              <div class="flex items-center gap-2">
                <span>{{ action.name }}</span>
                <AppBadge
                  v-if="action.isAggressive"
                  variant="red"
                  class="text-[0.65rem] px-1.5 py-0"
                >
                  Ataque
                </AppBadge>
              </div>
            </th>
            <td class="py-3.5 px-4 text-center font-bold whitespace-nowrap">
              <span :class="action.cost === 'Grátis' ? 'text-ink-muted' : 'text-gold'">
                {{ action.cost }}
              </span>
            </td>
            <td class="py-3.5 px-4 text-ink">
              <span>{{ action.effect }}</span>
            </td>
            <td class="py-3.5 px-4 text-xs sm:text-sm">
              {{ action.defense }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Regra de C$ 10 compulsório -->
    <AppCallout variant="gold" title="C$ 10 ou mais no início do seu turno?">
      <div class="flex items-start gap-3">
        <AlertTriangle class="w-5 h-5 text-gold flex-shrink-0 mt-0.5" aria-hidden="true" />
        <div>
          <p class="text-sm leading-relaxed mb-0">
            Você <strong class="text-ink">deve obrigatoriamente</strong> realizar um Impeachment definitivo. Ter exatamente C$ 10 já obriga o ataque. Não é permitido escolher Caixa 2, Salário, Vaquinha, Extorsão ou Troca. O alvo atacado não tem defesa e perde um apoio à escolha dele.
          </p>
        </div>
      </div>
    </AppCallout>

    <p class="text-sm text-ink-muted leading-relaxed italic border-l-2 border-line pl-3 py-1">
      <strong class="text-ink">Ninguém é imune:</strong> qualquer combinação de personagens perde apoio para o Impeachment definitivo. O Intocável protege exclusivamente do comum e somente mediante o pagamento de C$ 3 ao cofre.
    </p>
  </section>
</template>

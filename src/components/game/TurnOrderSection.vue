<script setup lang="ts">
import { TURN_STEPS, RESOLUTION_RULES } from '@/constants/gameData';
import AppSectionHeader from '@/components/ui/AppSectionHeader.vue';
import AppCallout from '@/components/ui/AppCallout.vue';
import { CheckCircle2, AlertOctagon } from 'lucide-vue-next';
</script>

<template>
  <section id="resolucao" class="scroll-mt-24 pt-12 border-t border-line/70">
    <AppSectionHeader
      label="05 / Ordem da jogada"
      title="Declare. Resolva. Só então aplique."
      description="Cada rodada segue uma sequência rigorosa de etapas. Respeitar essa ordem garante que contestações, blefes e bloqueios funcionem com total clareza matemática e estratégica."
    />

    <!-- Alerta crítico de custos -->
    <AppCallout variant="red" title="Regra Universal de Pagamento:">
      <div class="flex items-start gap-2.5">
        <AlertOctagon class="w-5 h-5 text-status-red flex-shrink-0 mt-0.5" aria-hidden="true" />
        <p class="text-sm mb-0">
          <strong class="text-ink">Todo custo é pago no momento da declaração e NUNCA é devolvido</strong>.
          Isso inclui ataque bloqueado, personagem desmascarado, palpite errado no Mandado, defesa falsa do Intocável ou alvo eliminado antes do ataque. Se não houver saldo suficiente na mão no momento da declaração, a jogada é ilegal.
        </p>
      </div>
    </AppCallout>

    <!-- 5 Passos do Turno -->
    <div class="space-y-4 my-8">
      <div
        v-for="step in TURN_STEPS"
        :key="step.stepNumber"
        class="relative p-5 sm:p-6 rounded-lg bg-gradient-to-r from-surface-elevated to-surface border border-line flex flex-col sm:flex-row gap-5 items-start transition-all hover:border-gold-dark/60"
      >
        <!-- Número do Passo -->
        <div
          class="flex-shrink-0 w-12 h-12 rounded-lg bg-surface border border-gold-dark/80 text-gold font-serif font-bold text-2xl flex items-center justify-center shadow-inner"
        >
          0{{ step.stepNumber }}
        </div>

        <div class="flex-1 space-y-2">
          <h3 class="font-serif font-bold text-xl text-gold-light tracking-tight">
            {{ step.title }}
          </h3>
          <p class="text-sm text-ink-muted leading-relaxed mb-2">
            {{ step.description }}
          </p>

          <ul v-if="step.details" class="mt-3 space-y-2 pl-0 list-none">
            <li
              v-for="(detail, dIdx) in step.details"
              :key="dIdx"
              class="flex items-start gap-2 text-xs sm:text-sm text-ink-muted bg-surface/70 p-3 rounded border border-line/60"
            >
              <CheckCircle2 class="w-4 h-4 text-gold-dark flex-shrink-0 mt-0.5" aria-hidden="true" />
              <span>{{ detail }}</span>
            </li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Regras para não haver disputa de ordem -->
    <div class="mt-10 p-6 rounded-lg bg-surface border border-line">
      <h3 class="font-serif text-xl font-bold text-gold-light mb-4">
        Regras para não haver disputa de ordem na mesa
      </h3>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div
          v-for="(rule, rIdx) in RESOLUTION_RULES"
          :key="rIdx"
          class="p-3.5 rounded bg-surface-elevated/70 border border-line text-xs sm:text-sm text-ink-muted leading-relaxed"
        >
          {{ rule }}
        </div>
      </div>
    </div>
  </section>
</template>

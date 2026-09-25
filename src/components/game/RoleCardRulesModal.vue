<script setup lang="ts">
import { computed } from 'vue';
import type { RoleCard } from '@/types/game';
import AppDialog from '@/components/ui/AppDialog.vue';
import AppButton from '@/components/ui/AppButton.vue';
import { useLightbox } from '@/composables/useLightbox';
import { X, Swords, ShieldCheck, Info, ZoomIn } from 'lucide-vue-next';

interface Props {
  card: RoleCard | null;
  isOpen: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const { openCardLightbox } = useLightbox();

/**
 * Obtém a imagem da pasta characters para o personagem atual diretamente da definição da carta
 */
const characterBgImage = computed<string | undefined>(() => {
  return props.card?.characterSrc ?? props.card?.imageSrc;
});

/**
 * Define se a carta possui avatar de personagem oficial (exclui o Guia de Mesa)
 */
const hasCharacterAvatar = computed<boolean>(() => {
  return !!props.card?.characterSrc;
});

/**
 * Fecha o modal de regras
 */
const handleClose = (): void => {
  emit('close');
};

/**
 * Transiciona da visualização de regras para o lightbox 3D da carta
 */
const handleOpenLightbox = (): void => {
  if (props.card) {
    const targetCard = props.card;
    emit('close');
    openCardLightbox(targetCard);
  }
};
</script>

<template>
  <AppDialog :is-open="props.isOpen && !!props.card"
    :aria-label="props.card ? `Regras e Habilidades de ${props.card.name}` : 'Regras da Carta'"
    :bg-image-src="characterBgImage" max-width-class="max-w-lg" @close="handleClose">
    <!-- Cabeçalho Fixo do Modal -->
    <template #header>
      <div v-if="props.card" class="flex items-center justify-between gap-4">
        <!-- Lado Esquerdo: Ícone + Título + Tag -->
        <div class="flex items-center gap-3.5 min-w-0">
          <div
            class="w-16 h-16 rounded-lg flex items-center justify-center bg-[#091017] border border-gold-dark/70 shadow-inner flex-shrink-0">
            <img v-if="props.card.iconSrc" :src="props.card.iconSrc" :alt="`Símbolo de ${props.card.name}`"
              class="w-full h-full p-2 object-contain" />
            <img v-else src="/images/bdp.webp" alt="Brasão Bastidores do Poder"
              class="w-full h-full p-2 object-contain" />
          </div>

          <div class="min-w-0">
            <div class="flex items-center gap-2.5 flex-wrap">
              <h2
                class="font-serif font-bold text-xl sm:text-2xl text-[#f7f0e2] tracking-tight leading-none whitespace-nowrap">
                {{ props.card.name }}
              </h2>

              <span
                class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[0.68rem] uppercase font-bold tracking-[0.14em] border shadow-sm backdrop-blur-sm select-none whitespace-nowrap flex-shrink-0"
                :style="{
                  backgroundColor: props.card.roleColor + '18',
                  borderColor: props.card.roleColor + '60',
                  color: props.card.roleColor
                }">
                <span class="w-1.5 h-1.5 rounded-full flex-shrink-0 animate-pulse"
                  :style="{ backgroundColor: props.card.roleColor }"></span>
                <span>{{ props.card.kind }}</span>
              </span>
            </div>

            <div class="flex items-center gap-2 mt-1.5 text-xs text-ink-muted whitespace-nowrap">
              <span>{{ props.card.category }}</span>
              <span class="w-1 h-1 rounded-full bg-gold-dark/60" aria-hidden="true"></span>
              <span class="text-gold-light/90">{{ props.card.copies }}</span>
            </div>
          </div>
        </div>

        <!-- Lado Direito: Fechar -->
        <button type="button" @click="handleClose"
          class="p-2 rounded-lg text-ink-muted hover:text-gold-light hover:bg-surface-hover border border-transparent hover:border-line transition-all focus-visible:outline-none flex-shrink-0"
          aria-label="Fechar regras">
          <X class="w-5 h-5" aria-hidden="true" />
        </button>
      </div>
    </template>

    <!-- Conteúdo com Scroll Exclusivo -->
    <div v-if="props.card" class="space-y-4">
      <!-- Resumo de Atuação da Carta com Avatar do Personagem (apenas para personagens) -->
      <div
        class="p-3 sm:p-4 rounded-xl bg-surface/90 border border-line backdrop-blur-sm shadow-sm flex items-center gap-3.5 sm:gap-4">
        <!-- Avatar oficial do personagem com moldura refinada (apenas para personagens) -->
        <div v-if="hasCharacterAvatar"
          class="w-14 h-14 sm:w-16 sm:h-16 rounded-lg overflow-hidden border border-gold-dark/80 bg-[#070d13] shadow-md flex-shrink-0 relative group">
          <img :src="characterBgImage" :alt="`Retrato oficial de ${props.card.name}`"
            class="w-full h-full object-cover object-top transition-transform duration-300 group-hover:scale-105" />
        </div>

        <!-- Texto descritivo da função -->
        <div class="min-w-0 flex-1">
          <h3 class="text-xs uppercase font-bold tracking-wider text-gold-light mb-1">
            Função nos Bastidores
          </h3>
          <p class="text-xs sm:text-sm text-ink-muted leading-relaxed">
            {{ props.card.summary }}
          </p>
        </div>
      </div>

      <!-- Regras e Habilidades Detalhadas -->
      <div class="space-y-3">
        <h3 class="text-xs uppercase font-bold tracking-wider text-gold-light">
          Poderes e Mecânicas ({{ props.card.rules.length }})
        </h3>

        <div v-for="(rule, idx) in props.card.rules" :key="idx"
          class="p-3.5 rounded-lg bg-surface/90 border-l-4 border-y border-r border-line text-xs sm:text-sm leading-relaxed shadow-sm transition-all"
          :style="{ borderLeftColor: props.card.roleColor }">
          <div class="flex items-center gap-2 font-bold mb-1.5 text-gold-light">
            <Swords v-if="rule.type === 'action'" class="w-4 h-4 flex-shrink-0 text-gold" aria-hidden="true" />
            <ShieldCheck v-else-if="rule.type === 'defense'" class="w-4 h-4 flex-shrink-0 text-gold"
              aria-hidden="true" />
            <Info v-else class="w-4 h-4 flex-shrink-0 text-gold" aria-hidden="true" />
            <span class="font-serif tracking-tight text-sm text-[#f5dcad]">{{ rule.title }}</span>
          </div>
          <p class="text-ink-muted leading-relaxed text-xs sm:text-sm">
            {{ rule.description }}
          </p>
        </div>
      </div>

      <!-- Jurisprudência e Nota Oficial de Regra -->
      <div v-if="props.card.officialRuleNotice"
        class="p-3 rounded-lg bg-surface/60 border border-gold-dark/40 text-xs text-ink-subtle italic leading-relaxed">
        <strong class="not-italic font-bold text-gold-light block mb-0.5">Nota Oficial da Mesa:</strong>
        {{ props.card.officialRuleNotice }}
      </div>
    </div>

    <!-- Rodapé Fixo Separado do Scroll com as Mesmas Cores e Estilo -->
    <template #footer>
      <div class="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-ink-muted">
        <button type="button" @click="handleOpenLightbox"
          class="inline-flex items-center gap-1.5 text-xs font-semibold text-gold hover:text-gold-light transition-colors select-none focus-visible:outline-none">
          <ZoomIn class="w-3.5 h-3.5" aria-hidden="true" />
          <span>Ver arte da carta em 3D</span>
        </button>

        <AppButton variant="secondary" size="sm" @click="handleClose">
          <X class="w-3.5 h-3.5" aria-hidden="true" />
          <span>Fechar regras</span>
        </AppButton>
      </div>
    </template>
  </AppDialog>
</template>

<script setup lang="ts">
import { GAME_NAME } from "@/constants/gameConfig";
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
  return props.card?.characterSrc;
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
      <div v-if="props.card" class="card-modal-header grid grid-cols-[40px_minmax(0,1fr)_44px] items-center gap-x-3 gap-y-3">
        <div class="flex h-10 w-10 items-center justify-center rounded border border-line-gold/50 bg-paper-deep p-1">
          <img :src="props.card.iconSrc || '/images/bdp.webp'" :alt="GAME_NAME" class="h-full w-full object-contain" />
        </div>
        <div class="min-w-0">
          <span class="block text-[11px] text-gold-muted">Regras e habilidades</span>
          <h2 class="mt-0.5 break-words font-serif text-base font-bold leading-tight text-ink sm:text-xl">{{ props.card.name }}</h2>
        </div>
        <button type="button" @click="handleClose" class="online-icon-button self-start" aria-label="Fechar regras"><X class="h-5 w-5" aria-hidden="true" /></button>
        <div class="col-span-3 flex flex-wrap items-center justify-between gap-2 border-t border-line/60 pt-2 text-xs text-ink-muted">
          <span>{{ props.card.category }}</span>
          <span class="text-gold-light">{{ props.card.copies }}</span>
        </div>
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
      <div class="card-modal-actions grid grid-cols-2 gap-2">
        <AppButton variant="secondary" size="sm" class="w-full" aria-label="Fechar regras" @click="handleClose">Fechar</AppButton>
        <AppButton variant="gold" size="sm" class="w-full" aria-label="Ver arte da carta em 3D" @click="handleOpenLightbox">
          <ZoomIn class="h-4 w-4 shrink-0" aria-hidden="true" /><span>Ver carta</span>
        </AppButton>
      </div>
    </template>
  </AppDialog>
</template>

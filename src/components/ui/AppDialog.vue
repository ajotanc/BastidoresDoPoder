<script setup lang="ts">
import AppModalOverlay from '@/components/ui/AppModalOverlay.vue';

interface Props {
  isOpen: boolean;
  ariaLabel?: string;
  maxWidthClass?: string;
  bgImageSrc?: string;
}

const props = withDefaults(defineProps<Props>(), {
  ariaLabel: 'Diálogo',
  maxWidthClass: 'max-w-lg',
  bgImageSrc: undefined,
});

const emit = defineEmits<{
  (e: 'close'): void;
}>();
</script>

<template>
  <AppModalOverlay
    :is-open="props.isOpen"
    :aria-label="props.ariaLabel"
    @close="emit('close')"
  >
    <div
      v-if="props.isOpen"
      :class="[
        'relative w-full max-h-[92vh] flex flex-col rounded-xl overflow-hidden bg-[#0a121b] border border-gold ring-2 ring-gold/40 shadow-modal',
        props.maxWidthClass
      ]"
      @click.stop
    >
      <!-- Background com Arte e Gradiente Contínuo Cobrindo Todo o Modal -->
      <div
        v-if="props.bgImageSrc"
        class="absolute inset-0 overflow-hidden pointer-events-none"
        aria-hidden="true"
      >
        <img
          :src="props.bgImageSrc"
          alt=""
          class="w-full h-full object-cover object-top filter blur-[2px] opacity-45 scale-105 transition-all duration-500"
        />
        <div class="absolute inset-0 bg-gradient-to-b from-[#0a121be0] via-[#0a121bcc] to-[#070d14ea]"></div>
      </div>

      <!-- Cabeçalho Fixo no Topo -->
      <div
        v-if="$slots.header"
        class="relative z-10 flex-shrink-0 border-b border-line bg-gradient-to-r from-[#121c27]/90 via-[#0f1722]/90 to-[#121c27]/90 backdrop-blur-md px-4 sm:px-6 py-4"
      >
        <slot name="header" />
      </div>

      <!-- Conteúdo com Rolagem Exclusiva (o scroll fica restrito apenas aqui) -->
      <div class="relative z-10 flex-1 overflow-y-auto p-4 sm:p-6 scrollbar-thin min-h-0">
        <slot />
      </div>

      <!-- Rodapé Fixo na Base com Acabamento e Cores Alinhadas -->
      <div
        v-if="$slots.footer"
        class="relative z-10 flex-shrink-0 border-t border-line/70 px-4 sm:px-6 py-3.5 bg-[#0a121bf2] backdrop-blur-md"
      >
        <slot name="footer" />
      </div>
    </div>
  </AppModalOverlay>
</template>

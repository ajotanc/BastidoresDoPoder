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
        'relative w-full min-w-0 max-h-[calc(100dvh-1.5rem)] sm:max-h-[calc(100dvh-3rem)] flex flex-col rounded-lg overflow-hidden bg-[#0a121b] border border-gold shadow-modal',
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
      <header
        v-if="$slots.header"
        class="gold-divider-bottom relative z-10 flex-shrink-0 bg-gradient-to-r from-[#121c27]/90 via-[#0f1722]/90 to-[#121c27]/90 backdrop-blur-md px-4 sm:px-6 py-4"
      >
        <slot name="header" />
      </header>

      <!-- Conteúdo com Rolagem Exclusiva (o scroll fica restrito apenas aqui) -->
      <div class="relative z-10 min-w-0 flex-1 overflow-y-auto [scrollbar-gutter:stable] p-4 sm:p-6 scrollbar-thin min-h-0">
        <slot />
      </div>

      <!-- Rodapé Fixo na Base com Acabamento e Cores Alinhadas -->
      <footer
        v-if="$slots.footer"
        class="gold-divider-top relative z-10 flex-shrink-0 px-4 sm:px-6 py-3.5 bg-[#0a121bf2] backdrop-blur-md"
      >
        <slot name="footer" />
      </footer>
    </div>
  </AppModalOverlay>
</template>

<style>
.app-dialog-title {
  font-family: 'Cinzel', Georgia, serif;
  font-size: 16px;
  font-weight: 700;
  line-height: 1.4;
  color: #f3d59a;
  overflow-wrap: anywhere;
}
@media (min-width: 640px) {
  .app-dialog-title { font-size: 20px; }
}
</style>

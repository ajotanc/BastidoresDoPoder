<!-- eslint-disable vue/multi-word-component-names -->
<script setup lang="ts">
import 'vue-sonner/style.css';
import { computed, h, type CSSProperties } from 'vue';
import { Toaster as Sonner, toast, type ToasterProps } from 'vue-sonner';
import { CheckCircle2, AlertCircle, Info, AlertTriangle } from '@lucide/vue';
import Spinner from '@/components/ui/spinner/Spinner.vue';

defineOptions({ name: 'AppSonner' });

const props = withDefaults(defineProps<ToasterProps>(), {
  position: 'top-right',
  closeButtonPosition: 'top-right',
  theme: 'dark',
  closeButton: false,
  duration: 3000,
});

/**
 * Ícones temáticos compactos utilizando os componentes oficiais do projeto
 */
const defaultIcons = computed(() => ({
  loading: h(Spinner, { size: 'xs', variant: 'gold' }),
  success: h(CheckCircle2, { class: 'h-4 w-4 text-status-green shrink-0', 'aria-hidden': 'true' }),
  error: h(AlertCircle, { class: 'h-4 w-4 text-status-red shrink-0', 'aria-hidden': 'true' }),
  warning: h(AlertTriangle, { class: 'h-4 w-4 text-gold shrink-0', 'aria-hidden': 'true' }),
  info: h(Info, { class: 'h-4 w-4 text-gold-light shrink-0', 'aria-hidden': 'true' }),
  ...props.icons,
}));

/**
 * Classes padronizadas de acordo com o design system do jogo (versão compacta)
 */
const defaultToastOptions = computed(() => ({
  duration: props.duration,
  classes: {
    toast:
      'group toast font-sans rounded-md border border-line-gold bg-surface-elevated text-ink shadow-modal !px-3.5 !py-2.5 text-xs gap-2.5 select-none cursor-pointer',
    title: 'font-semibold text-xs leading-snug text-ink',
    description: 'text-[11px] text-ink-muted leading-tight mt-0.5',
    actionButton:
      'bg-gold text-surface-elevated font-bold hover:bg-gold-light px-2.5 py-1 rounded transition-colors text-xs shadow-sm',
    cancelButton:
      'bg-surface text-ink-muted hover:text-ink px-2.5 py-1 rounded transition-colors text-xs border border-line',
    closeButton:
      '!w-4 !h-4 !min-h-0 !max-h-4 !p-0 !rounded-full !border !border-line-gold !bg-surface-elevated !text-ink-muted hover:!text-gold hover:!bg-surface-hover flex items-center justify-center transition-all',
    success:
      '!bg-status-green-bg !text-status-green !border-status-green-border [&_[data-title]]:!text-status-green [&_[data-description]]:!text-status-green/90',
    error:
      '!bg-status-red-bg !text-status-red !border-status-red-border [&_[data-title]]:!text-status-red [&_[data-description]]:!text-status-red/90',
    info:
      '!bg-surface-elevated !text-gold-light !border-line-gold [&_[data-title]]:!text-gold-light',
    warning:
      '!bg-surface-elevated !text-gold !border-gold/40 [&_[data-title]]:!text-gold',
    loading:
      '!bg-surface-elevated !text-ink !border-line-gold',
  },
  ...props.toastOptions,
}));

/**
 * Permite fechar o toast ao clicar diretamente no corpo do card (se não for botão de ação)
 */
const handleToastClick = (event: MouseEvent): void => {
  const target = event.target as HTMLElement | null;
  const toastElement = target?.closest<HTMLElement>('[data-sonner-toast]');
  if (toastElement && !target?.closest('button[data-button], a')) {
    toast.dismiss();
  }
};

/**
 * Estilos inline para definir largura mais compacta (300px em vez dos 356px padrão)
 */
const toasterStyle = computed<CSSProperties>(() => ({
  '--width': '300px',
  ...props.style,
}));
</script>

<template>
  <Sonner
    class="toaster group"
    v-bind="props"
    :style="toasterStyle"
    :duration="props.duration"
    :icons="defaultIcons"
    :toast-options="defaultToastOptions"
    @click="handleToastClick"
  />
</template>

<style>
[data-sonner-toaster] [data-close-button] {
  width: 18px !important;
  height: 18px !important;
  min-height: 0 !important;
  max-height: 18px !important;
  padding: 0 !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  border-radius: 9999px !important;
  border: 1px solid #514733 !important;
  background-color: #17232e !important;
  color: #adb5bb !important;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.4);
}

[data-sonner-toaster] [data-close-button]:hover {
  color: #e6bf73 !important;
  border-color: #e6bf73 !important;
  background-color: #1e2c38 !important;
}

[data-sonner-toaster] [data-close-button] svg {
  width: 10px !important;
  height: 10px !important;
  flex-shrink: 0 !important;
}
</style>

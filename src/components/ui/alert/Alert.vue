<script setup lang="ts">
import type { HTMLAttributes } from 'vue';
import { cn } from '@/utils/cn';

export interface AlertProps {
  variant?: 'default' | 'destructive' | 'warning' | 'success' | 'gold' | 'info' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  class?: HTMLAttributes['class'];
}

defineOptions({ name: 'AppAlert' });

const props = withDefaults(defineProps<AlertProps>(), {
  variant: 'default',
  size: 'md',
  class: '',
});

// Cores seguindo o padrão oficial do projeto:
const alertVariants: Record<NonNullable<AlertProps['variant']>, string> = {
  default: 'bg-paper-deep/60 border-line text-ink-muted [&>svg]:text-ink-subtle',
  secondary: 'bg-paper-deep/60 border-line text-ink-muted [&>svg]:text-ink-subtle',
  destructive:
    'bg-status-red-bg border-status-red/50 text-status-red [&>svg]:text-status-red',
  warning:
    'bg-surface-elevated border-gold/40 text-gold-light [&>svg]:text-gold',
  success:
    'bg-status-green-bg/80 border-status-green/50 text-status-green [&>svg]:text-status-green',
  gold:
    'bg-[#29261e] border-[#685536] text-[#efe0bf] [&>svg]:text-gold',
  info:
    'bg-surface border-line text-ink [&>svg]:text-gold-light',
};

// Tamanhos padronizados, compactos e proporcionais (altura equilibrada):
const alertSizes: Record<NonNullable<AlertProps['size']>, string> = {
  sm: 'text-xs px-3 py-1.5 sm:py-2 rounded gap-2.5 [&>svg]:w-4 [&>svg]:h-4',
  md: 'text-sm px-3.5 py-2.5 sm:py-3 rounded-lg gap-3 [&>svg]:w-4 [&>svg]:h-4 sm:[&>svg]:w-5 sm:[&>svg]:h-5',
  lg: 'text-base px-4 py-3 sm:py-3.5 rounded-lg gap-3.5 [&>svg]:w-5 [&>svg]:h-5',
};
</script>

<template>
  <div
    role="alert"
    :class="
      cn(
        'w-full border flex items-center transition-colors [&>svg]:shrink-0 [&_button]:min-h-0 [&_button]:h-auto [&_button]:py-1 [&_button]:px-2.5 [&_button]:text-xs [&_button]:leading-normal',
        alertVariants[props.variant],
        alertSizes[props.size],
        props.class
      )
    "
  >
    <slot />
  </div>
</template>

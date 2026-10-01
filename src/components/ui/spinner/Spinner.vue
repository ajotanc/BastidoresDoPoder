<script setup lang="ts">
import { computed, type HTMLAttributes } from 'vue';
import { LoaderCircle } from '@lucide/vue';
import { cn } from '@/utils/cn';

defineOptions({ name: 'AppSpinner' });

interface Props {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'gold' | 'primary' | 'ink' | 'muted' | 'white' | 'current';
  label?: string;
  class?: HTMLAttributes['class'];
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  variant: 'default',
  label: undefined,
  class: undefined,
});

const sizeClasses: Record<NonNullable<Props['size']>, string> = {
  xs: 'h-3 w-3',
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-8 w-8',
  xl: 'h-10 w-10',
};

const variantClasses: Record<NonNullable<Props['variant']>, string> = {
  default: 'text-gold',
  gold: 'text-gold',
  primary: 'text-gold-light',
  ink: 'text-ink',
  muted: 'text-ink-muted',
  white: 'text-white',
  current: 'text-current',
};

/**
 * Classes base do indicador giratório com suporte a acessibilidade motora
 */
const spinnerClasses = computed(() => {
  return cn(
    'app-spinner shrink-0 animate-spin',
    sizeClasses[props.size],
    variantClasses[props.variant]
  );
});
</script>

<template>
  <span
    v-if="props.label"
    :class="cn('inline-flex items-center gap-2', props.class)"
    role="status"
    :aria-label="props.label"
  >
    <LoaderCircle :class="spinnerClasses" aria-hidden="true" />
    <span class="sr-only">{{ props.label }}</span>
  </span>

  <LoaderCircle
    v-else
    :class="cn(spinnerClasses, props.class)"
    aria-hidden="true"
  />
</template>

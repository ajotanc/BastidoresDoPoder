<script setup lang="ts">
import { computed } from 'vue';
import { cn } from '@/utils/cn';

export interface TagProps {
  variant?:
    | 'gold'
    | 'primary'
    | 'outline'
    | 'secondary'
    | 'ghost'
    | 'transparent'
    | 'default'
    | 'muted'
    | 'dark'
    | 'dark-gold';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  class?: string;
}

defineOptions({ name: 'AppTag' });

const props = withDefaults(defineProps<TagProps>(), {
  variant: 'primary',
  size: 'md',
  class: '',
});

const tagClasses = computed(() => {
  const base =
    'inline-flex items-center justify-center font-sans font-semibold leading-none select-none transition-colors border';

  // Seguindo exatamente a mesma paleta e padrões do component Button
  const variants: Record<NonNullable<TagProps['variant']>, string> = {
    gold: 'bg-gold text-surface-elevated border-gold shadow-sm font-bold',
    primary: 'bg-surface-elevated text-gold-light border-gold-dark shadow-sm',
    outline: 'bg-transparent text-ink border-line',
    secondary: 'bg-surface-hover text-ink border-line-subtle',
    default: 'bg-paper-deep text-ink-muted border-line',
    muted: 'bg-paper-deep text-ink-muted border-line',
    dark: 'bg-paper-deep text-ink-muted border-line',
    'dark-gold': 'bg-paper-deep text-ink border-line-gold/40',
    ghost: 'bg-transparent text-ink-muted border-transparent',
    transparent: 'bg-transparent text-ink-muted border-transparent shadow-none',
  };

  const sizes: Record<NonNullable<TagProps['size']>, string> = {
    xs: 'text-[10px] px-2 py-0.5 rounded gap-1',
    sm: 'text-[11px] px-2.5 py-1 rounded gap-1.5',
    md: 'text-xs px-3 py-1.5 rounded-md gap-1.5',
    lg: 'text-sm px-4 py-2 rounded-md gap-2',
  };

  return cn(base, variants[props.variant], sizes[props.size], props.class);
});
</script>

<template>
  <span :class="tagClasses">
    <slot />
  </span>
</template>

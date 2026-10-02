<script setup lang="ts">
import { computed } from 'vue';
import { cn } from '@/utils/cn';

export interface BadgeProps {
  variant?: 'gold' | 'role' | 'muted' | 'outline' | 'green' | 'red';
  customColor?: string;
  class?: string;
}

defineOptions({ name: 'AppBadge' });

const props = withDefaults(defineProps<BadgeProps>(), {
  variant: 'gold',
  customColor: undefined,
  class: '',
});

const badgeClasses = computed(() => {
  const base =
    'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-semibold tracking-wider uppercase transition-colors';
  const variants: Record<NonNullable<BadgeProps['variant']>, string> = {
    gold: 'bg-gold/15 text-gold-light border border-gold/40',
    role: 'bg-surface-elevated text-ink border border-line-gold',
    muted: 'bg-surface text-ink-muted border border-line',
    outline: 'bg-transparent text-ink border border-line hover:border-gold/50',
    green: 'bg-status-green-bg text-status-green border border-status-green-border',
    red: 'bg-status-red-bg text-status-red border border-status-red-border',
  };

  return cn(base, variants[props.variant], props.class);
});
</script>

<template>
  <span
    :class="badgeClasses"
    :style="props.customColor ? { borderColor: props.customColor, color: props.customColor } : undefined"
  >
    <slot />
  </span>
</template>

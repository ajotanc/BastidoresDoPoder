<script setup lang="ts">
import { computed, type HTMLAttributes } from 'vue';
import { Toggle, useForwardPropsEmits, type ToggleProps, type ToggleEmits } from 'radix-vue';
import { cn } from '@/utils/cn';

export interface AppToggleProps extends ToggleProps {
  variant?: 'default' | 'outline' | 'gold' | 'transparent';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  class?: HTMLAttributes['class'];
}

defineOptions({ name: 'AppToggle' });

const props = withDefaults(defineProps<AppToggleProps>(), {
  variant: 'default',
  size: 'default',
  disabled: false,
});

const emits = defineEmits<ToggleEmits>();

const delegatedProps = computed(() => {
  const { class: className, variant: _v, size: _s, ...delegated } = props;
  void className;
  void _v;
  void _s;
  return delegated;
});

const forwarded = useForwardPropsEmits(delegatedProps, emits);

const toggleClasses = computed(() => {
  const base =
    'inline-flex items-center justify-center rounded-lg text-sm font-medium transition-all select-none cursor-pointer disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold';

  const variants: Record<NonNullable<AppToggleProps['variant']>, string> = {
    default:
      'bg-transparent text-ink-muted hover:bg-surface-elevated hover:text-gold data-[state=on]:bg-surface-elevated data-[state=on]:text-gold-light data-[state=on]:shadow-sm',
    outline:
      'border border-line bg-transparent text-ink-muted hover:bg-surface-elevated hover:text-gold data-[state=on]:border-gold data-[state=on]:bg-surface-elevated data-[state=on]:text-gold-light data-[state=on]:shadow-sm',
    gold:
      'border border-line-gold/50 bg-paper-deep text-ink-muted hover:border-gold hover:text-gold-light data-[state=on]:border-gold data-[state=on]:bg-gold/15 data-[state=on]:text-gold data-[state=on]:shadow-sm',
    transparent:
      'border-0 border-transparent bg-transparent text-ink-muted hover:bg-transparent hover:text-gold data-[state=on]:bg-transparent data-[state=on]:text-gold data-[state=on]:shadow-none',
  };

  const sizes: Record<NonNullable<AppToggleProps['size']>, string> = {
    default: 'h-10 px-3 min-w-10 gap-2',
    sm: 'h-9 px-2.5 min-w-9 text-xs gap-1.5',
    lg: 'h-11 px-5 min-w-11 text-base gap-2.5',
    icon: 'h-11 w-11 p-0 shrink-0',
  };

  return cn(base, variants[props.variant], sizes[props.size], props.class);
});
</script>

<template>
  <Toggle v-bind="forwarded" :class="toggleClasses">
    <slot />
  </Toggle>
</template>

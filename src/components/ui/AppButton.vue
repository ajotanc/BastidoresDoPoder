<script setup lang="ts">
import { computed } from 'vue';
import { cn } from '@/utils/cn';
import { scrollToSection } from '@/utils/navigation';

interface Props {
  variant?: 'primary' | 'gold' | 'outline' | 'ghost' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  href?: string;
  target?: string;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  class?: string;
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'gold',
  size: 'md',
  href: undefined,
  target: undefined,
  type: 'button',
  disabled: false,
  class: '',
});

const isLink = computed(() => !!props.href);

const emit = defineEmits<{
  (e: 'click', event: MouseEvent): void;
}>();

/**
 * Trata o clique para rolar suavemente e prevenir hash na URL quando for âncora interna
 */
const handleClick = (event: MouseEvent): void => {
  if (props.href?.startsWith('#')) {
    scrollToSection(props.href, event);
  }
  emit('click', event);
};

const buttonClasses = computed(() => {
  const base =
    'inline-flex items-center justify-center text-center gap-2.5 rounded-md font-bold transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed select-none focus-visible:outline-none leading-none';

  const variants: Record<NonNullable<Props['variant']>, string> = {
    gold: 'bg-gold text-surface-elevated hover:bg-gold-light border border-gold shadow-sm active:scale-[0.98]',
    primary:
      'bg-surface-elevated text-gold-light border border-gold-dark hover:border-gold hover:bg-surface-hover shadow-sm active:scale-[0.98]',
    outline:
      'bg-transparent text-ink border border-line hover:border-gold-accent hover:text-gold-light active:scale-[0.98]',
    secondary:
      'bg-surface-hover text-ink border border-line-subtle hover:bg-surface active:scale-[0.98]',
    ghost:
      'bg-transparent text-ink-muted hover:text-gold-light hover:bg-surface-elevated/60',
  };

  const sizes: Record<NonNullable<Props['size']>, string> = {
    sm: 'text-xs px-3 py-1.5',
    md: 'text-sm px-4 py-2.5',
    lg: 'text-base px-6 py-3',
  };

  return cn(base, variants[props.variant], sizes[props.size], props.class);
});
</script>

<template>
  <a
    v-if="isLink"
    :href="props.href"
    :target="props.target"
    :class="buttonClasses"
    :rel="props.target === '_blank' ? 'noopener noreferrer' : undefined"
    @click="handleClick"
  >
    <slot />
  </a>
  <button
    v-else
    :type="props.type"
    :disabled="props.disabled"
    :class="buttonClasses"
    @click="emit('click', $event)"
  >
    <slot />
  </button>
</template>

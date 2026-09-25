<script setup lang="ts">
import { computed } from 'vue';
import { cn } from '@/utils/cn';

interface Props {
  variant?: 'green' | 'gold' | 'red';
  title?: string;
  class?: string;
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'green',
  title: undefined,
  class: '',
});

const calloutClasses = computed(() => {
  const base =
    'p-5 my-6 rounded-r-md border transition-all duration-200 text-sm leading-relaxed';

  const variants: Record<NonNullable<Props['variant']>, string> = {
    green:
      'bg-status-green-bg border-status-green-border border-l-4 border-l-status-green text-[#d1e2db]',
    gold:
      'bg-[#29261e] border-[#685536] border-l-4 border-l-gold text-[#efe0bf]',
    red:
      'bg-status-red-bg border-status-red-border border-l-4 border-l-status-red text-[#efcfce]',
  };

  return cn(base, variants[props.variant], props.class);
});
</script>

<template>
  <aside :class="calloutClasses" role="note">
    <strong v-if="props.title" class="block font-bold mb-2 text-base text-ink">
      {{ props.title }}
    </strong>
    <div class="leading-relaxed [&_p]:leading-relaxed">
      <slot />
    </div>
  </aside>
</template>

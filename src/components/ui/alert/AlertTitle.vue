<script setup lang="ts">
import type { HTMLAttributes } from 'vue';
import { cn } from '@/utils/cn';

export interface AlertTitleProps {
  class?: HTMLAttributes['class'];
}

defineOptions({ name: 'AlertTitle' });

const props = withDefaults(defineProps<AlertTitleProps>(), {
  class: '',
});
</script>

<template>
  <h5
    :class="
      cn('mb-1 font-serif font-bold leading-none tracking-tight text-inherit', props.class)
    "
  >
    <slot />
  </h5>
</template>

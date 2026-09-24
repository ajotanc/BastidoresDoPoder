<script setup lang="ts">
import { cn } from '@/utils/cn';

interface Props {
  title?: string;
  class?: string;
}

const props = withDefaults(defineProps<Props>(), {
  title: undefined,
  class: '',
});
</script>

<template>
  <div
    :class="
      cn(
        'bg-gradient-to-br from-[#1b2832] to-[#141e28] p-6 border border-[#354550] rounded-md transition-all duration-200',
        props.class
      )
    "
  >
    <h3
      v-if="props.title"
      class="text-gold font-serif font-bold text-xl mb-3 tracking-tight"
    >
      {{ props.title }}
    </h3>
    <slot />
  </div>
</template>

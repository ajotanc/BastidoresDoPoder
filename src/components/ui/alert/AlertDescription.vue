<script setup lang="ts">
import type { HTMLAttributes } from 'vue';
import { cn } from '@/utils/cn';

export interface AlertDescriptionProps {
  class?: HTMLAttributes['class'];
}

defineOptions({ name: 'AlertDescription' });

const props = withDefaults(defineProps<AlertDescriptionProps>(), {
  class: '',
});
</script>

<template>
  <div :class="cn('leading-relaxed text-inherit/90 [&_p]:leading-relaxed', props.class)">
    <slot />
  </div>
</template>

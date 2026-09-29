<script setup lang="ts">
import { computed, type HTMLAttributes } from 'vue';
import { SliderRoot, SliderTrack, SliderRange, SliderThumb, useForwardPropsEmits, type SliderRootProps, type SliderRootEmits } from 'radix-vue';
import { cn } from '@/utils/cn';

defineOptions({ name: 'AppSlider' });
const props = defineProps<SliderRootProps & { class?: HTMLAttributes['class']; label?: string; valueText?: string }>();
const emits = defineEmits<SliderRootEmits>();
const delegatedProps = computed(() => {
  const { class: className, label, valueText, ...rest } = props;
  void className; void label; void valueText;
  return rest;
});
const forwarded = useForwardPropsEmits(delegatedProps, emits);
</script>

<template>
  <SliderRoot v-bind="forwarded" :class="cn('relative flex min-h-11 w-full touch-none select-none items-center data-[disabled]:opacity-50', props.class)">
    <SliderTrack class="relative h-2 w-full grow overflow-hidden rounded border border-gold/20 bg-paper-deep">
      <SliderRange class="absolute h-full rounded bg-gradient-to-r from-gold-muted to-gold" />
    </SliderTrack>
    <SliderThumb :aria-label="label" :aria-valuetext="valueText" class="block h-6 w-6 rounded border-2 border-gold bg-surface shadow-[0_0_0_4px_rgba(230,191,115,0.12)] transition-shadow hover:shadow-[0_0_0_6px_rgba(230,191,115,0.18)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-4 focus-visible:ring-offset-surface" />
  </SliderRoot>
</template>

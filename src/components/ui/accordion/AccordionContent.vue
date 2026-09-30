<script setup lang="ts">
import { computed, type HTMLAttributes } from 'vue';
import { AccordionContent, type AccordionContentProps, useForwardProps } from 'radix-vue';
import { cn } from '@/utils/cn';
const props = defineProps<AccordionContentProps & { class?: HTMLAttributes['class'] }>();
const delegated = computed(() => { const { class: className, ...rest } = props; void className; return rest; });
const forwarded = useForwardProps(delegated);
</script>

<template>
  <AccordionContent v-bind="forwarded" class="app-accordion-content overflow-hidden">
    <div :class="cn('gold-divider-top relative px-5 pb-5 pt-4 text-sm leading-relaxed text-ink-muted', props.class)"><slot /></div>
  </AccordionContent>
</template>

<style>
.app-accordion-content[data-state='open'] { animation: accordion-open 220ms ease-out; }
.app-accordion-content[data-state='closed'] { animation: accordion-close 180ms ease-in; }
@keyframes accordion-open { from { height: 0; } to { height: var(--radix-accordion-content-height); } }
@keyframes accordion-close { from { height: var(--radix-accordion-content-height); } to { height: 0; } }
@media (prefers-reduced-motion: reduce) { .app-accordion-content { animation: none !important; } }
</style>

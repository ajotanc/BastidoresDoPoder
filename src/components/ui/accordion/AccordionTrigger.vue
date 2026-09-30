<script setup lang="ts">
import { computed, type HTMLAttributes } from 'vue';
import { AccordionHeader, AccordionTrigger, type AccordionTriggerProps, useForwardProps } from 'radix-vue';
import { ChevronDown } from 'lucide-vue-next';
import { cn } from '@/utils/cn';
defineOptions({ inheritAttrs: false });
const props = defineProps<AccordionTriggerProps & { class?: HTMLAttributes['class'] }>();
const delegated = computed(() => { const { class: className, ...rest } = props; void className; return rest; });
const forwarded = useForwardProps(delegated);
</script>

<template>
  <AccordionHeader class="flex">
    <AccordionTrigger v-bind="{ ...forwarded, ...$attrs }" :class="cn('app-accordion-trigger group flex min-h-11 w-full items-center gap-3 text-left text-gold-light transition-colors hover:bg-gold/5 disabled:cursor-not-allowed disabled:opacity-50', props.class)">
      <span class="min-w-0 flex-1"><slot /></span>
      <ChevronDown class="size-5 shrink-0 text-gold-muted transition-transform duration-200 group-data-[state=open]:rotate-180 motion-reduce:transition-none" aria-hidden="true" />
    </AccordionTrigger>
  </AccordionHeader>
</template>

<style>
button.app-accordion-trigger { padding: 16px; border: 0; }
@media (min-width: 640px) { button.app-accordion-trigger { padding: 20px; } }
button.app-accordion-trigger:focus-visible { outline-offset: -4px; }
</style>

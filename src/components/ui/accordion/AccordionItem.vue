<script setup lang="ts">
import { computed, type HTMLAttributes } from 'vue';
import { AccordionItem, type AccordionItemProps, useForwardProps } from 'radix-vue';
import { cn } from '@/utils/cn';
const props = defineProps<AccordionItemProps & { class?: HTMLAttributes['class'] }>();
const delegated = computed(() => { const { class: className, ...rest } = props; void className; return rest; });
const forwarded = useForwardProps(delegated);
</script>

<template>
  <AccordionItem v-bind="forwarded" :class="cn('overflow-hidden rounded border border-line bg-surface transition-colors data-[state=open]:border-gold/40', props.class)"><slot /></AccordionItem>
</template>

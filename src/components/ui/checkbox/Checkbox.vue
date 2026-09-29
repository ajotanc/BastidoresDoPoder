<script setup lang="ts">
import type { HTMLAttributes } from 'vue';
import { computed } from 'vue';
import { Check } from 'lucide-vue-next';
import { CheckboxRoot, CheckboxIndicator, useForwardPropsEmits, type CheckboxRootProps, type CheckboxRootEmits } from 'radix-vue';
import { cn } from '@/utils/cn';
defineOptions({ name: 'AppCheckbox' });

// shadcn-vue's Radix checkbox, themed for the game's shared controls.
const props = defineProps<CheckboxRootProps & { class?: HTMLAttributes['class'] }>();
const emits = defineEmits<CheckboxRootEmits>();
const delegatedProps = computed(() => {
  const { class: className, ...delegated } = props;
  void className;
  return delegated;
});
const forwarded = useForwardPropsEmits(delegatedProps, emits);
</script>

<template>
  <CheckboxRoot v-bind="forwarded" :class="cn('app-checkbox peer inline-flex shrink-0 items-center justify-center rounded border bg-paper-deep text-gold transition-colors disabled:cursor-not-allowed disabled:opacity-50', props.class)">
    <CheckboxIndicator class="flex items-center justify-center"><Check class="h-[18px] w-[18px]" aria-hidden="true" /></CheckboxIndicator>
  </CheckboxRoot>
</template>

<style>
button.app-checkbox { width: 22px; height: 22px; min-height: 22px; padding: 0; border-color: #8d784f; border-radius: calc(var(--ui-radius) / 2) !important; }
button.app-checkbox[data-state='checked'] { border-color: var(--gold); background: rgb(230 191 115 / 10%); }
</style>

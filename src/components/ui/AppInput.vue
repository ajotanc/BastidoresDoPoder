<script setup lang="ts">
import { cn } from '@/utils/cn';

defineOptions({ inheritAttrs: false });

const props = withDefaults(defineProps<{
  modelValue?: string | number | null;
  modelModifiers?: { number?: boolean; trim?: boolean };
  type?: string;
  class?: string;
}>(), {
  modelValue: '',
  modelModifiers: () => ({}),
  type: 'text',
  class: '',
});
const emit = defineEmits<{ (event: 'update:modelValue', value: string | number): void }>();

const onInput = (event: Event): void => {
  let value: string | number = (event.target as unknown as { value: string }).value;
  if (props.modelModifiers.trim && typeof value === 'string') value = value.trim();
  if (props.modelModifiers.number) {
    const parsed = parseFloat(String(value));
    value = Number.isNaN(parsed) ? value : parsed;
  }
  emit('update:modelValue', value);
};
</script>

<template>
  <input
    v-bind="$attrs"
    :type="props.type"
    :value="props.modelValue ?? ''"
    :class="cn('app-input block min-h-11 w-full min-w-0 rounded border px-3 text-left text-sm', props.class)"
    @input="onInput"
  />
</template>

<style>
.app-input {
  background: #101a24;
  border-color: #3b4651;
  color: var(--ink);
  font-weight: 500;
  outline: none;
  transition: border-color .15s, box-shadow .15s;
}
.app-input::placeholder { color: var(--muted); opacity: .6; }
.app-input:hover:not(:disabled) { border-color: #8d784f; }
.app-input:focus-visible {
  border-color: var(--gold);
  outline: none;
  box-shadow: 0 0 0 2px rgb(230 191 115 / .12);
}
.app-input:disabled { opacity: .5; cursor: not-allowed; }
</style>

<script setup lang="ts">
import Toggle, { type AppToggleProps } from './toggle/Toggle.vue';

/**
 * Reexporta o componente Toggle com a convenção de nome AppToggle.
 */
defineOptions({ name: 'AppToggle' });

const props = defineProps<AppToggleProps>();
const emits = defineEmits<{
  (e: 'update:pressed', value: boolean): void;
}>();
</script>

<template>
  <Toggle v-bind="props" @update:pressed="emits('update:pressed', $event)">
    <template #default="slotProps">
      <slot v-bind="slotProps" />
    </template>
  </Toggle>
</template>

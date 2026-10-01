<script setup lang="ts">
import Spinner from './spinner/Spinner.vue';

/**
 * Reexporta o componente Spinner com a convenção de nome AppSpinner.
 */
defineOptions({ name: 'AppSpinner' });
</script>

<template>
  <Spinner v-bind="$attrs">
    <slot />
  </Spinner>
</template>

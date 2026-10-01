<script setup lang="ts">
import Sonner from './sonner/Sonner.vue';

/**
 * Reexporta o componente Sonner com a convenção de nome AppSonner.
 */
defineOptions({ name: 'AppSonner' });
</script>

<template>
  <Sonner v-bind="$attrs" />
</template>

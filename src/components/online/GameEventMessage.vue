<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{ message: string }>();
const parts = computed(() => props.message
  .replace(/[\p{Extended_Pictographic}\uFE0F\u200D]/gu, '').trim()
  .split(/(FAKE NEWS!|APOIO PERDIDO!|ELIMINAÇÃO!|VITÓRIA POLÍTICA!|BLOQUEIO!|Comprovado!|Blefe desmascarado!)/gi));
</script>

<template>
  <span><template v-for="(part, index) in parts" :key="index"><strong v-if="index % 2" class="font-bold text-ink">{{ part }}</strong><template v-else>{{ part }}</template></template></span>
</template>

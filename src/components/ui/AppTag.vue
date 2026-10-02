<script setup lang="ts">
import Tag, { type TagProps } from './tag/Tag.vue';

defineOptions({ name: 'AppTag' });

const props = defineProps<TagProps>();
</script>

<template>
  <Tag v-bind="props">
    <slot />
  </Tag>
</template>

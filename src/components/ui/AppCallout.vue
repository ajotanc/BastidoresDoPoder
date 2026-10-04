<script setup lang="ts">
import { computed } from 'vue';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

interface Props {
  variant?: 'green' | 'gold' | 'red';
  title?: string;
  class?: string;
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'green',
  title: undefined,
  class: '',
});

const alertVariant = computed<'success' | 'warning' | 'destructive'>(() => {
  switch (props.variant) {
    case 'red':
      return 'destructive';
    case 'gold':
      return 'warning';
    case 'green':
    default:
      return 'success';
  }
});
</script>

<template>
  <Alert :variant="alertVariant" size="md" :class="props.class" class="my-6 items-start">
    <div class="min-w-0 flex-1">
      <AlertTitle v-if="props.title" class="mb-2 text-base font-bold text-inherit">
        {{ props.title }}
      </AlertTitle>
      <AlertDescription>
        <slot />
      </AlertDescription>
    </div>
  </Alert>
</template>

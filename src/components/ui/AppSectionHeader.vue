<script setup lang="ts">
interface Props {
  label: string;
  title: string;
  description?: string;
  id?: string;
}

defineProps<Props>();
</script>

<template>
  <header class="mb-8">
    <div
      class="text-xs uppercase tracking-[0.16em] text-gold font-bold mb-3 flex items-center gap-2"
    >
      <span class="text-[0.65rem] text-gold-dark" aria-hidden="true">◆</span>
      <span>{{ label }}</span>
    </div>
    <h2
      :id="id"
      class="font-serif font-normal text-3xl sm:text-4xl text-[#f4eddf] tracking-tight leading-snug mb-3"
    >
      {{ title }}
    </h2>
    <p v-if="description" class="text-ink-muted text-base max-w-3xl leading-relaxed">
      {{ description }}
    </p>
    <slot />
  </header>
</template>

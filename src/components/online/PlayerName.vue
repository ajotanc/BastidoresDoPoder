<script setup lang="ts">
import { Bot } from '@lucide/vue';

defineProps<{ player?: { name: string; isBot?: boolean } | null; fallback?: string }>();
</script>

<template>
  <span class="inline-flex min-w-0 items-center gap-1.5 align-bottom">
    <Bot v-if="player?.isBot" class="size-[1em] min-h-4 min-w-4 shrink-0 text-gold-muted" aria-hidden="true" />
    <span v-if="player?.isBot" class="sr-only">Bot:</span>
    <span class="min-w-0 break-words">{{ player?.name ?? fallback }}</span>
  </span>
</template>

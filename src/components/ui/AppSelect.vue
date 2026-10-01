<script setup lang="ts">
import { SelectRoot, SelectTrigger, SelectValue, SelectPortal, SelectContent, SelectViewport, SelectItem, SelectItemText, SelectItemIndicator, SelectIcon } from 'radix-vue';
import { Check, ChevronDown } from '@lucide/vue';
defineProps<{ modelValue: string; label: string; options: readonly { id: string; label: string }[] }>();
const emit = defineEmits<{ (event: 'update:modelValue', value: string): void }>();
</script>

<template>
  <SelectRoot :model-value="modelValue" @update:model-value="emit('update:modelValue', $event)">
    <SelectTrigger :aria-label="label" class="app-select-trigger group flex min-h-11 w-full items-center justify-between gap-3 rounded border px-3 text-left text-sm">
      <SelectValue class="min-w-0 flex-1" />
      <SelectIcon class="select-chevron flex shrink-0 items-center justify-center border-l border-line pl-3">
        <ChevronDown class="h-4 w-4 transition-transform group-data-[state=open]:rotate-180" aria-hidden="true" />
      </SelectIcon>
    </SelectTrigger>
    <SelectPortal>
      <SelectContent position="popper" :side-offset="6" :collision-padding="12" class="app-select-content z-[80] w-[var(--radix-select-trigger-width)] overflow-hidden rounded border">
        <div class="border-b border-line px-3 py-2.5 font-serif text-sm font-semibold text-gold-muted">{{ label }}</div>
        <SelectViewport class="max-h-[min(280px,calc(var(--radix-select-content-available-height)-44px))] p-1.5">
          <SelectItem v-for="option in options" :key="option.id" :value="option.id" class="app-select-item relative flex min-h-11 cursor-pointer select-none items-center gap-3 rounded py-2 pl-3 pr-10 text-sm">
            <SelectItemText>{{ option.label }}</SelectItemText>
            <SelectItemIndicator class="absolute right-3 flex items-center justify-center"><Check class="h-4 w-4" aria-hidden="true" /></SelectItemIndicator>
          </SelectItem>
        </SelectViewport>
      </SelectContent>
    </SelectPortal>
  </SelectRoot>
</template>

<style>
.app-select-trigger {
  background: #101a24;
  border-color: #3b4651;
  color: var(--ink);
  font-weight: 500;
  transition: border-color .15s, box-shadow .15s;
}
.app-select-trigger:hover { border-color: #8d784f; }
.app-select-trigger[data-state='open'], .app-select-trigger:focus-visible {
  border-color: var(--gold);
  outline: none;
  box-shadow: 0 0 0 2px rgb(230 191 115 / .12);
}
.select-chevron { color: var(--gold); }
.app-select-content {
  background: #101a24;
  border-color: #514733;
  box-shadow: 0 12px 32px rgb(0 0 0 / .4);
}
.app-select-item { color: var(--muted); outline: none; transition: background-color .12s, color .12s; }
.app-select-content .app-select-item:focus-visible { outline: none; }
.app-select-item[data-highlighted] { background: #1b2b37; color: var(--ink); }
.app-select-item[data-state='checked'] { background: rgb(230 191 115 / .09); color: var(--gold); font-weight: 600; }
.app-select-item[data-state='checked'][data-highlighted] { background: rgb(230 191 115 / .16); }
</style>

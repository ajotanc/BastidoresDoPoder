<script lang="ts">
// Preserve the page trigger when switching directly between dialogs.
let pageOpener: HTMLElement | null = null;
</script>

<script setup lang="ts">
import { watch } from 'vue';
import { DialogRoot, DialogPortal, DialogOverlay, DialogContent, DialogTitle } from 'radix-vue';

const props = withDefaults(defineProps<{
  isOpen: boolean;
  ariaLabel?: string;
  zIndexClass?: string;
}>(), {
  ariaLabel: 'Modal de visualização',
  zIndexClass: 'z-[60]',
});
const emit = defineEmits<{ (e: 'close'): void }>();
let opener: HTMLElement | null = null;
watch(() => props.isOpen, (open) => {
  if (!open) return;
  const active = document.activeElement;
  if (active instanceof HTMLElement && !active.closest('[role="dialog"]')) pageOpener = active;
  opener = pageOpener;
}, { flush: 'sync' });
const restoreFocus = (event: Event): void => {
  event.preventDefault();
  // A second dialog may have opened while this one was closing.
  if (!document.querySelector('[role="dialog"][data-state="open"]') && opener?.isConnected) {
    opener.focus({ preventScroll: true });
  }
};
</script>

<template>
  <DialogRoot :open="isOpen" @update:open="!$event && emit('close')">
    <DialogPortal>
      <DialogOverlay :class="['fixed inset-0 bg-black/75 backdrop-blur-sm', zIndexClass]" />
      <DialogContent
        :class="['fixed inset-0 flex items-center justify-center p-3 sm:p-6 overflow-y-auto', zIndexClass]"
        :aria-describedby="undefined"
        @close-auto-focus="restoreFocus"
        @click.self="emit('close')"
      >
        <DialogTitle class="sr-only">{{ ariaLabel }}</DialogTitle>
        <slot />
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>

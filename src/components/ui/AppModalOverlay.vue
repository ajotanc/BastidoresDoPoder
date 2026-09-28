<script lang="ts">
// Preserve the page trigger when switching directly between dialogs.
let pageOpener: HTMLElement | null = null;
let scrollLockCount = 0;
let savedScrollY = 0;
let savedBodyStyles: Record<string, string> = {};
const lockPageScroll = () => {
  if (scrollLockCount++ > 0) return;
  savedScrollY = window.scrollY;
  const style = document.body.style;
  savedBodyStyles = Object.fromEntries(['position', 'top', 'left', 'right', 'width'].map(key => [key, style.getPropertyValue(key)]));
  document.documentElement.classList.add('modal-scroll-locked');
  style.position = 'fixed';
  style.top = `-${savedScrollY}px`;
  style.left = '0';
  style.right = '0';
  style.width = '100%';
};
const unlockPageScroll = () => {
  if (--scrollLockCount > 0) return;
  for (const [key, value] of Object.entries(savedBodyStyles)) {
    if (value) document.body.style.setProperty(key, value);
    else document.body.style.removeProperty(key);
  }
  document.documentElement.classList.remove('modal-scroll-locked');
  window.scrollTo({ top: savedScrollY, behavior: 'instant' });
};
</script>

<script setup lang="ts">
import { watch, onBeforeUnmount } from 'vue';
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
let ownsScrollLock = false;
watch(() => props.isOpen, open => {
  if (open && !ownsScrollLock) { lockPageScroll(); ownsScrollLock = true; }
  else if (!open && ownsScrollLock) { unlockPageScroll(); ownsScrollLock = false; }
}, { immediate: true, flush: 'sync' });
onBeforeUnmount(() => { if (ownsScrollLock) { unlockPageScroll(); ownsScrollLock = false; } });

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
      <DialogOverlay :class="['fixed inset-0 bg-black/60 backdrop-blur-md', zIndexClass]" />
      <DialogContent
        :class="['modal-scroll-surface fixed inset-0 flex items-center justify-center p-3 sm:p-6 overflow-y-auto', zIndexClass]"
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

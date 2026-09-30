import { onBeforeUnmount, watch, type Ref } from 'vue';

/** Attach only while a live session exists; browsers supply the confirmation text. */
export function useSessionProtection(active: Ref<boolean>): void {
  const beforeUnload = (event: BeforeUnloadEvent) => {
    event.preventDefault();
    event.returnValue = '';
  };
  const stop = watch(active, enabled => {
    window.removeEventListener('beforeunload', beforeUnload);
    if (enabled) window.addEventListener('beforeunload', beforeUnload);
  }, { immediate: true });
  onBeforeUnmount(() => { stop(); window.removeEventListener('beforeunload', beforeUnload); });
}

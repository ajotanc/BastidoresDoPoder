<script setup lang="ts">
import { watch, onMounted, onUnmounted } from 'vue';

interface Props {
  isOpen: boolean;
  ariaLabel?: string;
  zIndexClass?: string;
}

const props = withDefaults(defineProps<Props>(), {
  ariaLabel: 'Modal de visualização',
  zIndexClass: 'z-[60]',
});

const emit = defineEmits<{
  (e: 'close'): void;
}>();

/**
 * Fecha o modal ao pressionar a tecla Escape
 */
const handleKeyDown = (event: KeyboardEvent): void => {
  if (event.key === 'Escape' && props.isOpen) {
    emit('close');
  }
};

/**
 * Controla o bloqueio de rolagem do body quando o modal está aberto
 */
watch(
  () => props.isOpen,
  (open) => {
    if (typeof document === 'undefined') return;
    if (open) {
      document.body.classList.add('overflow-hidden');
    } else {
      document.body.classList.remove('overflow-hidden');
    }
  },
  { immediate: true }
);

onMounted(() => {
  if (typeof window !== 'undefined') {
    window.addEventListener('keydown', handleKeyDown);
  }
});

onUnmounted(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('keydown', handleKeyDown);
  }
  if (typeof document !== 'undefined') {
    document.body.classList.remove('overflow-hidden');
  }
});
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0 scale-95"
      enter-to-class="opacity-100 scale-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-95"
    >
      <div
        v-if="isOpen"
        :class="[
          'fixed inset-0 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-sm overflow-y-auto',
          zIndexClass
        ]"
        role="dialog"
        aria-modal="true"
        :aria-label="ariaLabel"
        @click.self="emit('close')"
      >
        <slot />
      </div>
    </Transition>
  </Teleport>
</template>

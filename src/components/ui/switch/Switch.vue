<script setup lang="ts">
import { computed, type HTMLAttributes } from 'vue';
import { SwitchRoot, SwitchThumb, useForwardPropsEmits, type SwitchRootProps, type SwitchRootEmits } from 'radix-vue';
import { cn } from '@/utils/cn';
defineOptions({ name: 'AppSwitch' });
const props = defineProps<SwitchRootProps & { class?: HTMLAttributes['class'] }>();
const emits = defineEmits<SwitchRootEmits>();
const delegatedProps = computed(() => {
  const { class: className, ...delegated } = props;
  void className;
  return delegated;
});
const forwarded = useForwardPropsEmits(delegatedProps, emits);
</script>

<template>
  <SwitchRoot v-bind="forwarded" :class="cn('app-switch group relative inline-flex shrink-0 items-center disabled:cursor-not-allowed disabled:opacity-50', props.class)">
    <span class="switch-track pointer-events-none flex items-center border border-line-gold bg-paper-deep p-[3px] transition-colors group-data-[state=checked]:border-gold group-data-[state=checked]:bg-gold/20">
      <SwitchThumb class="switch-thumb block size-5 bg-ink-subtle transition-[transform,background-color] duration-200 data-[state=checked]:translate-x-5 data-[state=checked]:bg-gold motion-reduce:transition-none" />
    </span>
  </SwitchRoot>
</template>

<style>
button.app-switch { width: 48px; height: 44px; min-height: 44px; padding: 0; border: 0; background: transparent; box-shadow: none; }
button.app-switch:hover { background: transparent; }
.app-switch .switch-track { width: 48px; height: 28px; border-radius: var(--ui-radius); }
.app-switch .switch-thumb { border-radius: calc(var(--ui-radius) - 4px); }
</style>

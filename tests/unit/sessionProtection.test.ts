import { mount } from '@vue/test-utils';
import { defineComponent, ref, nextTick } from 'vue';
import { expect, it } from 'vitest';
import { useSessionProtection } from '@/composables/useSessionProtection';

it('protege somente sessões ativas e remove o listener ao encerrar ou desmontar', async () => {
  const active = ref(false);
  const wrapper = mount(defineComponent({ setup() { useSessionProtection(active); return () => null; } }));
  const attempt = () => { const event = new Event('beforeunload', { cancelable: true }); window.dispatchEvent(event); return event.defaultPrevented; };
  expect(attempt()).toBe(false);
  active.value = true; await nextTick(); expect(attempt()).toBe(true);
  active.value = false; await nextTick(); expect(attempt()).toBe(false);
  active.value = true; await nextTick(); wrapper.unmount(); expect(attempt()).toBe(false);
});

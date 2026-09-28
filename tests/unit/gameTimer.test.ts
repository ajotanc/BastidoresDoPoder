import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, nextTick, ref } from 'vue';
import { mount } from '@vue/test-utils';
import { useGameTimer } from '@/composables/useGameTimer';
import { ACTION_TIMEOUT_SECONDS, RESPONSE_TIMEOUT_SECONDS } from '@/game/models/gameState';

describe('Barra e contador do tempo configurado', () => {
  beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(100000); });
  afterEach(() => { vi.useRealTimers(); });

  it('inicia em 100%, diminui proporcionalmente e reinicia ao trocar ação por resposta', async () => {
    const duration = ref(ACTION_TIMEOUT_SECONDS * 1000);
    const deadline = ref<number | null>(Date.now() + duration.value);
    let timer!: ReturnType<typeof useGameTimer>;
    const wrapper = mount(defineComponent({ setup() { timer = useGameTimer(deadline, duration); return () => null; } }));
    try {
      expect(timer.secondsRemaining.value).toBe(ACTION_TIMEOUT_SECONDS);
      expect(timer.progressPercentage.value).toBe(100);
      vi.advanceTimersByTime(duration.value / 2);
      expect(timer.progressPercentage.value).toBeCloseTo(50);
      expect(timer.secondsRemaining.value).toBe(Math.ceil(ACTION_TIMEOUT_SECONDS / 2));

      duration.value = RESPONSE_TIMEOUT_SECONDS * 1000;
      deadline.value = Date.now() + duration.value;
      await nextTick();
      expect(timer.secondsRemaining.value).toBe(RESPONSE_TIMEOUT_SECONDS);
      expect(timer.progressPercentage.value).toBe(100);
      vi.advanceTimersByTime(duration.value / 2);
      expect(timer.progressPercentage.value).toBeCloseTo(50);
      vi.advanceTimersByTime(duration.value / 2);
      expect(timer.progressPercentage.value).toBe(0);
      expect(timer.secondsRemaining.value).toBe(0);
      deadline.value = null;
      await nextTick();
      expect(vi.getTimerCount()).toBe(0);
    } finally { wrapper.unmount(); }
  });
});

import { afterEach, expect, it, vi } from 'vitest';
import { defineComponent, shallowRef } from 'vue';
import { mount } from '@vue/test-utils';
import { useGameSounds } from '@/composables/useGameSounds';
import { createInitialAuthoritativeState } from '@/game/engine/gameEngine';
afterEach(() => { localStorage.clear(); vi.unstubAllGlobals(); });
it('sons começam desligados, respeitam a preferência e não repetem a vitória', async () => {
  localStorage.clear();
  const start = vi.fn(); const close = vi.fn().mockResolvedValue(undefined);
  const audio = vi.fn(function () { return { state: 'running', currentTime: 0, destination: {}, resume: vi.fn().mockResolvedValue(undefined), close,
    createOscillator: () => ({ frequency: { value: 0 }, connect: vi.fn(), start, stop: vi.fn(), disconnect: vi.fn() }),
    createGain: () => ({ gain: { setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() }, connect: vi.fn(), disconnect: vi.fn() }),
  }; });
  vi.stubGlobal('AudioContext', audio);
  const state = shallowRef(createInitialAuthoritativeState('ABCD', 'a', 'Ana', 'baron', 'token').publicState);
  const wrapper = mount(defineComponent({ setup() { return useGameSounds(state, shallowRef('a')); }, template: '<button @click="toggle">{{ enabled }}</button>' }));
  expect(wrapper.text()).toBe('false'); expect(audio).not.toHaveBeenCalled();
  await wrapper.get('button').trigger('click'); expect(localStorage.getItem('bdp-sounds')).toBe('true');
  state.value = { ...state.value, phase: 'FINISHED', winnerPlayerId: 'a' }; await wrapper.vm.$nextTick();
  expect(start).toHaveBeenCalledTimes(3);
  state.value = { ...state.value, revision: 10 }; await wrapper.vm.$nextTick(); expect(start).toHaveBeenCalledTimes(3);
  await wrapper.get('button').trigger('click'); expect(localStorage.getItem('bdp-sounds')).toBe('false');
  wrapper.unmount(); expect(close).toHaveBeenCalledOnce();
});

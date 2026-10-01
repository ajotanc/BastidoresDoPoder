import { afterEach, expect, it, vi } from 'vitest';
import { defineComponent, shallowRef } from 'vue';
import { flushPromises, mount } from '@vue/test-utils';
import { useVictoryCelebration } from '@/composables/useVictoryCelebration';
import { createInitialAuthoritativeState } from '@/game/engine/gameEngine';

const effects = vi.hoisted(() => ({ start: vi.fn(), stop: vi.fn(), remove: vi.fn() }));
vi.mock('vue-confetti', () => ({ Confetti: class { start = effects.start; stop = effects.stop; remove = effects.remove; } }));
afterEach(() => { vi.useRealTimers(); vi.clearAllMocks(); vi.unstubAllGlobals(); });

it('celebra uma vez, encerra o efeito e remove o canvas ao sair', async () => {
  vi.useFakeTimers();
  const state = shallowRef(createInitialAuthoritativeState('ABCD', 'a', 'Ana', 'baron', 'token').publicState);
  const wrapper = mount(defineComponent({ setup() { useVictoryCelebration(state); }, template: '<div />' }));
  state.value = { ...state.value, phase: 'FINISHED', winnerPlayerId: 'a' };
  await flushPromises();
  expect(effects.start).toHaveBeenCalledOnce();
  expect(document.querySelector('canvas')).not.toBeNull();
  state.value = { ...state.value, revision: 10 }; await flushPromises();
  expect(effects.start).toHaveBeenCalledOnce();
  vi.advanceTimersByTime(2200); expect(effects.stop).toHaveBeenCalledOnce();
  wrapper.unmount();
  expect(document.querySelector('canvas')).toBeNull();
  expect(effects.remove).toHaveBeenCalled();
});

it('mantém o canvas na escala do mobile, inclusive após girar a tela', async () => {
  vi.stubGlobal('innerWidth', 390);
  vi.stubGlobal('innerHeight', 844);
  const state = shallowRef(createInitialAuthoritativeState('ABCD', 'a', 'Ana', 'baron', 'token').publicState);
  const wrapper = mount(defineComponent({ setup() { useVictoryCelebration(state); }, template: '<div />' }));
  state.value = { ...state.value, phase: 'FINISHED', winnerPlayerId: 'a' };
  await flushPromises();
  const canvas = document.querySelector('canvas')!;
  expect([canvas.width, canvas.height]).toEqual([390, 844]);
  expect(effects.start).toHaveBeenCalledWith(expect.objectContaining({ defaultSize: 4, particlesPerFrame: 1, windSpeedMax: 2 }));
  vi.stubGlobal('innerWidth', 844);
  vi.stubGlobal('innerHeight', 390);
  window.dispatchEvent(new Event('resize'));
  expect([canvas.width, canvas.height]).toEqual([844, 390]);
  wrapper.unmount();
  vi.stubGlobal('innerWidth', 320);
  window.dispatchEvent(new Event('resize'));
  expect(canvas.width).toBe(844);
});

it('respeita movimento reduzido e não celebra uma partida restaurada já encerrada', async () => {
  vi.stubGlobal('matchMedia', () => ({ matches: true }));
  const initial = createInitialAuthoritativeState('ABCD', 'a', 'Ana', 'baron', 'token').publicState;
  const state = shallowRef({ ...initial, phase: 'FINISHED' as const, winnerPlayerId: 'a' });
  const wrapper = mount(defineComponent({ setup() { useVictoryCelebration(state); }, template: '<div />' }));
  await flushPromises(); expect(effects.start).not.toHaveBeenCalled();
  wrapper.unmount();
  const liveState = shallowRef(initial);
  const live = mount(defineComponent({ setup() { useVictoryCelebration(liveState); }, template: '<div />' }));
  liveState.value = { ...initial, phase: 'FINISHED', winnerPlayerId: 'a' };
  await flushPromises(); expect(effects.start).not.toHaveBeenCalled();
  live.unmount();
});

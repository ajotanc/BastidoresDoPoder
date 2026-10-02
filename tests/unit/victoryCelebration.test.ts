import { afterEach, expect, it, vi } from 'vitest';
import { defineComponent, shallowRef } from 'vue';
import { flushPromises, mount } from '@vue/test-utils';
import { useVictoryCelebration, triggerConfettiCelebration } from '@/composables/useVictoryCelebration';
import { createInitialAuthoritativeState } from '@/game/engine/gameEngine';

const effects = vi.hoisted(() => ({ start: vi.fn(), stop: vi.fn(), remove: vi.fn() }));

vi.mock('vue-confetti', () => ({
  Confetti: class {
    start = vi.fn((opts) => {
      effects.start(opts);
      if (!document.getElementById('confetti-canvas')) {
        const c = document.createElement('canvas');
        c.id = 'confetti-canvas';
        document.body.appendChild(c);
      }
    });
    stop = effects.stop;
    remove = vi.fn(() => {
      effects.remove();
      document.getElementById('confetti-canvas')?.remove();
    });
  },
}));

afterEach(() => {
  vi.useRealTimers();
  vi.clearAllMocks();
  vi.unstubAllGlobals();
  document.getElementById('confetti-canvas')?.remove();
});

it('celebra a vitória com opções douradas e remove o canvas ao sair', async () => {
  vi.useFakeTimers();
  const state = shallowRef(createInitialAuthoritativeState('ABCD', 'a', 'Ana', 'baron', 'token').publicState);
  const wrapper = mount(defineComponent({ setup() { useVictoryCelebration(state); }, template: '<div />' }));

  state.value = { ...state.value, phase: 'FINISHED', winnerPlayerId: 'a' };
  await flushPromises();

  expect(effects.start).toHaveBeenCalled();
  expect(effects.start).toHaveBeenCalledWith(expect.objectContaining({
    defaultType: 'rect',
    defaultSize: 5,
    windSpeedMax: 1,
  }));
  expect(document.querySelector('canvas')).not.toBeNull();

  // Não celebra repetidamente na mesma partida
  state.value = { ...state.value, revision: 10 };
  await flushPromises();
  const callCount = effects.start.mock.calls.length;
  expect(effects.start).toHaveBeenCalledTimes(callCount);

  wrapper.unmount();
  expect(effects.remove).toHaveBeenCalled();
  expect(document.querySelector('canvas')).toBeNull();
});

it('ajusta dimensões do canvas conforme tela e dispara transição de fade', async () => {
  vi.stubGlobal('innerWidth', 1024);
  vi.stubGlobal('innerHeight', 768);

  triggerConfettiCelebration();

  const canvas = document.querySelector('canvas')!;
  expect(canvas).not.toBeNull();
  expect(canvas.width).toBe(1024);
  expect(canvas.height).toBe(768);
});

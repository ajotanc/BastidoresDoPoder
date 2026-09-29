import { describe, it, expect, vi } from 'vitest';
import { useDragScroll } from '@/composables/useDragScroll';

describe('Arraste dos gabinetes', () => {
  it('preserva o clique na carta quando não há conteúdo para arrastar', () => {
    const element = document.createElement('div');
    Object.defineProperties(element, { clientWidth: { value: 600 }, scrollWidth: { value: 600 } });
    const drag = useDragScroll();
    const event = { currentTarget: element, pointerId: 1, pointerType: 'mouse', button: 0, isPrimary: true, clientX: 100, preventDefault: vi.fn() };
    drag.onPointerDown(event as unknown as PointerEvent);
    drag.onPointerMove({ ...event, clientX: 109 } as unknown as PointerEvent);
    const click = { detail: 1, preventDefault: vi.fn(), stopPropagation: vi.fn() };
    drag.onClickCapture(click as unknown as MouseEvent);
    expect(drag.isDragging.value).toBe(false);
    expect(click.preventDefault).not.toHaveBeenCalled();
    expect(click.stopPropagation).not.toHaveBeenCalled();
  });
});

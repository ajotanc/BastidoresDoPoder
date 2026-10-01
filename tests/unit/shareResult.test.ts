import { afterEach, expect, it, vi } from 'vitest';
import { resultImage } from '@/utils/shareResult';
const { toBlob } = vi.hoisted(() => ({ toBlob: vi.fn() }));
vi.mock('html-to-image', () => ({ toBlob, getFontEmbedCSS: vi.fn().mockResolvedValue('') }));
afterEach(() => { document.body.innerHTML = ''; vi.restoreAllMocks(); toBlob.mockReset(); });
function panel() {
  const node = document.createElement('section');
  node.innerHTML = '<h2>Resultado da mesa</h2><h3>AJOTA</h3><div data-result-controls><button>Preparar revanche</button></div><div data-result-controls>Sequência final</div>';
  document.body.append(node);
  vi.spyOn(node, 'getBoundingClientRect').mockReturnValue({ width: 360 } as DOMRect);
  Object.defineProperty(document, 'fonts', { configurable: true, value: { ready: Promise.resolve() } });
  return node;
}
it('exporta o painel sem controles e preserva o original', async () => {
  const original = panel(); const png = new Blob(['png'], { type: 'image/png' });
  original.style.fontFamily = '"Plus Jakarta Sans", sans-serif';
  toBlob.mockImplementation(async (clone: HTMLElement) => {
    expect(clone.isConnected).toBe(true);
    expect(clone.textContent).toContain('AJOTA');
    expect(clone.querySelector('[data-result-controls]')).toBeNull();
    expect(clone.getAttribute('aria-hidden')).toBe('true');
    expect(clone.style.fontFamily).toBe(getComputedStyle(original).fontFamily);
    return png;
  });
  expect(await resultImage(original)).toBe(png);
  expect(toBlob).toHaveBeenCalledWith(expect.any(HTMLElement), expect.objectContaining({ pixelRatio: 3 }));
  expect(document.body.children).toHaveLength(1);
  expect(original.querySelectorAll('[data-result-controls]')).toHaveLength(2);
});
it('remove a cópia temporária quando a geração falha', async () => {
  const original = panel(); toBlob.mockRejectedValue(new Error('Falha'));
  await expect(resultImage(original)).rejects.toThrow('Falha');
  expect(document.body.children).toHaveLength(1);
  expect(original.isConnected).toBe(true);
});

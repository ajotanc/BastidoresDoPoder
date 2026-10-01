import { GAME_NAME } from '@/constants/gameConfig';
import type { ResultSummary } from '@/game/resultSummary';
import dayjs from 'dayjs';

/** Export the rendered summary, keeping the same avatar, typography and layout. */
export async function resultImage(panel: HTMLElement): Promise<Blob> {
  const { toBlob, getFontEmbedCSS } = await import('html-to-image');
  await document.fonts.ready;
  const clone = panel.cloneNode(true) as HTMLElement;
  clone.querySelectorAll('[data-result-controls]').forEach(node => node.remove());
  clone.removeAttribute('id');
  clone.querySelectorAll('[id]').forEach(node => node.removeAttribute('id'));
  clone.setAttribute('aria-hidden', 'true');
  clone.inert = true;
  const width = Math.ceil(panel.getBoundingClientRect().width);
  if (width <= 0) throw new Error('O resumo não está mais disponível.');
  const typography = getComputedStyle(panel);
  Object.assign(clone.style, {
    position: 'fixed', left: '-100000px', top: '0', width: `${width}px`,
    maxWidth: 'none', height: 'auto', margin: '0', boxShadow: 'none',
    fontFamily: typography.fontFamily, fontSize: typography.fontSize,
    lineHeight: typography.lineHeight, color: typography.color,
  });
  document.body.append(clone);
  try {
    await Promise.all(Array.from(clone.querySelectorAll('img'), img => img.decode().catch(() => {})));
    // Keep every font subset: format filtering can discard Latin glyphs.
    const fontEmbedCSS = await getFontEmbedCSS(panel);
    const blob = await toBlob(clone, {
      fontEmbedCSS,
      pixelRatio: Math.max(2, 1080 / Math.max(1, width)),
      style: { position: 'static', left: 'auto', top: 'auto' },
    });
    if (!blob) throw new Error('Não foi possível criar a imagem.');
    return blob;
  } finally { clone.remove(); }
}
export async function shareResult(summary: ResultSummary, panel: HTMLElement): Promise<string> {
  const blob = await resultImage(panel);
  const timestamp = dayjs().unix();
  const filename = GAME_NAME.toLocaleLowerCase().replace(/\s/g, '-');

  const file = new File([blob], `${timestamp}-${filename}-${summary.roomCode}.png`, { type: 'image/png' });
  if (navigator.canShare?.({ files: [file] })) {
    try { await navigator.share({ files: [file], title: 'Bastidores do Poder' }); return ''; }
    catch (error) { if (error instanceof DOMException && error.name === 'AbortError') return ''; }
  }
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a'); anchor.href = url; anchor.download = file.name;
  anchor.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  return 'Imagem do resultado baixada.';
}

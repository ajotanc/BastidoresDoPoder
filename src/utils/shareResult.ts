import { durationLabel, type ResultSummary } from '@/game/resultSummary';

export async function resultImage(summary: ResultSummary): Promise<Blob> {
  await document.fonts.ready;
  const canvas = document.createElement('canvas');
  canvas.width = 1080;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Não foi possível criar a imagem.');
  const wrap = (text: string, font: string, width: number) => {
    ctx.font = font;
    const lines: string[] = [];
    let line = '';
    for (const word of text.split(/\s+/)) {
      const candidate = line ? `${line} ${word}` : word;
      if (ctx.measureText(candidate).width <= width) { line = candidate; continue; }
      if (line) lines.push(line);
      line = '';
      for (const character of word) {
        if (ctx.measureText(`${line}${character}`).width > width) { lines.push(line); line = ''; }
        line = `${line}${character}`;
      }
    }
    if (line) lines.push(line);
    return lines;
  };
  const title = wrap(`${summary.winnerName} conquistou o poder.`, 'bold 54px Cinzel, serif', 888);
  const details = wrap(summary.decisivePlay, '28px "Plus Jakarta Sans", sans-serif', 888);
  canvas.height = Math.max(780, 550 + title.length * 70 + details.length * 42);
  ctx.fillStyle = '#0b141b'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = '#b59a62'; ctx.lineWidth = 2; ctx.strokeRect(32, 32, 1016, canvas.height - 64);
  ctx.fillStyle = '#e8c474'; ctx.font = 'bold 23px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('BASTIDORES DO PODER', 96, 112);
  let y = 210;
  ctx.font = 'bold 54px Cinzel, serif';
  for (const line of title) { ctx.fillText(line, 96, y); y += 70; }
  ctx.fillStyle = '#b3c5d3'; ctx.font = '25px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(`Mesa ${summary.roomCode} · ${summary.turns} turnos · ${durationLabel(summary.durationSeconds)}`, 96, y + 12);
  y += 85; ctx.strokeStyle = '#685b3e'; ctx.beginPath(); ctx.moveTo(96, y); ctx.lineTo(984, y); ctx.stroke();
  y += 60; ctx.fillStyle = '#e8c474'; ctx.font = 'bold 24px Cinzel, serif'; ctx.fillText('JOGADA DECISIVA', 96, y);
  y += 48; ctx.fillStyle = '#d7e1e8'; ctx.font = '28px "Plus Jakarta Sans", sans-serif';
  for (const line of details) { ctx.fillText(line, 96, y); y += 42; }
  ctx.fillStyle = '#e8c474'; ctx.font = 'bold 27px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(`${summary.supports} ${summary.supports === 1 ? 'apoio ativo' : 'apoios ativos'} · C$ ${summary.coins}`, 96, canvas.height - 100);
  return new Promise((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Não foi possível criar a imagem.')), 'image/png'));
}
export async function shareResult(summary: ResultSummary): Promise<string> {
  const blob = await resultImage(summary);
  const file = new File([blob], `bastidores-mesa-${summary.roomCode}.png`, { type: 'image/png' });
  if (navigator.canShare?.({ files: [file] })) {
    try { await navigator.share({ files: [file], title: 'Bastidores do Poder' }); return ''; }
    catch (error) { if (error instanceof DOMException && error.name === 'AbortError') return ''; }
  }
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a'); anchor.href = url; anchor.download = file.name;
  anchor.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  return 'Imagem do resultado baixada.';
}

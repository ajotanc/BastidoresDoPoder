import { test, expect } from '@playwright/test';
import { DEFAULT_BOT_COUNT, MAX_BOTS_PER_ROOM } from '../src/constants/gameConfig';

test.use({ viewport: { width: 390, height: 844 } });

test('opção de bots acessível, quantidade padrão e limites', async ({ page }) => {
  await page.goto('/game');
  const toggle = page.getByRole('switch', { name: 'Adicionar bots à mesa' });
  const count = page.getByRole('spinbutton', { name: 'Quantidade de bots' });
  await expect(toggle).not.toBeChecked();
  await expect(count).toHaveCount(0);
  await toggle.focus();
  await page.keyboard.press('Space');
  await expect(toggle).toBeChecked();
  await expect(count).toHaveValue(String(DEFAULT_BOT_COUNT));
  await count.fill(String(MAX_BOTS_PER_ROOM + 1));
  await expect(page.getByRole('button', { name: 'Criar Nova Partida Online' })).toBeDisabled();
  await count.fill('1.5');
  await expect(page.getByRole('button', { name: 'Criar Nova Partida Online' })).toBeDisabled();
  await count.fill('1');
  await expect(page.getByRole('button', { name: 'Criar Nova Partida Online' })).toBeEnabled();
  await toggle.uncheck();
  await expect(count).toHaveCount(0);
  const box = await toggle.boundingBox();
  expect(box!.height).toBe(44);
  expect(box!.width).toBe(48);
  await page.locator('label[for="play-against-bots"]').click();
  await expect(toggle).toBeChecked();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test('sala online com bots joga e devolve o turno ao humano', async ({ page }) => {
  test.skip(process.env.BDP_LIVE_PEER_TEST !== '1', 'Usa o PeerServer real.');
  test.setTimeout(90000);
  await page.goto('/game');
  await page.getByRole('switch', { name: 'Adicionar bots à mesa' }).check();
  await page.getByRole('button', { name: 'Criar Nova Partida Online' }).click();
  await expect(page.getByText('Sala de Articulação Política')).toBeVisible({ timeout: 30000 });
  await expect(page.locator('.lobby-player').filter({ hasText: 'Bot:' })).toHaveCount(DEFAULT_BOT_COUNT);
  await page.getByRole('button', { name: 'Iniciar disputa', exact: true }).click();
  await page.getByRole('button', { name: 'Escolher ação do turno' }).click();
  await page.getByRole('dialog').getByRole('button', { name: /Salário Oficial/ }).click();
  await page.getByRole('button', { name: 'Declarar no Plenário' }).click();
  const choose = page.getByRole('button', { name: 'Escolher ação do turno' });
  await expect(choose).toHaveCount(0);
  await expect(async () => {
    const pass = page.getByRole('button', { name: /Passar \/ Permitir|Não Bloquear|Aceitar Bloqueio/ });
    if (await pass.isVisible()) await pass.click();
    await expect(choose).toBeVisible({ timeout: 500 });
  }).toPass({ timeout: 30000, intervals: [500] });
  await expect(page.getByRole('alert')).toHaveCount(0);
  await page.getByRole('button', { name: 'Sair', exact: true }).click();
  await page.getByRole('button', { name: 'Sair da Mesa', exact: true }).click();
  await expect(page.getByRole('switch', { name: 'Adicionar bots à mesa' })).toBeVisible();
});

 test('Discord é opcional e não consulta Functions durante a configuração', async ({ page }) => {
  const requests: string[] = [];
  page.on('request', request => { if (request.url().includes('/.netlify/functions/')) requests.push(request.url()); });
  await page.goto('/game');
  const toggle = page.getByRole('switch', { name: 'Ativar conversa no Discord' });
  await expect(toggle).not.toBeChecked();
  await page.locator('label[for="enable-discord"]').click();
  await expect(toggle).toBeChecked();
  await toggle.uncheck();
  expect(requests).toEqual([]);
 });

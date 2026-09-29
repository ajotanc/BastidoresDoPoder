import { test, expect } from '@playwright/test';
import { MAX_BOTS_PER_ROOM } from '../src/constants/gameConfig';

test.use({ viewport: { width: 390, height: 844 } });

test('opção de bots acessível, quantidade padrão e limites', async ({ page }) => {
  await page.goto('/online');
  const checkbox = page.getByRole('checkbox', { name: 'Jogar contra bot' });
  const count = page.getByRole('spinbutton', { name: 'Quantidade de bots' });
  await expect(checkbox).not.toBeChecked();
  await expect(count).toHaveCount(0);
  await checkbox.focus();
  await page.keyboard.press('Space');
  await expect(checkbox).toBeChecked();
  await expect(count).toHaveValue('2');
  await count.fill(String(MAX_BOTS_PER_ROOM + 1));
  await expect(page.getByRole('button', { name: 'Criar Nova Partida Online' })).toBeDisabled();
  await count.fill('1.5');
  await expect(page.getByRole('button', { name: 'Criar Nova Partida Online' })).toBeDisabled();
  await count.fill('1');
  await expect(page.getByRole('button', { name: 'Criar Nova Partida Online' })).toBeEnabled();
  await checkbox.uncheck();
  await expect(count).toHaveCount(0);
  const box = await checkbox.boundingBox();
  expect(box!.height).toBeGreaterThanOrEqual(20);
  expect(box!.height).toBeLessThan(44);
  expect(box!.width).toBe(box!.height);
  await page.locator('label[for="play-against-bots"]').click();
  await expect(checkbox).toBeChecked();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test('sala online com dois bots joga e devolve o turno ao humano', async ({ page }) => {
  test.skip(process.env.BDP_LIVE_PEER_TEST !== '1', 'Usa o PeerServer real.');
  test.setTimeout(90000);
  await page.goto('/online');
  await page.getByRole('checkbox', { name: 'Jogar contra bot' }).check();
  await page.getByRole('button', { name: 'Criar Nova Partida Online' }).click();
  await expect(page.getByText('Sala de Articulação Política')).toBeVisible({ timeout: 30000 });
  await expect(page.locator('.lobby-player').filter({ hasText: '(Bot)' })).toHaveCount(2);
  await page.getByRole('button', { name: 'Iniciar disputa', exact: true }).click();
  await page.getByRole('button', { name: 'Escolher Ação do Turno' }).click();
  await page.getByRole('dialog').getByRole('button', { name: /Salário Oficial/ }).click();
  await page.getByRole('button', { name: 'Declarar no Plenário' }).click();
  const choose = page.getByRole('button', { name: 'Escolher Ação do Turno' });
  await expect(choose).toHaveCount(0);
  await expect(async () => {
    const pass = page.getByRole('button', { name: /Passar \/ Permitir|Não Bloquear|Aceitar Bloqueio/ });
    if (await pass.isVisible()) await pass.click();
    await expect(choose).toBeVisible({ timeout: 500 });
  }).toPass({ timeout: 30000, intervals: [500] });
  await expect(page.getByRole('alert')).toHaveCount(0);
  await page.getByRole('button', { name: 'Sair', exact: true }).click();
  await page.getByRole('button', { name: 'Sair da Mesa', exact: true }).click();
  await expect(page.getByRole('checkbox', { name: 'Jogar contra bot' })).toBeVisible();
});

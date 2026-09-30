import { test, expect } from '@playwright/test';

test('manual não carrega o módulo online até navegar para ele', async ({ page }) => {
  const scripts: string[] = [];
  page.on('request', request => {
    if (request.resourceType() === 'script') scripts.push(request.url());
  });
  await page.goto('/');
  await expect(page.locator('#cards')).toBeVisible();
  expect(scripts.some(url => /\/OnlineView-[^/]+\.js/.test(url))).toBe(false);

  await page.getByRole('button', { name: 'Jogar online', exact: true }).click();
  await expect(page.getByLabel('Seu Codinome Político')).toBeVisible();
  expect(scripts.some(url => /\/OnlineView-[^/]+\.js/.test(url))).toBe(true);

  await page.getByRole('button', { name: 'Ver regras', exact: true }).click();
  await expect(page.locator('#cards')).toBeVisible();
});

test('convite direto carrega a entrada sem carregar o manual', async ({ page }) => {
  const scripts: string[] = [];
  page.on('request', request => {
    if (request.resourceType() === 'script') scripts.push(request.url());
  });
  await page.goto('/game/TEST');
  await expect(page.getByLabel('Código da sala', { exact: true })).toHaveValue('TEST');
  expect(scripts.some(url => /\/ManualView-[^/]+\.js/.test(url))).toBe(false);
});

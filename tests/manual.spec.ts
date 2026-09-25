import { test, expect } from '@playwright/test';

test('search ignores accents and filters expose their state', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('searchbox').fill('barao');
  await expect(page.locator('#cards article')).toHaveCount(1);
  await expect(page.locator('#cards article h3')).toHaveText('Barão');
  await page.getByRole('button', { name: 'Economia & Negociação' }).click();
  await expect(page.getByRole('button', { name: 'Economia & Negociação' })).toHaveAttribute('aria-pressed', 'true');
});

test('modal traps focus, flips by keyboard and restores focus', async ({ page }) => {
  await page.goto('/');
  const opener = page.getByRole('button', { name: 'Ampliar carta Coronel', exact: true });
  await opener.click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  for (let i = 0; i < 8; i++) {
    await page.keyboard.press('Tab');
    expect(await page.evaluate(() => !!document.activeElement?.closest('[role="dialog"]'))).toBe(true);
  }
  const flip = page.getByRole('button', { name: 'Virar carta' });
  await flip.focus();
  await page.keyboard.press('Enter');
  await expect(flip).toHaveAttribute('aria-pressed', 'true');
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(opener).toBeFocused();
});

for (const width of [320, 360, 375, 1280]) {
  test(`card modal fits at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 812 });
    await page.goto('/');
    await page.getByRole('button', { name: 'Ampliar carta Articuladora', exact: true }).click();
    const flip = page.getByRole('button', { name: 'Virar carta' });
    await expect(flip).toBeVisible();
    const bounds = await flip.boundingBox();
    expect(bounds!.x).toBeGreaterThanOrEqual(0);
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(width);
    expect(await page.getByRole('dialog').evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
  });
}

test('skip link moves focus and deep links survive reload', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Enter');
  await expect(page.locator('main')).toBeFocused();
  await page.getByRole('navigation').getByRole('link', { name: 'Cartas', exact: true }).click();
  await expect(page).toHaveURL(/#cards$/);
  await expect(page.locator('#cards')).toBeFocused();
  await page.reload();
  await expect(page.locator('#cards')).toBeFocused();
});

test('dismissed installation hides consumed prompt until a new event', async ({ page }) => {
  await page.goto('/');
  const dispatch = () => page.evaluate(() => {
    const event = new Event('beforeinstallprompt', { cancelable: true });
    Object.assign(event, { prompt: async () => undefined, userChoice: Promise.resolve({ outcome: 'dismissed', platform: 'web' }) });
    window.dispatchEvent(event);
  });
  await dispatch();
  await page.getByRole('button', { name: 'Instalar App' }).click();
  await expect(page.getByRole('button', { name: 'Instalar App' })).toHaveCount(0);
  await dispatch();
  await expect(page.getByRole('button', { name: 'Instalar App' })).toBeVisible();
});

 test('switching from rules to art preserves the original trigger', async ({ page }) => {
  await page.goto('/');
  const opener = page.getByRole('button', { name: 'Ver regras e habilidades de Coronel', exact: true });
  await opener.click();
  await page.getByRole('button', { name: 'Ver arte da carta em 3D' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(1);
  expect(await page.evaluate(() => !!document.activeElement?.closest('[role="dialog"]'))).toBe(true);
  await page.keyboard.press('Escape');
  await expect(opener).toBeFocused();
});

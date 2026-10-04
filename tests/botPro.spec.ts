import { test, expect } from '@playwright/test';

for (const width of [320, 390, 1280]) {
  test(`Pro aparece no seletor, persiste e consta no manual em ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/game');
    await page.getByRole('switch', { name: 'Adicionar bots à mesa' }).check();
    const slider = page.getByRole('slider', { name: 'Nível dos bots' });
    await slider.focus();
    await page.keyboard.press('End');
    await expect(slider).toHaveAttribute('aria-valuemax', '3');
    await expect(slider).toHaveAttribute('aria-valuetext', 'Pro');
    await page.reload();
    await expect(slider).toHaveAttribute('aria-valuetext', 'Pro');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await slider.focus();
    await page.keyboard.press('ArrowLeft');
    await expect(slider).toHaveAttribute('aria-valuetext', 'Difícil');
    await page.goto('/');
    const section = page.locator('#online-mode');
    await expect(section.getByRole('heading', { name: 'A mesma mesa. Quatro desafios.' })).toBeVisible();
    await expect(section.getByRole('heading', { name: 'Pro', exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}

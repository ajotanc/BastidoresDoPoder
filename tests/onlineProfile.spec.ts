import { test, expect } from '@playwright/test';

test.use({ viewport: { width: 390, height: 844 } });

test('nome aleatório em inglês, regeneração e perfil salvo', async ({ page }) => {
  await page.goto('/game');
  const name = page.getByLabel('Seu Codinome Político');
  await expect(name).not.toHaveValue('');
  const first = await name.inputValue();
  expect(first.trim().split(/\s+/)).toHaveLength(2);
  await page.getByRole('button', { name: 'Gerar outro nome' }).click();
  await expect(name).not.toHaveValue(first);
  const second = await name.inputValue();
  expect(second.trim().split(/\s+/)).toHaveLength(2);
  await page.reload();
  await expect(name).toHaveValue(second);
  await name.fill('Nome escolhido');
  await name.blur();
  await page.reload();
  await expect(name).toHaveValue('Nome escolhido');
});

import { test, expect } from '@playwright/test';

test.describe('lobby em /game', () => {
  test('clicar no nome do nível move o slider dos bots', async ({ page }) => {
    await page.goto('/game');
    await page.getByRole('switch', { name: 'Adicionar bots à mesa' }).check();
    const slider = page.getByRole('slider', { name: 'Nível dos bots' });
    for (const level of ['Difícil', 'Fácil', 'Pro', 'Intermediário']) {
      await page.getByRole('button', { name: level, exact: true }).click();
      await expect(slider).toHaveAttribute('aria-valuetext', level);
      await expect(page.getByRole('button', { name: level, exact: true })).toHaveAttribute('aria-pressed', 'true');
    }
  });

  test('perfil fica ao lado do formulário no desktop e abaixo no celular', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/game');
    const name = page.getByLabel('Seu codinome político');
    const profile = page.getByRole('heading', { name: 'Escolha seu perfil' });
    const [nameBox, profileBox] = [await name.boundingBox(), await profile.boundingBox()];
    expect(profileBox!.x).toBeGreaterThan(nameBox!.x + nameBox!.width);
    await page.setViewportSize({ width: 390, height: 844 });
    const [mobileName, mobileProfile] = [await name.boundingBox(), await profile.boundingBox()];
    expect(mobileProfile!.y).toBeGreaterThan(mobileName!.y + mobileName!.height);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  });

  test('campos numéricos e de texto usam o mesmo estilo do seletor', async ({ page }) => {
    await page.goto('/game');
    const input = page.getByLabel('Seu codinome político');
    await expect(input).toHaveClass(/app-input/);
    await expect(input).toHaveCSS('background-color', 'rgb(16, 26, 36)');
    await input.focus();
    await expect(input).toHaveCSS('border-top-color', 'rgb(230, 191, 115)');
  });
});

test.describe('rotas', () => {
  test('o botão do cabeçalho alterna entre o manual e o lobby', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Jogar online' }).click();
    await expect(page).toHaveURL(/\/game$/);
    await expect(page.getByRole('button', { name: 'Ver regras' })).toBeVisible();
    await page.getByRole('button', { name: 'Ver regras' }).click();
    await expect(page).toHaveURL(/\/$/);
  });

  test('links antigos não existem mais e caem no manual', async ({ page }) => {
    for (const old of ['/online', '/game/ABC123', '/play/ABC123', '/jogar/ABC123']) {
      await page.goto(old);
      await expect(page).toHaveURL(/\/$/);
    }
  });

  test('convite em /room/:id abre a entrada com o código preenchido', async ({ page }) => {
    await page.goto('/room/AB12CD');
    await expect(page.getByLabel('Código da sala')).toHaveValue('AB12CD');
    await expect(page).toHaveURL(/\/room\/AB12CD$/);
  });
});

test('ao criar a sala a página volta ao topo', async ({ page }) => {
  test.skip(process.env.BDP_LIVE_PEER_TEST !== '1', 'Usa o PeerServer real.');
  test.setTimeout(90000);
  await page.setViewportSize({ width: 1280, height: 500 });
  await page.goto('/game');
  const create = page.getByRole('button', { name: 'Criar Nova Partida Online' });
  await create.scrollIntoViewIfNeeded();
  expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(200);
  await create.click();
  await expect(page.getByText('Sala de Articulação Política')).toBeVisible({ timeout: 30000 });
  await expect(page).toHaveURL(/\/room\/[A-Z0-9]+$/);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
});

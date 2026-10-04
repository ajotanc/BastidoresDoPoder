import { test, expect } from '@playwright/test';
import { ACTION_TIMEOUT_SECONDS, RESPONSE_TIMEOUT_SECONDS } from '../src/game/models/gameState';

test('dois navegadores entram na mesma sala pelo PeerServer real', async ({ browser }) => {
  test.skip(process.env.BDP_LIVE_PEER_TEST !== '1', 'Teste opt-in: usa o PeerServer de sinalização real.');
  const testTimeouts = process.env.BDP_LIVE_TIMEOUT_TEST === '1';
  test.setTimeout(testTimeouts ? (ACTION_TIMEOUT_SECONDS * 2 + RESPONSE_TIMEOUT_SECONDS + 90) * 1000 : 90000);
  const hostContext = await browser.newContext({ serviceWorkers: 'block' });
  const guestContext = await browser.newContext({ serviceWorkers: 'block' });
  try {
    const host = await hostContext.newPage();
    const guest = await guestContext.newPage();
    for (const [name, page] of [['host', host], ['guest', guest]] as const) {
      page.on('pageerror', error => console.log(name, 'pageerror', error.message));
      page.on('console', message => { if (message.type() === 'error' || message.type() === 'warning') console.log(name, message.type(), message.text()); });
    }
    await host.goto('http://127.0.0.1:4174/game');
    await host.getByLabel('Seu Codinome Político').fill('Teste Host');
    await host.getByLabel('Enviar foto de perfil').setInputFiles('public/images/characters/colonel.webp');
    await expect(host.getByAltText('Sua foto de perfil')).toBeVisible();
    await host.reload();
    await expect(host.getByLabel('Seu Codinome Político')).toHaveValue('Teste Host');
    await expect(host.getByAltText('Sua foto de perfil')).toBeVisible();
    await host.getByRole('button', { name: 'Criar Nova Partida Online' }).click();
    await expect(host.getByText('Sala de Articulação Política')).toBeVisible({ timeout: 30000 });
    const url = host.url();
    await guest.goto(url);
    await guest.getByLabel('Seu Codinome Político').fill('Teste Convidado');
    await guest.getByRole('button', { name: 'Entrar na Sala P2P', exact: true }).click();
    await expect(guest.getByText('Sala de Articulação Política')).toBeVisible({ timeout: 30000 });
    await expect(host.getByText('Teste Convidado', { exact: true })).toBeVisible();
    await expect(guest.locator('img[src^="data:image/jpeg;base64,"]')).toHaveCount(1);
    await guest.getByRole('button', { name: 'Marcar como Pronto' }).click();
    await expect(host.getByRole('button', { name: 'Iniciar disputa', exact: true })).toBeEnabled();
    await host.getByRole('button', { name: 'Iniciar disputa', exact: true }).click();
    await expect(guest.getByText('Seu Gabinete')).toBeVisible();
    // Exercita campos opcionais de ActionIntent também pelo transporte real.
    for (const page of [host, guest]) {
      await page.getByRole('button', { name: 'Escolher Ação do Turno' }).click();
      await page.getByRole('dialog').getByRole('button', { name: /Salário Oficial/ }).click();
      await page.getByRole('button', { name: 'Declarar no Plenário' }).click();
    }
    await expect(guest.getByRole('button', { name: 'Escolher Ação do Turno' })).toHaveCount(0);
    await expect(host.getByRole('button', { name: 'Escolher Ação do Turno' })).toBeVisible();
    await expect(guest.getByRole('alert')).toHaveCount(0);
    if (testTimeouts) {
    // Depois de uma rodada manual, ambos ficam sem agir: o host deve executar
    // a ação automática e passar o turno, mantendo a sala e o heartbeat ativos.
    await expect(guest.getByRole('button', { name: 'Escolher Ação do Turno' })).toBeEnabled({ timeout: (ACTION_TIMEOUT_SECONDS + 15) * 1000 });
    await expect(host.getByRole('button', { name: 'Escolher Ação do Turno' })).toHaveCount(0);
    await expect(host.getByText('Poder Supremo Conquistado')).toHaveCount(0);
    await expect(host.getByRole('button', { name: 'Escolher Ação do Turno' })).toBeEnabled({ timeout: (ACTION_TIMEOUT_SECONDS + 15) * 1000 });
    await expect(guest.getByRole('button', { name: 'Escolher Ação do Turno' })).toHaveCount(0);
    await expect(guest.getByRole('alert')).toHaveCount(0);
    await host.getByRole('button', { name: 'Escolher Ação do Turno' }).click();
    await host.getByRole('dialog').getByRole('button', { name: /Vaquinha Virtual/ }).click();
    await host.getByRole('button', { name: 'Declarar no Plenário' }).click();
    // Sem resposta à Vaquinha, a janela expira e a ação também deve concluir.
    await expect(guest.getByRole('button', { name: 'Escolher Ação do Turno' })).toBeVisible({ timeout: (RESPONSE_TIMEOUT_SECONDS + 15) * 1000 });
    }
    await guest.getByRole('button', { name: 'Sair', exact: true }).click();
    await guest.getByRole('dialog', { name: 'Sair da mesa' }).getByRole('button', { name: 'Sair da Mesa', exact: true }).click();
    await expect(guest).toHaveURL(/\/game$/);
    await expect(guest.getByText(/Você foi convidado/)).toHaveCount(0);
    await expect(host.getByText('Poder Supremo Conquistado')).toBeVisible();
    await expect(host.getByRole('heading', { name: 'Teste Host', exact: true })).toBeVisible();
    await expect(host.getByText('2 / 24', { exact: true })).toBeVisible();
    const discard = host.locator('section').filter({ has: host.getByText('Últimos Apoios Revelados:', { exact: true }) });
    await expect(discard.getByText('Abandono da partida', { exact: true })).toHaveCount(2);
  } finally {
    await guestContext.close();
    await hostContext.close();
  }
});


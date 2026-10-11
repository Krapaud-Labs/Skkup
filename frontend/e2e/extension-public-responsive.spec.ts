import { expect, test } from '@playwright/test';

const webStoreUrl = 'https://chromewebstore.google.com/detail/skkup/ajececidgjfpacommefhibbcfoakopil?hl=fr&utm_source=ext_sidebar';

async function mockSession(page: import('@playwright/test').Page, authenticated: boolean) {
  await page.route('**/auth/session', async (route) => {
    await route.fulfill({
      status: authenticated ? 200 : 401,
      contentType: 'application/json',
      body: JSON.stringify(authenticated ? {
        authentifie: true,
        profil: { id: 'qa-extension-user', email: 'qa-extension@example.test', pseudo: 'qa-extension', soldePoints: 0, streakActuel: 0, streakMax: 0, derniereVisiteAt: null, createdAt: '2026-10-01T10:00:00.000Z', role: 'VIEWER' },
      } : { message: 'Non authentifié' }),
    });
  });
}

async function mockPairings(page: import('@playwright/test').Page, status = 200) {
  await page.route('**/extension/pairings', async (route) => {
    await route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify(status === 200 ? { appareils: [] } : { message: 'Appareils indisponibles.' }),
    });
  });
}

for (const viewport of [
  { name: 'desktop-1280', width: 1280, height: 900 },
  { name: 'tablet-768', width: 768, height: 1024 },
  { name: 'mobile-390', width: 390, height: 844 },
]) {
  test(`extension publique responsive et pairing mocké ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await mockSession(page, true);
    await mockPairings(page);
    await page.route('**/extension/pairing-token', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 'QA-123456', expireAt: '2030-10-20T18:05:00.000Z' }) });
    });
    await page.goto('/extension', { waitUntil: 'domcontentloaded' });

    await expect(page.locator('main').first()).toBeVisible();
    await expect(page.getByRole('heading', { name: /Associe ton navigateur|extension/i }).first()).toBeVisible();
    await expect(page.getByText(/Associer l['’]extension à ton compte|Pair Chrome/i)).toBeVisible();
    await expect(page.getByRole('link', { name: /Installer sur Chrome/ })).toHaveAttribute('href', webStoreUrl);
    await expect(page.getByText(/Aucun appareil associé|No paired device/i)).toBeVisible();

    await page.getByRole('button', { name: 'Générer un code' }).click();
    await expect(page.getByText('QA-123456')).toBeVisible();

    const layout = await page.evaluate(() => ({
      viewport: window.innerWidth,
      documentWidth: document.documentElement.scrollWidth,
      bodyWidth: document.body.scrollWidth,
    }));
    expect(layout.viewport).toBe(viewport.width);
    expect(layout.documentWidth).toBeLessThanOrEqual(layout.viewport);
    expect(layout.bodyWidth).toBeLessThanOrEqual(layout.viewport);

    await page.screenshot({
      path: `test-results/dash-v3-design/extension/extension-${viewport.name}.png`,
      fullPage: true,
    });
  });
}

test('extension publique affiche une erreur de pairing récupérable', async ({ page }) => {
  await mockSession(page, true);
  await mockPairings(page, 503);
  await page.goto('/extension', { waitUntil: 'domcontentloaded' });

  await expect(page.getByText('Appareils indisponibles.')).toBeVisible();
  await expect(page.getByText(/Actualiser l.état|Refresh status/i)).toBeVisible();
});

test('extension publique conserve la vitrine et propose la connexion au visiteur anonyme', async ({ page }) => {
  await mockSession(page, false);
  await mockPairings(page, 401);
  await page.goto('/extension', { waitUntil: 'domcontentloaded' });

  await expect(page).toHaveURL(/\/extension$/);
  await expect(page.getByText('Connecte-toi pour associer et gérer tes appareils.')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Se connecter' })).toHaveAttribute('href', '/connexion');
});

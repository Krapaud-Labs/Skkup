import { expect, test } from '@playwright/test';

const webStoreUrl = 'https://chromewebstore.google.com/detail/skkup/ajececidgjfpacommefhibbcfoakopil?hl=fr&utm_source=ext_sidebar';

async function mockAuthenticatedDashboard(page: import('@playwright/test').Page) {
  await page.route('**/auth/session', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ authentifie: true, profil: { id: 'qa-dashboard-extension', email: 'qa-dashboard@example.test', pseudo: 'qa-dashboard', soldePoints: 120, streakActuel: 2, streakMax: 5, derniereVisiteAt: '2026-10-10T10:00:00.000Z', createdAt: '2026-10-01T10:00:00.000Z', role: 'VIEWER' } }),
    });
  });
  await page.route('**/me', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ id: 'qa-dashboard-extension', email: 'qa-dashboard@example.test', pseudo: 'qa-dashboard', soldePoints: 120, streakActuel: 2, streakMax: 5, derniereVisiteAt: '2026-10-10T10:00:00.000Z', createdAt: '2026-10-01T10:00:00.000Z', role: 'VIEWER' }),
    });
  });
  await page.route('**/api/me', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ id: 'qa-dashboard-extension', email: 'qa-dashboard@example.test', pseudo: 'qa-dashboard', soldePoints: 120, streakActuel: 2, streakMax: 5, derniereVisiteAt: '2026-10-10T10:00:00.000Z', createdAt: '2026-10-01T10:00:00.000Z', role: 'VIEWER' }),
    });
  });
  await page.route('**/extension/pairings', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ appareils: [] }) });
  });
}

for (const langue of [
  { code: 'fr', title: 'Associe Chrome', description: 'Génère un code temporaire pour relier l’extension Chrome à ton compte sans exposer ton mot de passe.', pairing: 'Associer l’extension à ton compte', empty: 'Aucun appareil associé.', install: 'Installer l’extension Skkup depuis le Chrome Web Store' },
  { code: 'en', title: 'Pair Chrome', description: 'Generate a temporary code to link the Chrome extension to your account without exposing your password.', pairing: 'Pair the extension with your account', empty: 'No paired devices.', install: 'Install the Skkup extension from the Chrome Web Store' },
]) {
  for (const viewport of [
    { name: 'desktop-1280', width: 1280, height: 900 },
    { name: 'mobile-390', width: 390, height: 844 },
  ]) {
    test(`dashboard extension ${langue.code} ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.addInitScript((value) => window.localStorage.setItem('skkup-language', value), langue.code);
      await mockAuthenticatedDashboard(page);
      await page.goto('/dashboard/extension', { waitUntil: 'domcontentloaded' });

      await expect(page.getByRole('heading', { name: langue.title })).toBeVisible();
      await expect(page.getByText(langue.description)).toBeVisible();
      await expect(page.getByRole('link', { name: langue.install })).toHaveAttribute('href', webStoreUrl);
      await expect(page.getByRole('heading', { name: langue.pairing })).toBeVisible();
      await expect(page.getByText(langue.empty)).toBeVisible();
      await expect(page.getByRole('heading', { name: langue.code === 'fr' ? 'Navigateurs compatibles' : 'Supported browsers' })).toBeAttached();

      const layout = await page.evaluate(() => ({
        viewport: window.innerWidth,
        documentWidth: document.documentElement.scrollWidth,
        bodyWidth: document.body.scrollWidth,
      }));
      expect(layout.viewport).toBe(viewport.width);
      expect(layout.documentWidth).toBeLessThanOrEqual(layout.viewport);
      expect(layout.bodyWidth).toBeLessThanOrEqual(layout.viewport);
    });
  }
}

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
      const installLink = page.getByTestId('extension-install-link');
      await expect(installLink).toHaveAttribute('target', '_blank');
      await expect(installLink).toHaveAttribute('rel', 'noopener noreferrer');
      const installGeometry = await installLink.evaluate((element) => {
        const rect = element.getBoundingClientRect();
        return { width: rect.width, right: rect.right, viewport: window.innerWidth };
      });
      expect(installGeometry.width).toBeLessThanOrEqual(280);
      expect(installGeometry.right).toBeLessThanOrEqual(installGeometry.viewport);
      await expect(page.getByRole('heading', { name: langue.pairing })).toBeVisible();
      await expect(page.getByText(langue.empty)).toBeVisible();
      await expect(page.getByText(langue.code === 'fr' ? 'Plateformes compatibles' : 'Supported platforms', { exact: true })).toBeAttached();
      const stepGeometry = await page.evaluate(() => {
        const panel = document.querySelector('[data-testid="extension-unified-panel"]')!.getBoundingClientRect();
        const row = document.querySelector('[data-testid="extension-step-row"]')!.getBoundingClientRect();
        const cards = [...document.querySelector('[data-testid="extension-step-row"]')!.querySelectorAll('[data-testid^="extension-step-"]')].map((element) => {
          const rect = element.getBoundingClientRect();
          return { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom, width: rect.width };
        });
        return { panel: { left: panel.left, right: panel.right }, row: { left: row.left, right: row.right }, cards };
      });
      expect(stepGeometry.cards).toHaveLength(3);
      expect(stepGeometry.cards[0].left).toBeGreaterThan(stepGeometry.panel.left);
      expect(stepGeometry.cards[2].right).toBeLessThan(stepGeometry.panel.right);
      const stepWidths = stepGeometry.cards.map((card) => card.width);
      expect(Math.max(...stepWidths) - Math.min(...stepWidths)).toBeLessThanOrEqual(1);

      const pairingPanels = page.getByTestId('extension-pairing-grid').locator(':scope > [data-testid$="-panel"]');
      await expect(pairingPanels).toHaveCount(2);
      const panelBoxes = await pairingPanels.evaluateAll((elements) => elements.map((element) => {
        const rect = element.getBoundingClientRect();
        return { left: Math.round(rect.left), width: Math.round(rect.width), height: Math.round(rect.height), top: Math.round(rect.top), bottom: Math.round(rect.bottom) };
      }));
      if (viewport.width >= 1280) {
        expect(Math.abs(panelBoxes[0].width - panelBoxes[1].width)).toBeLessThanOrEqual(1);
        expect(Math.abs(panelBoxes[0].height - panelBoxes[1].height)).toBeLessThanOrEqual(1);
        expect(Math.abs(panelBoxes[0].top - panelBoxes[1].top)).toBeLessThanOrEqual(1);
        expect(Math.abs(panelBoxes[0].bottom - panelBoxes[1].bottom)).toBeLessThanOrEqual(1);
      } else {
        expect(panelBoxes[1].top).toBeGreaterThanOrEqual(panelBoxes[0].bottom - 1);
      }

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

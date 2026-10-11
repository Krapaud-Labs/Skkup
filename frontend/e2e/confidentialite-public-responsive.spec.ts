import { expect, test } from '@playwright/test';

async function mockSession(page: import('@playwright/test').Page) {
  await page.route('**/auth/session', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ authentifie: false, profil: null }) });
  });
}

async function mockPrivacy(page: import('@playwright/test').Page, body: unknown, status = 200) {
  await page.route('**/content/LEGAL/politique-confidentialite*', async (route) => {
    await route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
  });
}

for (const viewport of [
  { name: 'desktop-1280', width: 1280, height: 900 },
  { name: 'tablet-768', width: 768, height: 1024 },
  { name: 'mobile-390', width: 390, height: 844 },
]) {
  test(`confidentialité publique fallback responsive ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await mockSession(page);
    await mockPrivacy(page, { message: 'Contenu indisponible' }, 503);
    await page.goto('/confidentialite', { waitUntil: 'domcontentloaded' });

    await expect(page.locator('main').first()).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Politique de confidentialité' })).toBeVisible();
    await expect(page.getByRole('heading', { name: '1. Responsable du traitement' })).toBeVisible();
    await expect(page.getByRole('heading', { name: '6. Vos droits' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Lire le règlement du jeu' })).toHaveAttribute('href', '/reglement');
    await expect(page.getByRole('link', { name: "Retour à l'accueil" })).toHaveAttribute('href', '/');

    const layout = await page.evaluate(() => ({
      viewport: window.innerWidth,
      documentWidth: document.documentElement.scrollWidth,
      bodyWidth: document.body.scrollWidth,
    }));
    expect(layout.viewport).toBe(viewport.width);
    expect(layout.documentWidth).toBeLessThanOrEqual(layout.viewport);
    expect(layout.bodyWidth).toBeLessThanOrEqual(layout.viewport);

    await page.screenshot({
      path: `test-results/dash-v3-design/confidentialite/confidentialite-fallback-${viewport.name}.png`,
      fullPage: true,
      animations: 'disabled',
      scale: 'css',
    });
  });
}

test('confidentialité publique affiche le contenu API contractuel', async ({ page }) => {
  await mockSession(page);
  await mockPrivacy(page, {
    data: {
      title: 'Politique API QA',
      intro: 'Version contractuelle servie par l’API.',
      sections: [
        { heading: 'Section API données', body: 'Données contractuelles.' },
        { heading: 'Section API droits', body: 'Droits contractuels.' },
      ],
    },
  });
  await page.goto('/confidentialite', { waitUntil: 'domcontentloaded' });

  await expect(page.getByRole('heading', { name: 'Politique API QA' })).toBeVisible();
  await expect(page.getByText('Version contractuelle servie par l’API.')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Section API données' })).toBeVisible();
  await expect(page.getByText('Données contractuelles.')).toBeVisible();
  await expect(page.getByRole('heading', { name: '1. Responsable du traitement' })).toHaveCount(0);
});

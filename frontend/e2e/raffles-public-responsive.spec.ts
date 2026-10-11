import { expect, test } from '@playwright/test';

const tirages = [
  {
    id: 'raffle-open-e2e',
    titre: 'Tirage ouvert QA',
    description: 'Une récompense contractuelle disponible.',
    dateOuverture: '2026-10-01T10:00:00.000Z',
    dateTirage: '2030-10-20T18:00:00.000Z',
    statut: 'OUVERT',
    resultatPublieAt: null,
    ticketsDistribues: 12,
    lots: [{ id: 'lot-open-e2e', nom: 'Carte cadeau', valeurEstimee: 50, quantite: 1, fournisseur: 'Partenaire QA', imageUrl: null }],
  },
  {
    id: 'raffle-published-e2e',
    titre: 'Tirage publié QA',
    description: 'Résultat public disponible.',
    dateOuverture: '2026-09-01T10:00:00.000Z',
    dateTirage: '2026-09-20T18:00:00.000Z',
    statut: 'TIRE',
    resultatPublieAt: '2026-09-20T18:01:00.000Z',
    ticketsDistribues: 24,
    lots: [{ id: 'lot-published-e2e', nom: 'Console QA', valeurEstimee: 300, quantite: 1, fournisseur: 'Partenaire QA', imageUrl: null }],
  },
];

async function mockRaffles(page: import('@playwright/test').Page, body: unknown) {
  await page.route('**/raffles', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(body),
    });
  });
}

for (const viewport of [
  { name: 'desktop-1280', width: 1280, height: 900 },
  { name: 'tablet-768', width: 768, height: 1024 },
  { name: 'mobile-390', width: 390, height: 844 },
]) {
  test(`tirages publics responsive ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await mockRaffles(page, tirages);
    await page.goto('/tirages', { waitUntil: 'domcontentloaded' });

    await expect(page.locator('main').first()).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Tirage ouvert QA' })).toBeVisible();
    await expect(page.getByRole('tablist', { name: 'Statut des tirages' })).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Rechercher un tirage' })).toBeVisible();
    await expect(page.getByRole('tab', { name: /Tous/ })).toBeVisible();
    await expect(page.getByRole('tab', { name: /Ouvert|Open/ })).toBeVisible();
    await expect(page.getByRole('tab', { name: /Tiré|Result published/ })).toBeVisible();

    const layout = await page.evaluate(() => ({
      viewport: window.innerWidth,
      documentWidth: document.documentElement.scrollWidth,
      bodyWidth: document.body.scrollWidth,
    }));
    expect(layout.viewport).toBe(viewport.width);
    expect(layout.documentWidth).toBeLessThanOrEqual(layout.viewport);
    expect(layout.bodyWidth).toBeLessThanOrEqual(layout.viewport);

    await page.screenshot({
      path: `test-results/dash-v3-design/raffles/raffles-${viewport.name}.png`,
      fullPage: true,
    });
  });
}

test('tirages publics affiche le lien règlement à l’état vide', async ({ page }) => {
  await mockRaffles(page, []);
  await page.goto('/tirages', { waitUntil: 'domcontentloaded' });

  await expect(page.getByText(/Aucun tirage|No draw/)).toBeVisible();
  await expect(page.getByRole('link', { name: 'Lire le règlement' })).toHaveAttribute('href', '/reglement');
});

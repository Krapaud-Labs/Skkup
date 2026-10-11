import { expect, test } from '@playwright/test';

const fallbackHeadings = [/Article 1\. (Organisateur|Organiser)/, /Article 4\. (Obtention des points et des tickets|Earning points and tickets)/, /Article 13\. (Réclamations et droit applicable|Claims and applicable law)/];

async function mockSession(page: import('@playwright/test').Page) {
  await page.route('**/me', async (route) => {
    await route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ message: 'Non authentifié' }) });
  });
}

async function mockReglement(page: import('@playwright/test').Page, body: unknown, status = 200) {
  await page.route('**/content/LEGAL/reglement*', async (route) => {
    await route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
  });
}

for (const viewport of [
  { name: 'desktop-1280', width: 1280, height: 900 },
  { name: 'tablet-768', width: 768, height: 1024 },
  { name: 'mobile-390', width: 390, height: 844 },
]) {
  test(`règlement public fallback responsive ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await mockSession(page);
    await mockReglement(page, { message: 'Contenu non disponible' }, 503);
    await page.goto('/reglement', { waitUntil: 'domcontentloaded' });

    await expect(page.locator('main').first()).toBeVisible();
    await expect(page.getByRole('heading', { name: /Règlement du jeu|Game rules/ }).first()).toBeVisible();
    for (const heading of fallbackHeadings) {
      await expect(page.getByRole('heading', { name: heading })).toBeVisible();
    }
    await expect(page.getByRole('link', { name: /Accueil Skkup|Skkup home/ })).toHaveAttribute('href', '/');
    await expect(page.getByRole('link', { name: 'FAQ' })).toHaveAttribute('href', '/faq');
    await expect(page.getByRole('link', { name: /Tirages|Draws|Shop/ })).toHaveAttribute('href', '/tirages');

    const layout = await page.evaluate(() => ({
      viewport: window.innerWidth,
      documentWidth: document.documentElement.scrollWidth,
      bodyWidth: document.body.scrollWidth,
    }));
    expect(layout.viewport).toBe(viewport.width);
    expect(layout.documentWidth).toBeLessThanOrEqual(layout.viewport);
    expect(layout.bodyWidth).toBeLessThanOrEqual(layout.viewport);

    await page.screenshot({
      path: `test-results/dash-v3-design/reglement/reglement-fallback-${viewport.name}.png`,
      fullPage: true,
    });
  });
}

test('règlement public utilise le contenu API contractuel', async ({ page }) => {
  await mockSession(page);
  await mockReglement(page, {
    data: {
      sections: [
        { heading: 'Section API 1', body: 'Contenu API contractuel.' },
        { heading: 'Section API 2', body: 'Deuxième section API.' },
      ],
    },
  });
  await page.goto('/reglement', { waitUntil: 'domcontentloaded' });

  await expect(page.getByRole('heading', { name: 'Section API 1' })).toBeVisible();
  await expect(page.getByText('Contenu API contractuel.')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Article 1. Organisateur' })).toHaveCount(0);
});

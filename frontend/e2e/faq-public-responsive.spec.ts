import { expect, test } from '@playwright/test';

const questions = [
  'Qu’est-ce que Skkup ?',
  'Comment sont validés les points ?',
  'Dois-je acheter quelque chose ?',
  'Où voir les lots et les tirages ?',
];

async function mockFaqContent(page: import('@playwright/test').Page) {
  await page.route('**/content/FAQ/faq*', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({}) });
  });
}

for (const viewport of [
  { name: 'desktop-1280', width: 1280, height: 900 },
  { name: 'tablet-768', width: 768, height: 1024 },
  { name: 'mobile-390', width: 390, height: 844 },
]) {
  test(`FAQ publique responsive ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await mockFaqContent(page);
    await page.goto('/faq', { waitUntil: 'domcontentloaded' });

    await expect(page.locator('main').first()).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Questions fréquentes' })).toBeVisible();
    await expect(page.getByText('Tout ce qu’il faut savoir pour regarder, suivre ses points et comprendre les tirages Skkup.')).toBeVisible();
    for (const question of questions) {
      await expect(page.getByRole('heading', { name: question })).toBeVisible();
    }
    await expect(page.getByRole('link', { name: 'Retour à l’accueil' })).toHaveAttribute('href', '/');

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

test('FAQ publique expose un état visible et son lien de retour', async ({ page }) => {
  await mockFaqContent(page);
  await page.goto('/faq', { waitUntil: 'domcontentloaded' });

  await expect(page.locator('main').first()).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Questions fréquentes' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Retour à l’accueil' })).toBeVisible();
  await expect(page.locator('script[type="application/ld+json"]')).toHaveCount(1);
});

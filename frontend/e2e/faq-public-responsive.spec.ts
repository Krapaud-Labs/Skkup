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
    await page.screenshot({
      path: `test-results/dash-v3-design/faq/faq-${viewport.name}.png`,
      fullPage: true,
    });
  });
}

test('FAQ publique expose un état visible et son lien de retour', async ({ page }) => {
  await mockFaqContent(page);
  await page.goto('/faq', { waitUntil: 'domcontentloaded' });

  await expect(page.locator('main').first()).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Questions fréquentes' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Retour à l’accueil' })).toBeVisible();
  const structuredData = JSON.parse(await page.locator('script[type="application/ld+json"]').textContent() ?? '{}') as { mainEntity?: Array<{ name?: string; acceptedAnswer?: { text?: string } }> };
  expect(structuredData.mainEntity?.[0]?.name).toBe('Qu’est-ce que Skkup ?');
  expect(structuredData.mainEntity?.[0]?.acceptedAnswer?.text).toContain('découvrir des streams');
});

test('FAQ publique conserve son fallback quand l’API de contenu échoue', async ({ page }) => {
  await page.route('**/content/FAQ/faq*', async (route) => {
    await route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ message: 'Service indisponible' }) });
  });
  await page.goto('/faq', { waitUntil: 'domcontentloaded' });

  await expect(page.getByRole('heading', { name: 'Questions fréquentes' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Qu’est-ce que Skkup ?' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Retour à l’accueil' })).toHaveAttribute('href', '/');
});

test('FAQ publique affiche le contenu administrable valide', async ({ page }) => {
  await page.route('**/content/FAQ/faq*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        title: 'FAQ administrable QA',
        intro: 'Introduction publiée pour la vérification QA.',
        faq: [{ question: 'Question publiée QA', answer: 'Réponse publiée QA.' }],
      }),
    });
  });
  await page.goto('/faq', { waitUntil: 'domcontentloaded' });

  await expect(page.getByRole('heading', { name: 'FAQ administrable QA' })).toBeVisible();
  await expect(page.getByText('Introduction publiée pour la vérification QA.')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Question publiée QA' })).toBeVisible();
  await expect(page.getByText('Réponse publiée QA.')).toBeVisible();
});

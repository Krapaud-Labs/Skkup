import { expect, test } from '@playwright/test';

const streams = [
  {
    id: 'stream-contract-twitch',
    plateforme: 'TWITCH',
    identifiantChaine: 'qa_twitch',
    nomAffiche: 'Chaîne Twitch QA',
    thumbnailUrl: 'https://cdn.example.test/qa-twitch.jpg',
    estPartenaire: true,
    bonusPointsHeure: 12,
  },
  {
    id: 'stream-contract-youtube',
    plateforme: 'YOUTUBE',
    identifiantChaine: 'UCqaYoutube',
    nomAffiche: 'Chaîne YouTube QA',
    thumbnailUrl: 'https://cdn.example.test/qa-youtube.jpg',
    estPartenaire: false,
  },
  {
    id: 'stream-contract-facebook',
    plateforme: 'FACEBOOK',
    identifiantChaine: 'qa-facebook',
    nomAffiche: 'Chaîne Facebook QA',
    thumbnailUrl: null,
    estPartenaire: false,
  },
];

async function mockStreams(page: import('@playwright/test').Page, body: unknown) {
  await page.route(/\/(?:api\/)?streams(?:\?.*)?$/, async (route) => {
    if (!['fetch', 'xhr'].includes(route.request().resourceType())) {
      await route.continue();
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ streams: body }),
    });
  });
}

for (const viewport of [
  { name: 'desktop-1280', width: 1280, height: 900 },
  { name: 'tablet-768', width: 768, height: 1024 },
  { name: 'mobile-390', width: 390, height: 844 },
]) {
  test(`streams publics responsive ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.addInitScript(() => {
      window.localStorage.setItem('skkup-language', 'fr');
    });
    await mockStreams(page, streams);
    await page.goto('/streams', { waitUntil: 'domcontentloaded' });

    await expect(page.locator('main').first()).toBeVisible();
    await expect(page.getByRole('heading', { name: /Chaînes proposées|Featured channels/ })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Chaîne Twitch QA' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Chaîne YouTube QA' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Chaîne Facebook QA' })).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Rechercher un streamer' })).toBeVisible();
    await expect(page.getByRole('combobox', { name: 'Filtrer par plateforme' })).toBeVisible();
    await expect(page.getByRole('combobox', { name: 'Trier les streams' })).toBeVisible();

    await page.getByRole('textbox', { name: 'Rechercher un streamer' }).fill('YouTube QA');
    await expect(page.getByRole('heading', { name: 'Chaîne YouTube QA' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Chaîne Twitch QA' })).toBeHidden();
    await page.getByRole('textbox', { name: 'Rechercher un streamer' }).fill('');

    await page.getByRole('button', { name: /Twitch 1/ }).click();
    await expect(page.getByRole('heading', { name: 'Chaîne Twitch QA' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Chaîne YouTube QA' })).toBeHidden();

    const layout = await page.evaluate(() => ({
      viewport: window.innerWidth,
      documentWidth: document.documentElement.scrollWidth,
      bodyWidth: document.body.scrollWidth,
    }));
    expect(layout.viewport).toBe(viewport.width);
    expect(layout.documentWidth).toBeLessThanOrEqual(layout.viewport);
    expect(layout.bodyWidth).toBeLessThanOrEqual(layout.viewport);

    await page.screenshot({
      path: `test-results/dash-v3-design/streams/streams-${viewport.name}.png`,
      fullPage: true,
    });
  });
}

test('streams publics affiche le lien extension à l’état vide', async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem('skkup-language', 'fr');
  });
  await mockStreams(page, []);
  await page.goto('/streams', { waitUntil: 'domcontentloaded' });

  await expect(page.getByText(/Le catalogue Skkup est vide|The Skkup catalogue is empty/)).toBeVisible();
  await expect(page.getByRole('link', { name: 'Configurer l’extension' })).toHaveAttribute('href', '/extension');
});

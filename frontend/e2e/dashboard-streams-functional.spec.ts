import { expect, test, type Page } from '@playwright/test';

const catalogue = [
  { id: 'qa-twitch', plateforme: 'TWITCH', identifiantChaine: 'qa_twitch', nomAffiche: 'Chaîne Twitch QA' },
  { id: 'qa-youtube', plateforme: 'YOUTUBE', identifiantChaine: 'UCqaYoutube', nomAffiche: 'Chaîne YouTube QA' },
  { id: 'qa-facebook', plateforme: 'FACEBOOK', identifiantChaine: 'qa-facebook', nomAffiche: 'Chaîne Facebook QA' },
];

async function mockStreams(page: Page, handler: (requestCount: number) => { status: number; body: unknown }) {
  let requestCount = 0;
  await page.route('**/*', async (route) => {
    const pathname = new URL(route.request().url()).pathname;
    if (!route.request().resourceType().match(/xhr|fetch/) || !pathname.replace(/\/+$/, '').endsWith('/streams') || pathname.includes('/dashboard')) {
      await route.continue();
      return;
    }
    requestCount += 1;
    const response = handler(requestCount);
    await route.fulfill({
      status: response.status,
      contentType: 'application/json',
      body: JSON.stringify(response.body),
    });
  });
}

async function openDashboardStreams(page: Page, language: 'fr' | 'en' = 'fr') {
  const profil = { id: 'qa-streams-viewer', email: 'qa-streams@example.test', pseudo: 'qa-streams', soldePoints: 120, streakActuel: 2, streakMax: 5, derniereVisiteAt: null, createdAt: '2026-10-01T10:00:00.000Z', role: 'VIEWER' };
  await page.route('**/auth/session', async (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ authentifie: true, profil }) }));
  await page.route('**/me', async (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(profil) }));
  await page.addInitScript((locale) => window.localStorage.setItem('skkup-language', locale), language);
  await page.goto('/dashboard/streams', { waitUntil: 'domcontentloaded' });
}

test.describe('DASH-V3 viewer /dashboard/streams functional', () => {
  test('couvre le chargement puis le catalogue en français', async ({ page }) => {
    let releaseResponse!: () => void;
    const loading = new Promise<void>((resolve) => { releaseResponse = resolve; });
    await page.route('**/*', async (route) => {
      const pathname = new URL(route.request().url()).pathname;
      if (!route.request().resourceType().match(/xhr|fetch/) || !pathname.replace(/\/+$/, '').endsWith('/streams') || pathname.includes('/dashboard')) {
        await route.continue();
        return;
      }
      await loading;
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ streams: catalogue }) });
    });

    const navigation = openDashboardStreams(page, 'fr');
    await expect(page.getByRole('status', { name: /Chargement des chaînes/i })).toBeVisible();
    releaseResponse();
    await navigation;
    await expect(page.getByRole('heading', { name: 'Chaînes proposées' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Chaîne Twitch QA' })).toBeVisible();
  });

  test('couvre recherche, filtre plateforme et destinations externes', async ({ page }) => {
    await mockStreams(page, () => ({ status: 200, body: { streams: catalogue } }));
    await openDashboardStreams(page, 'fr');

    const search = page.getByRole('textbox', { name: 'Rechercher un streamer' });
    await expect(search).toBeVisible();
    await search.fill('YouTube QA');
    await expect(page.getByRole('heading', { name: 'Chaîne YouTube QA' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Chaîne Twitch QA' })).toBeHidden();

    await search.fill('');
    await page.getByRole('button', { name: /Twitch 1/ }).click();
    await expect(page.getByRole('heading', { name: 'Chaîne Twitch QA' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Chaîne YouTube QA' })).toBeHidden();

    await page.getByRole('button', { name: /Toutes les plateformes 3/ }).click();
    await expect(page.locator('a[href="https://www.twitch.tv/qa_twitch"]')).toBeVisible();
    await expect(page.locator('a[href="https://www.youtube.com/channel/UCqaYoutube"]')).toBeVisible();
    await expect(page.locator('a[href="https://www.facebook.com/qa-facebook"]')).toBeVisible();
  });

  test('couvre la version anglaise du catalogue', async ({ page }) => {
    await mockStreams(page, () => ({ status: 200, body: { streams: catalogue } }));
    await openDashboardStreams(page, 'en');

    await expect(page.getByRole('heading', { name: 'Featured channels' })).toBeVisible();
    await expect(page.getByRole('link', { name: /Open stream/ }).first()).toBeVisible();
  });

  test('couvre le catalogue vide et son lien extension', async ({ page }) => {
    await mockStreams(page, () => ({ status: 200, body: { streams: [] } }));
    await openDashboardStreams(page, 'fr');

    await expect(page.getByText('Le catalogue Skkup est vide pour le moment.')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Configurer l’extension' })).toHaveAttribute('href', '/extension');
  });

  test('couvre erreur API puis retry réussi', async ({ page }) => {
    await mockStreams(page, (requestCount) => requestCount === 1
      ? { status: 503, body: { message: 'Catalogue indisponible.' } }
      : { status: 200, body: { streams: catalogue } });
    await openDashboardStreams(page, 'fr');

    await expect(page.getByText('Catalogue indisponible.')).toBeVisible();
    await page.getByRole('button', { name: 'Réessayer' }).click();
    await expect(page.getByRole('heading', { name: 'Chaînes proposées' })).toBeVisible();
  });
});

import { expect, test, type Page } from '@playwright/test';

const target = process.env.QA_BASE_URL;
const qaEmail = process.env.QA_EMAIL;
const qaPassword = process.env.QA_PASSWORD;
const qaStorageState = process.env.QA_STORAGE_STATE;

const catalogue = [
  { id: 'qa-twitch', plateforme: 'TWITCH', identifiantChaine: 'qa_twitch', nomAffiche: 'Chaîne Twitch QA' },
  { id: 'qa-youtube', plateforme: 'YOUTUBE', identifiantChaine: 'UCqaYoutube', nomAffiche: 'Chaîne YouTube QA' },
  { id: 'qa-facebook', plateforme: 'FACEBOOK', identifiantChaine: 'qa-facebook', nomAffiche: 'Chaîne Facebook QA' },
];

async function mockStreams(page: Page, handler: (requestCount: number) => { status: number; body: unknown }) {
  let requestCount = 0;
  await page.route('**:3001/streams', async (route) => {
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
  await page.addInitScript((locale) => window.localStorage.setItem('skkup-language', locale), language);
  await page.goto('/dashboard/streams', { waitUntil: 'domcontentloaded' });
}

test.describe('DASH-V3 viewer /dashboard/streams functional', () => {
  test.skip(!target || ((!qaEmail || !qaPassword) && !qaStorageState), 'Set QA_BASE_URL plus credentials or QA_STORAGE_STATE for an authenticated QA target.');

  test('couvre le chargement puis le catalogue en français', async ({ page }) => {
    let releaseResponse!: () => void;
    const loading = new Promise<void>((resolve) => { releaseResponse = resolve; });
    await page.route('**:3001/streams', async (route) => {
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

    await page.getByRole('button', { name: /Toutes 3/ }).click();
    await expect(page.getByRole('link', { name: /Ouvrir le direct/ }).nth(0)).toHaveAttribute('href', 'https://www.twitch.tv/qa_twitch');
    await expect(page.getByRole('link', { name: /Ouvrir le direct/ }).nth(1)).toHaveAttribute('href', 'https://www.youtube.com/channel/UCqaYoutube');
    await expect(page.getByRole('link', { name: /Ouvrir le direct/ }).nth(2)).toHaveAttribute('href', 'https://www.facebook.com/qa-facebook');
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

    await expect(page.getByRole('alert')).toContainText('Catalogue indisponible.');
    await page.getByRole('button', { name: 'Réessayer' }).click();
    await expect(page.getByRole('heading', { name: 'Chaînes proposées' })).toBeVisible();
  });
});

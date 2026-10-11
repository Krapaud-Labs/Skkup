import { expect, test } from '@playwright/test';

const target = process.env.QA_BASE_URL;
const qaEmail = process.env.QA_EMAIL;
const qaPassword = process.env.QA_PASSWORD;
const qaStorageState = process.env.QA_STORAGE_STATE;

const openRaffle = {
  id: 'qa-open-raffle', titre: 'Tirage ouvert QA', description: 'Données contractuelles.',
  dateOuverture: '2026-10-01T10:00:00.000Z', dateTirage: '2030-10-20T18:00:00.000Z',
  statut: 'OUVERT', resultatPublieAt: null, ticketsDistribues: 12,
  lots: [{ id: 'qa-open-prize', nom: 'Carte cadeau QA', valeurEstimee: 50, quantite: 1, fournisseur: 'QA' }],
};

const publishedRaffle = {
  id: 'qa-published-raffle', titre: 'Tirage publié QA', description: 'Résultat contractuel.',
  dateOuverture: '2026-09-01T10:00:00.000Z', dateTirage: '2026-09-20T18:00:00.000Z',
  statut: 'TIRE', resultatPublieAt: '2026-09-20T18:01:00.000Z', ticketsDistribues: 24,
  lots: [{ id: 'qa-published-prize', nom: 'Console QA', valeurEstimee: 300, quantite: 1, fournisseur: 'QA' }],
};

async function openPage(page: import('@playwright/test').Page, language: 'fr' | 'en' = 'fr') {
  await page.addInitScript((locale) => window.localStorage.setItem('skkup-language', locale), language);
  await page.goto('/dashboard/tirages', { waitUntil: 'domcontentloaded' });
}

async function mockRaffles(page: import('@playwright/test').Page, body: unknown = [openRaffle, publishedRaffle]) {
  await page.route('**:3001/raffles', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
  });
}

test.describe('DASH-V3 viewer /dashboard/tirages functional', () => {
  test.skip(!target || ((!qaEmail || !qaPassword) && !qaStorageState), 'Set QA_BASE_URL plus credentials or QA_STORAGE_STATE for an authenticated QA target.');

  test('couvre recherche, filtres et résultat publié en français et anglais', async ({ page }) => {
    await mockRaffles(page);
    await page.route('**:3001/raffles/qa-published-raffle/result', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: publishedRaffle.id, gagnants: [{ lotId: 'qa-published-prize', lotNom: 'Console QA', ticketId: 'ticket-qa', pseudo: 'qa-user' }] }) });
    });
    await openPage(page, 'fr');
    const search = page.getByRole('textbox', { name: 'Rechercher un tirage' });
    await expect(search).toBeVisible();
    await search.fill('publié QA');
    await expect(page.getByRole('button', { name: /Tirage publié QA/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /Tirage ouvert QA/ })).toBeHidden();
    await search.fill('');
    await page.getByRole('button', { name: /Résultat publié/ }).click();
    await page.getByRole('button', { name: /Tirage publié QA/ }).click();
    await expect(page.getByText('qa-user')).toBeVisible();
    await expect(page.getByText('Console QA', { exact: true })).toBeVisible();

    await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
    await page.evaluate(() => window.localStorage.setItem('skkup-language', 'en'));
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: 'Draws and winners' })).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Search a draw' })).toBeVisible();
    await expect(page.getByRole('group', { name: 'Draw status' })).toBeVisible();
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  });

  test('confirme une inscription réussie', async ({ page }) => {
    await mockRaffles(page, [openRaffle]);
    await page.route('**:3001/me/raffles/qa-open-raffle/register', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ticketId: 'ticket-success', raffleId: openRaffle.id }) });
    });
    await openPage(page);
    await page.getByRole('button', { name: 'Participer au tirage' }).click();
    await expect(page.getByText('Participation enregistrée. Ton ticket est prêt.')).toBeVisible();
  });

  test('redirige vers la connexion après un 401', async ({ page }) => {
    await mockRaffles(page, [openRaffle]);
    await page.route('**:3001/me/raffles/qa-open-raffle/register', async (route) => {
      await route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ message: 'Authentification requise' }) });
    });
    await openPage(page);
    await page.getByRole('button', { name: 'Participer au tirage' }).click();
    await expect(page).toHaveURL(/\/connexion$/);
  });

  test('affiche une participation refusée en 403', async ({ page }) => {
    await mockRaffles(page, [openRaffle]);
    await page.route('**:3001/me/raffles/qa-open-raffle/register', async (route) => {
      await route.fulfill({ status: 403, contentType: 'application/json', body: JSON.stringify({ message: 'Participation refusée pour ce tirage.' }) });
    });
    await openPage(page);
    await page.getByRole('button', { name: 'Participer au tirage' }).click();
    await expect(page.getByText('Participation refusée pour ce tirage.')).toBeVisible();
  });

  test('affiche une erreur de chargement et permet le retry', async ({ page }) => {
    let requests = 0;
    await page.route('**:3001/raffles', async (route) => {
      requests += 1;
      await route.fulfill(requests === 1
        ? { status: 503, contentType: 'application/json', body: JSON.stringify({ message: 'Service indisponible.' }) }
        : { status: 200, contentType: 'application/json', body: JSON.stringify([openRaffle]) });
    });
    await openPage(page);
    await expect(page.getByRole('alert')).toContainText('Service indisponible.');
    await page.getByRole('button', { name: 'Réessayer' }).click();
    await expect(page.getByRole('button', { name: /Tirage ouvert QA/ })).toBeVisible();
  });
});

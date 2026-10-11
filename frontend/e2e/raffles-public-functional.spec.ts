import { expect, test } from '@playwright/test';

const openRaffle = {
  id: 'raffle-open-contract',
  titre: 'Tirage ouvert contractuel',
  description: 'Récompense de test sans données de production.',
  dateOuverture: '2026-10-01T10:00:00.000Z',
  dateTirage: '2030-10-20T18:00:00.000Z',
  statut: 'OUVERT',
  resultatPublieAt: null,
  ticketsDistribues: 12,
  lots: [{ id: 'lot-open-contract', nom: 'Carte cadeau QA', valeurEstimee: 50, quantite: 1, fournisseur: 'Fournisseur contractuel QA', imageUrl: null }],
};

const publishedRaffle = {
  id: 'raffle-published-contract',
  titre: 'Tirage publié contractuel',
  description: 'Résultat contractuel disponible.',
  dateOuverture: '2026-09-01T10:00:00.000Z',
  dateTirage: '2026-09-20T18:00:00.000Z',
  statut: 'TIRE',
  resultatPublieAt: '2026-09-20T18:01:00.000Z',
  ticketsDistribues: 24,
  lots: [{ id: 'lot-published-contract', nom: 'Console QA', valeurEstimee: 300, quantite: 1, fournisseur: 'Fournisseur contractuel QA', imageUrl: null }],
};

const raffles = [openRaffle, publishedRaffle];

async function mockRaffles(page: import('@playwright/test').Page) {
  await page.route('**/raffles', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(raffles) });
  });
}

async function mockPublishedResult(page: import('@playwright/test').Page) {
  await page.route('**/raffles/raffle-published-contract/result', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: 'raffle-published-contract',
        gagnants: [{ lotId: 'lot-published-contract', lotNom: 'Console QA', ticketId: 'ticket-contract-1', pseudo: 'qa-contract-user' }],
      }),
    });
  });
}

test.describe('tirages publics fonctionnels', () => {
  test.beforeEach(async ({ page }) => {
    await mockRaffles(page);
    await mockPublishedResult(page);
  });

  test('confirme une participation réussie', async ({ page }) => {
    await page.route('**/me/raffles/raffle-open-contract/register', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ticketId: 'ticket-contract-success', raffleId: openRaffle.id }),
      });
    });

    await page.goto('/tirages', { waitUntil: 'domcontentloaded' });
    const participate = page.getByRole('button', { name: /Participer au tirage|Enter the draw/ });
    await expect(participate).toBeVisible();
    await participate.click();
    await expect(page.getByText(/Participation enregistrée|Entry recorded/)).toBeVisible();
  });

  test('redirige vers la connexion après un 401 de participation', async ({ page }) => {
    await page.route('**/me/raffles/raffle-open-contract/register', async (route) => {
      await route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ message: 'Authentification requise' }) });
    });

    await page.goto('/tirages', { waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: /Participer au tirage|Enter the draw/ }).click();
    await expect(page).toHaveURL(/\/connexion$/);
  });

  test('affiche une participation refusée en 403', async ({ page }) => {
    await page.route('**/me/raffles/raffle-open-contract/register', async (route) => {
      await route.fulfill({ status: 403, contentType: 'application/json', body: JSON.stringify({ message: 'Participation refusée pour ce tirage.' }) });
    });

    await page.goto('/tirages', { waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: /Participer au tirage|Enter the draw/ }).click();
    await expect(page.getByText(/Participation refusée pour ce tirage\.|Participation refused for this draw\./)).toBeVisible();
  });

  test('affiche le résultat publié depuis /raffles/:id/result', async ({ page }) => {
    await page.goto('/tirages', { waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: /Result published.*Tirage publié contractuel|Résultat publié.*Tirage publié contractuel/ }).click();
    await expect(page.getByRole('heading', { name: /Gagnants|Winners/ })).toBeVisible();
    await expect(page.getByText('qa-contract-user')).toBeVisible();
    await expect(page.locator('#raffle-detail-raffle-published-contract').getByText('Console QA', { exact: true })).toBeVisible();
  });
});

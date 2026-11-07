import { expect, test } from '@playwright/test';

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
  const profil = { id: 'qa-raffles-viewer', email: 'qa-raffles@example.test', pseudo: 'qa-raffles', soldePoints: 120, streakActuel: 2, streakMax: 5, derniereVisiteAt: null, createdAt: '2026-10-01T10:00:00.000Z', role: 'VIEWER' };
  await page.route('**/auth/session', async (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ authentifie: true, profil }) }));
  await page.route('**/me', async (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(profil) }));
  await page.addInitScript((locale) => {
    if (!window.localStorage.getItem('skkup-language')) window.localStorage.setItem('skkup-language', locale);
  }, language);
  await page.goto('/dashboard/tirages', { waitUntil: 'domcontentloaded' });
}

async function mockRaffles(page: import('@playwright/test').Page, body: unknown = [openRaffle, publishedRaffle]) {
  await page.route('**:3001/raffles', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
  });
}

test.describe('DASH-V3 viewer /dashboard/tirages functional', () => {
  test('préserve la hauteur des cartes et leur espacement avec des contenus longs', async ({ page }, testInfo) => {
    const longRaffles = Array.from({ length: 3 }, (_, index) => ({
      id: `qa-long-raffle-${index + 1}`,
      titre: `Tirage synthétique long numéro ${index + 1} avec un intitulé détaillé`,
      description: 'Description longue de validation qui représente un contenu éditorial dense, afin de vérifier que les informations restent lisibles dans chaque carte sans déborder sur la suivante.',
      dateOuverture: '2026-10-01T10:00:00.000Z',
      dateTirage: '2030-10-20T18:00:00.000Z',
      statut: 'OUVERT',
      resultatPublieAt: null,
      ticketsDistribues: 128,
      lots: [
        { id: `qa-long-prize-a-${index + 1}`, nom: `Lot principal synthétique numéro ${index + 1} avec intitulé long`, valeurEstimee: 150, quantite: 1, fournisseur: 'QA' },
        { id: `qa-long-prize-b-${index + 1}`, nom: `Lot secondaire synthétique numéro ${index + 1}`, valeurEstimee: 80, quantite: 1, fournisseur: 'QA' },
      ],
    }));
    const viewport = testInfo.project.name === 'desktop'
      ? { width: 1280, height: 900 }
      : { width: 390, height: 844 };

    await page.setViewportSize(viewport);
    await mockRaffles(page, longRaffles);
    await openPage(page);

    const list = page.locator('.skuup-dashboard-raffles-page .skuup-raffles-list');
    await expect(list.locator('.skuup-raffle-list-item')).toHaveCount(3);
    if (viewport.width >= 900) {
      // Keep the test's three long rows under scroll pressure, as in the
      // constrained desktop list, without changing application source.
      await list.evaluate((element) => {
        element.style.insetBlockEnd = 'auto';
        element.style.blockSize = '260px';
      });
    }

    const measurements = await list.locator('.skuup-raffle-list-item').evaluateAll((cards) => {
      const rect = (element: Element) => element.getBoundingClientRect();
      const gap = Number.parseFloat(getComputedStyle(cards[0].parentElement!).rowGap) || 0;
      return {
        gap,
        cards: cards.map((card) => {
          const cardRect = rect(card);
          const body = card.querySelector('.skuup-raffle-card-body');
          const meta = card.querySelector('.skuup-raffle-card-meta');
          const prize = card.querySelector('.skuup-raffle-card-prize');
          return {
            top: cardRect.top,
            bottom: cardRect.bottom,
            bodyBottom: body ? rect(body).bottom : cardRect.bottom,
            metaBottom: meta ? rect(meta).bottom : cardRect.bottom,
            prizeBottom: prize ? rect(prize).bottom : cardRect.bottom,
          };
        }),
      };
    });

    for (const card of measurements.cards) {
      expect(card.bodyBottom, 'le contenu de la carte reste dans sa bordure').toBeLessThanOrEqual(card.bottom + 1);
      expect(card.metaBottom, 'les métadonnées restent dans la carte').toBeLessThanOrEqual(card.bottom + 1);
      expect(card.prizeBottom, 'le lot reste dans la carte').toBeLessThanOrEqual(card.bottom + 1);
    }
    for (let index = 1; index < measurements.cards.length; index += 1) {
      expect(measurements.cards[index].top, 'les cartes suivantes respectent le gap CSS').toBeGreaterThanOrEqual(measurements.cards[index - 1].bottom + measurements.gap - 1);
    }
  });

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
    await page.getByRole('button', { name: /^Résultat publié 1$/ }).click();
    await page.getByRole('button', { name: /Tirage publié QA/ }).click();
    await expect(page.getByText('qa-user')).toBeVisible();
    await expect(page.locator('#raffle-detail-qa-published-raffle').getByText('Console QA', { exact: true })).toBeVisible();

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
    let retryAllowed = false;
    await page.route('**:3001/raffles', async (route) => {
      requests += 1;
      await route.fulfill(retryAllowed
        ? { status: 200, contentType: 'application/json', body: JSON.stringify([openRaffle]) }
        : { status: 503, contentType: 'application/json', body: JSON.stringify({ message: 'Service indisponible.' }) });
    });
    await openPage(page);
    await expect(page.getByText('Service indisponible.', { exact: true })).toBeVisible();
    const attemptsBeforeRetry = requests;
    retryAllowed = true;
    await page.getByRole('button', { name: 'Réessayer' }).click();
    await expect(page.getByRole('button', { name: /Tirage ouvert QA/ })).toBeVisible();
    expect(requests).toBeGreaterThan(attemptsBeforeRetry);
  });
});

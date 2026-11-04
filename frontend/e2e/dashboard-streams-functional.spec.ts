import { expect, test } from '@playwright/test';

const profile = {
  id: 'qa-streams-viewer',
  email: 'qa-streams@example.test',
  pseudo: 'qa-streams',
  soldePoints: 120,
  streakActuel: 2,
  streakMax: 5,
  derniereVisiteAt: new Date().toISOString(),
  createdAt: '2026-10-01T10:00:00.000Z',
  role: 'VIEWER',
};

test('le raccourci obsolète des streams viewer renvoie au dashboard', async ({ page }) => {
  await page.route('**/auth/session', async (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ authentifie: true, profil: profile }),
  }));
  await page.route('**/me', async (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(profile),
  }));
  await page.route('**/me/dashboard/summary', async (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      profil: profile,
      visionnage: { secondesValidees: 0, sessions: 0 },
      activite: { ticketsTirage: 0, cartesAGratterDisponibles: 0 },
      transactionsRecentes: [],
    }),
  }));
  await page.route('**/me/scratch-cards', async (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: '[]',
  }));
  await page.route('**/me/raffle-tickets?*', async (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ tickets: [], page: 1, limit: 10, total: 0, totalPages: 1 }),
  }));
  await page.route('**/raffles', async (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: '[]',
  }));
  await page.addInitScript(() => window.localStorage.setItem('skkup-language', 'fr'));

  await page.goto('/dashboard/streams', { waitUntil: 'domcontentloaded' });

  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole('heading', { name: 'Ton espace de progression' })).toBeVisible();
  await expect(page.getByRole('link', { name: /streams|chaînes/i })).toHaveCount(0);
});

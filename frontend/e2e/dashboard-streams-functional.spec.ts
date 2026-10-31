import { expect, test } from '@playwright/test';

test.describe('DASH-V3 legacy private streams route', () => {
  test('redirects /dashboard/streams to the viewer dashboard without rendering the removed page', async ({ page }) => {
    const profil = {
      id: 'qa-streams-viewer',
      email: 'qa-streams@example.test',
      pseudo: 'qa-streams',
      soldePoints: 120,
      streakActuel: 2,
      streakMax: 5,
      derniereVisiteAt: null,
      createdAt: '2026-10-01T10:00:00.000Z',
      role: 'VIEWER',
    };
    await page.route('**/auth/session', async (route) => route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ authentifie: true, profil }),
    }));
    await page.route('**/me', async (route) => route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(profil),
    }));

    await page.goto('/dashboard/streams', { waitUntil: 'domcontentloaded' });

    await expect(page).toHaveURL(/\/dashboard\/?$/);
    await expect(page.getByRole('heading', { name: /Chaînes proposées|Featured channels/ })).toHaveCount(0);
    await expect(page.getByRole('textbox', { name: /Rechercher un streamer|Search streamers/ })).toHaveCount(0);
  });
});

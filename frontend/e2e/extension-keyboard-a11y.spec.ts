import { expect, test } from '@playwright/test';

async function mockAnonymousExtension(page: import('@playwright/test').Page) {
  await page.route('**/auth/session', async (route) => {
    await route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ message: 'Non authentifié' }) });
  });
  await page.route('**/extension/pairings', async (route) => {
    await route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ message: 'Non authentifié' }) });
  });
}

test('extension : contrôles clavier et noms accessibles en visiteur anonyme', async ({ page }) => {
  await mockAnonymousExtension(page);
  await page.goto('/extension', { waitUntil: 'domcontentloaded' });

  await expect(page.locator('main').first()).toBeVisible();
  await expect(page.getByRole('heading', { name: /Associer l['’]extension à ton compte|Pair the extension with your account/i })).toBeVisible();
  await expect(page.getByRole('link', { name: /Installer(?: l.?extension Skkup)? depuis le Chrome Web Store|Install(?: the Skkup extension)? from the Chrome Web Store/i })).toBeVisible();
  await expect(page.getByRole('link', { name: /Se connecter|Sign in/i })).toBeVisible();

  const controls = page.locator('main a, main button, main input, main select, main textarea');
  expect(await controls.evaluateAll((elements) => elements.every((element) => {
    const tabindex = element.getAttribute('tabindex');
    return tabindex === null || Number(tabindex) <= 0;
  }))).toBe(true);

  const namedControls = await controls.evaluateAll((elements) => elements.map((element) => ({
    tag: element.tagName,
    name: element.getAttribute('aria-label') || element.textContent?.trim() || element.getAttribute('title') || '',
  })));
  expect(namedControls.every((control) => control.name.length > 0), JSON.stringify(namedControls)).toBe(true);

  const chromeLink = page.getByRole('link', { name: /Installer(?: l.?extension Skkup)? depuis le Chrome Web Store|Install(?: the Skkup extension)? from the Chrome Web Store/i });
  await chromeLink.focus();
  await expect(chromeLink).toBeFocused();
  await expect(chromeLink).toHaveAttribute('target', '_blank');

  const loginLink = page.getByRole('link', { name: /Se connecter|Sign in/i });
  await loginLink.focus();
  await expect(loginLink).toBeFocused();
  await expect(loginLink).toHaveAttribute('href', '/connexion');
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/connexion$/);
});

test('extension : génération du pairing déclenchable au clavier', async ({ page }) => {
  await page.route('**/auth/session', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ authentifie: true, profil: { id: 'qa-a11y', email: 'qa-a11y@example.test', pseudo: 'qa-a11y', soldePoints: 0, streakActuel: 0, streakMax: 0, derniereVisiteAt: null, createdAt: '2026-10-01T10:00:00.000Z', role: 'VIEWER' } }) });
  });
  await page.route('**/extension/pairings', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ appareils: [] }) });
  });
  await page.route('**/extension/pairing-token', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 'A11Y-123456', expireAt: '2030-10-20T18:05:00.000Z' }) });
  });
  await page.goto('/extension', { waitUntil: 'domcontentloaded' });

  const generate = page.getByRole('button', { name: /Générer un code|Generate a code/i }).first();
  await expect(generate).toBeVisible();
  await generate.focus();
  await expect(generate).toBeFocused();
  const pairingResponse = page.waitForResponse((response) =>
    response.url().includes('/extension/pairing-token')
      && response.request().method() === 'POST',
  );
  await Promise.all([pairingResponse, generate.press('Space')]);
  await expect(page.getByText('A11Y-123456')).toBeVisible();
});

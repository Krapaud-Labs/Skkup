import { expect, test } from '@playwright/test';

async function mockSession(page: import('@playwright/test').Page, session: { authentifie: boolean }) {
  await page.route('**/auth/session', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(session.authentifie
      ? { authentifie: true, profil: { id: 'qa-inscription', pseudo: 'qa-inscription', email: 'qa-inscription@example.test', role: 'VIEWER', soldePoints: 0, streakActuel: 0, streakMax: 0, derniereVisiteAt: null } }
      : { authentifie: false, profil: null }) });
  });
  await page.route('**/me', async (route) => {
    if (!session.authentifie) {
      await route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ message: 'Non authentifié' }) });
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: 'qa-inscription',
        pseudo: 'qa-inscription',
        email: 'qa-inscription@example.test',
        role: 'VIEWER',
        soldePoints: 0,
        streakActuel: 0,
        streakMax: 0,
        derniereVisiteAt: null,
      }),
    });
  });
}

async function mockRegistration(page: import('@playwright/test').Page, bodies: unknown[], session: { authentifie: boolean }) {
  await page.route('**/auth/register', async (route) => {
    bodies.push(JSON.parse(route.request().postData() ?? '{}'));
    session.authentifie = true;
    await route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({ pseudo: 'qa-inscription' }) });
  });
}

async function fillValidForm(page: import('@playwright/test').Page) {
  await page.getByLabel(/Pseudo|Username/).fill('qa-inscription');
  await page.getByLabel(/Adresse email|Email address/).fill('qa-inscription@example.test');
  await page.getByLabel(/Mot de passe|Password$/).fill('MotDePasseQA2026!');
  await page.getByLabel(/Confirmer le mot de passe|Confirm password/).fill('MotDePasseQA2026!');
}

for (const viewport of [
  { name: 'desktop-1280', width: 1280, height: 900 },
  { name: 'tablet-768', width: 768, height: 1024 },
  { name: 'mobile-390', width: 390, height: 844 },
]) {
  test(`inscription avec règlement obligatoire ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    const session = { authentifie: false };
    await mockSession(page, session);
    const registrationBodies: unknown[] = [];
    await mockRegistration(page, registrationBodies, session);
    await page.goto('/inscription', { waitUntil: 'domcontentloaded' });

    const modal = page.getByRole('dialog', { name: /règlement|game rules/i });
    await expect(modal).toBeVisible();
    await expect(page.locator('form')).toHaveCount(0);

    const acceptation = page.getByRole('checkbox', { name: /règlement|game rules/i });
    await expect(acceptation).toBeVisible();
    const continuer = page.getByRole('button', { name: /accepte.*continue|accept.*continue/i });
    await expect(continuer).toBeDisabled();

    await acceptation.focus();
    await expect(acceptation).toBeFocused();
    await acceptation.check();
    await expect(continuer).toBeEnabled();
    await continuer.click();
    await expect(modal).toBeHidden();
    await expect(page.locator('form')).toBeVisible();

    await fillValidForm(page);
    await page.getByRole('button', { name: /Je crée mon compte|Create my account/ }).click();
    await expect(page).toHaveURL(/\/dashboard$/);
    expect(registrationBodies).toEqual([{ email: 'qa-inscription@example.test', motDePasse: 'MotDePasseQA2026!', pseudo: 'qa-inscription', accepteReglement: true }]);
  });
}

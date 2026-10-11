import { expect, test } from '@playwright/test';

async function mockSession(page: import('@playwright/test').Page) {
  await page.route('**/auth/session', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ authentifie: false, profil: null }) });
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
    await mockSession(page);
    await page.goto('/inscription', { waitUntil: 'domcontentloaded' });

    const reglement = page.getByText(/règlement/i).first();
    await expect(reglement).toBeVisible();
    const formulaire = page.locator('form');
    await expect(formulaire).toBeVisible();
    const reglementBox = await reglement.boundingBox();
    const formulaireBox = await formulaire.boundingBox();
    expect(reglementBox).not.toBeNull();
    expect(formulaireBox).not.toBeNull();
    expect(reglementBox!.y).toBeLessThan(formulaireBox!.y);

    const acceptation = page.getByRole('checkbox', { name: /règlement|game rules/i });
    await expect(acceptation).toBeVisible();
    await expect(acceptation).toHaveAttribute('required', '');

    await fillValidForm(page);
    await page.getByRole('button', { name: /Je crée mon compte|Create my account/ }).click();
    await expect(page).not.toHaveURL(/\/dashboard$/);

    await page.route('**/auth/register', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ pseudo: 'qa-inscription' }) });
    });
    await acceptation.check();
    await page.getByRole('button', { name: /Je crée mon compte|Create my account/ }).click();
    await expect(page).toHaveURL(/\/dashboard$/);
  });
}

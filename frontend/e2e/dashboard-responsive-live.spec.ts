import { expect, test } from '@playwright/test';

/**
 * QA live only. This suite deliberately does not stub API responses or create
 * product data. The target must expose an authenticated QA session through
 * the configured browser context, otherwise the failure is evidence that the
 * route cannot be verified in the current environment.
 */
const target = process.env.QA_BASE_URL;
const qaEmail = process.env.QA_EMAIL;
const qaPassword = process.env.QA_PASSWORD;
const qaStorageState = process.env.QA_STORAGE_STATE;

test.describe('DASH-V3 responsive/accessibility live matrix', () => {
  test.describe.configure({ mode: 'serial' });
  test.skip(!target || ((!qaEmail || !qaPassword) && !qaStorageState), 'Set QA_BASE_URL plus credentials or QA_STORAGE_STATE for an authenticated QA target.');

  test.beforeEach(async ({ page }) => {
    test.skip(test.info().project.name === 'mobile', 'This suite sets explicit 320/768/1280 viewports; the mobile project would duplicate the matrix.');
    if (qaStorageState) {
      await page.goto('/dashboard', { waitUntil: 'networkidle' });
      return;
    }
    await page.goto('/connexion', { waitUntil: 'networkidle' });
    await page.locator('#email').fill(qaEmail!);
    await page.locator('#motDePasse').fill(qaPassword!);
    let connecte = false;
    for (let tentative = 0; tentative < 8 && !connecte; tentative += 1) {
      await page.getByRole('button', { name: /Je me connecte|Log in/i }).click();
      try {
        await page.waitForURL(/\/dashboard(?:[/?#]|$)/, { timeout: 8_000 });
        connecte = true;
      } catch {
        if (tentative < 7) await page.waitForTimeout(1_000);
      }
    }
    if (!connecte) throw new Error(`QA authentication did not reach /dashboard (current URL: ${page.url()})`);
  });

  for (const viewport of [
    { name: 'mobile-320', width: 320, height: 844 },
    { name: 'tablet-768', width: 768, height: 1024 },
      { name: 'desktop-1280', width: 1280, height: 900 },
  ]) {
    for (const route of ['/dashboard', '/admin']) {
      test(`${route} at ${viewport.name} has a verified shell and no overflow`, async ({ page }) => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        const response = await page.goto(route, { waitUntil: 'networkidle' });

        expect(response, `${route} did not return a document`).not.toBeNull();
        expect(response?.status(), `${route} HTTP status`).toBeLessThan(400);
        expect(page.url(), `${route} redirected away from the requested route`).toMatch(new RegExp(`${route.replace('/', '\\/')}(?:[/?#]|$)`));

        const shell = page.locator('.skuup-premium-dashboard-shell');
        await expect(shell, `${route} DASH-V3 shell is not rendered`).toBeVisible();

        const layout = await page.evaluate(() => ({
          viewport: window.innerWidth,
          documentWidth: document.documentElement.scrollWidth,
          bodyWidth: document.body.scrollWidth,
        }));
        expect(layout.viewport).toBe(viewport.width);
        expect(layout.documentWidth, `${route} document horizontal overflow`).toBeLessThanOrEqual(layout.viewport);
        expect(layout.bodyWidth, `${route} body horizontal overflow`).toBeLessThanOrEqual(layout.viewport);

        const unnamedControls = await shell.locator('a, button, input, select, textarea').evaluateAll((elements) =>
          elements.filter((element) => {
            const name = element.getAttribute('aria-label')?.trim() || element.textContent?.trim() || element.getAttribute('title')?.trim();
            return !name;
          }).length,
        );
        expect(unnamedControls, `${route} contains unnamed interactive controls`).toBe(0);

        const visibleControls = shell.locator('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex="0"]');
        expect(await visibleControls.count(), `${route} exposes no reachable controls`).toBeGreaterThan(0);
        for (let index = 0; index < await visibleControls.count(); index += 1) {
          const control = visibleControls.nth(index);
          if (await control.isVisible()) {
            await control.focus();
            await expect(control, `${route} control ${index} cannot receive focus`).toBeFocused();
          }
        }

        await page.screenshot({
          path: `test-results/dashboard-responsive/${route.slice(1)}-${viewport.name}.png`,
          fullPage: true,
        });
      });
    }
  }
});

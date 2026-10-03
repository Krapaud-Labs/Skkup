import { expect, test } from '@playwright/test';

/**
 * QA live only. This suite deliberately does not stub API responses or create
 * product data. The target must expose an authenticated QA session through
 * the configured browser context, otherwise the failure is evidence that the
 * route cannot be verified in the current environment.
 */
const target = process.env.QA_BASE_URL;

test.describe('DASH-V3 responsive/accessibility live matrix', () => {
  test.skip(!target, 'Set QA_BASE_URL to run against a real deployed or local QA target.');

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

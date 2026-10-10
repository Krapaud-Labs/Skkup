import { expect, test } from '@playwright/test';

/**
 * QA live uniquement : aucune interception, fixture ou donnée synthétique.
 * Sans QA_BASE_URL, ces contrôles restent explicitement non exécutés.
 */
const target = process.env.QA_BASE_URL;
const qaStorageState = process.env.QA_STORAGE_STATE;

test.describe("DASH-V3 viewer principal /dashboard", () => {
  test.skip(!target || !qaStorageState, "Set QA_BASE_URL and QA_STORAGE_STATE to run against an authenticated QA target.");

  for (const viewport of [
    { name: "mobile-320", width: 320, height: 844 },
    { name: "tablet-768", width: 768, height: 1024 },
    { name: "desktop-1280", width: 1280, height: 900 },
  ]) {
    test(`${viewport.name} expose un dashboard accessible sans débordement`, async ({ page }) => {
      await page.setViewportSize(viewport);
      const response = await page.goto("/dashboard", { waitUntil: "networkidle" });
      expect(response?.status()).toBeLessThan(400);
      await expect(page.locator(".skuup-premium-dashboard-shell")).toBeVisible();
      await expect(page.locator("h1")).toHaveCount(1);
      await expect(page.locator(".skuup-viewer-v3-kpis")).toBeVisible();
      await expect(page.locator(".skuup-viewer-v3-feature")).toBeVisible();
      await expect(page.locator(".skuup-viewer-v3-feature .skuup-viewer-v3-stream-card, .skuup-viewer-v3-feature .skuup-viewer-v3-empty-feature, .skuup-viewer-v3-feature .skuup-viewer-empty").first()).toBeVisible();

      const layout = await page.evaluate(() => ({
        viewport: window.innerWidth,
        documentWidth: document.documentElement.scrollWidth,
        bodyWidth: document.body.scrollWidth,
      }));
      expect(layout.documentWidth).toBeLessThanOrEqual(layout.viewport);
      expect(layout.bodyWidth).toBeLessThanOrEqual(layout.viewport);

      const unnamed = await page.locator(".skuup-premium-dashboard-shell a, .skuup-premium-dashboard-shell button").evaluateAll((controls) =>
        controls.filter((control) => !(control.getAttribute("aria-label")?.trim() || control.textContent?.trim())).length,
      );
      expect(unnamed).toBe(0);

      for (const control of await page.locator(".skuup-premium-dashboard-shell a[href], .skuup-premium-dashboard-shell button:not([disabled])").all()) {
        await control.focus();
        await expect(control).toBeFocused();
      }

      await page.screenshot({
        path: `test-results/dashboard-v3-live/dashboard-${viewport.name}.png`,
        fullPage: true,
      });
    });
  }
});

import { expect, test } from '@playwright/test';
import path from 'node:path';

/**
 * Contrôle live uniquement : aucune interception ni fixture navigateur.
 * Le compte et les données doivent exister dans la cible réelle (par exemple
 * le seed de démonstration Docker local). Sans QA_BASE_URL, ces contrôles
 * restent explicitement non exécutés.
 */
const target = process.env.QA_BASE_URL;
const qaStorageState = process.env.QA_STORAGE_STATE;

test.describe("DASH-V3 viewer principal /dashboard", () => {
  test.skip(!target || !qaStorageState, "Set QA_BASE_URL and QA_STORAGE_STATE to run against an authenticated live target.");

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
      await expect(page.locator(".skuup-viewer-v3-overview-shell")).toBeVisible();
      await expect(page.locator(".skuup-viewer-v3-kpis")).toBeVisible();
      await expect(page.locator(".skuup-viewer-v3-rewards-grid")).toBeVisible();
      await expect(page.locator(".skuup-viewer-v3-draws-panel")).toBeVisible();

      const images = await page.locator(".skuup-dashboard-content img").evaluateAll((elements) =>
        elements.map((element) => ({
          src: (element as HTMLImageElement).currentSrc,
          complete: (element as HTMLImageElement).complete,
          naturalWidth: (element as HTMLImageElement).naturalWidth,
        })),
      );
      expect(images.some(({ src, complete, naturalWidth }) => src.includes("/assets/icons/ui/") && complete && naturalWidth > 0)).toBe(true);
      expect(images.filter(({ complete }) => complete).every(({ naturalWidth }) => naturalWidth > 0)).toBe(true);

      const layout = await page.evaluate(() => ({
        viewport: window.innerWidth,
        documentWidth: document.documentElement.scrollWidth,
        bodyWidth: document.body.scrollWidth,
      }));
      expect(layout.documentWidth).toBeLessThanOrEqual(layout.viewport);
      expect(layout.bodyWidth).toBeLessThanOrEqual(layout.viewport);

      const unnamed = await page.locator(".skuup-dashboard-content a, .skuup-dashboard-content button").evaluateAll((controls) =>
        controls.filter((control) => !(control.getAttribute("aria-label")?.trim() || control.textContent?.trim())).length,
      );
      expect(unnamed).toBe(0);

      for (const control of await page.locator(".skuup-dashboard-content a[href], .skuup-dashboard-content button:not([disabled])").all()) {
        await control.focus();
        await expect(control).toBeFocused();
      }

      await page.screenshot({
        path: path.resolve(process.cwd(), "test-results/dashboard-v3-live", `dashboard-${viewport.name}.png`),
        fullPage: true,
      });
    });
  }
});

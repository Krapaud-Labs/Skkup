import { expect, test } from '@playwright/test';

/**
 * Live-only DASH-V3 QA. No API interception, fixtures, or synthetic product
 * data are allowed. QA_BASE_URL must expose an authenticated QA session.
 */
const target = process.env.QA_BASE_URL;
const routes = [
  '/dashboard',
  '/dashboard/streams',
  '/dashboard/tirages',
  '/dashboard/recompenses',
  '/dashboard/historique',
  '/dashboard/extension',
  '/admin',
  '/admin/raffles',
  '/admin/lots',
  '/admin/announcements',
  '/admin/content',
  '/admin/moderation',
  '/admin/users',
  '/admin/audit',
];

const viewports = [
  { name: 'mobile-320', width: 320, height: 844 },
  { name: 'tablet-768', width: 768, height: 1024 },
  { name: 'desktop-1280', width: 1280, height: 900 },
];

test.describe('DASH-V3 secondary live route matrix', () => {
  test.skip(!target, 'Set QA_BASE_URL to run against a real authenticated QA target.');

  for (const viewport of viewports) {
    for (const route of routes) {
      test(`${route} at ${viewport.name} renders a usable real shell`, async ({ page, request }) => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        const response = await page.goto(route, { waitUntil: 'networkidle' });

        expect(response, `${route} did not return a document`).not.toBeNull();
        expect(response?.status(), `${route} HTTP status`).toBeLessThan(400);
        expect(page.url(), `${route} redirected away from the requested route`).toMatch(
          new RegExp(`${route.replaceAll('/', '\\/')}(?:[/?#]|$)`),
        );

        const shell = page.locator('.skuup-premium-dashboard-shell');
        await expect(shell, `${route} DASH-V3 shell is not rendered`).toBeVisible();
        await expect(page.locator('h1'), `${route} must expose one page title`).toHaveCount(1);

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
            const name = element.getAttribute('aria-label')?.trim()
              || element.textContent?.trim()
              || element.getAttribute('title')?.trim();
            return !name;
          }).length,
        );
        expect(unnamedControls, `${route} contains unnamed interactive controls`).toBe(0);

        const controls = shell.locator('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex="0"]');
        expect(await controls.count(), `${route} exposes no reachable controls`).toBeGreaterThan(0);
        for (let index = 0; index < await controls.count(); index += 1) {
          const control = controls.nth(index);
          if (await control.isVisible()) {
            await control.focus();
            await expect(control, `${route} control ${index} cannot receive focus`).toBeFocused();
          }
        }

        // Les contrôles tactiles explicites doivent rester activables sur le
        // viewport mobile. Les liens de texte inline sont exclus ici : leur
        // zone peut rester portée par un conteneur de navigation plus large.
        const touchControls = shell.locator('button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled])');
        for (let index = 0; index < await touchControls.count(); index += 1) {
          const control = touchControls.nth(index);
          if (!(await control.isVisible())) continue;
          const box = await control.boundingBox();
          if (!box) continue;
          expect(box.width, `${route} touch target ${index} is narrower than 44px`).toBeGreaterThanOrEqual(44);
          expect(box.height, `${route} touch target ${index} is shorter than 44px`).toBeGreaterThanOrEqual(44);
        }

        const internalLinks = await shell.locator('a[href]').evaluateAll((links) => links
          .map((link) => (link as HTMLAnchorElement).href)
          .filter((href) => href.startsWith(window.location.origin))
          .filter((href) => !href.includes('#')),
        );
        for (const href of [...new Set(internalLinks)]) {
          const linkResponse = await request.get(href);
          expect(linkResponse.status(), `broken internal link ${href}`).toBeLessThan(400);
        }

        await page.screenshot({
          path: `test-results/dashboard-v3-live/${route.replaceAll('/', '_').replace(/^_/, '')}-${viewport.name}.png`,
          fullPage: true,
        });
      });
    }
  }
});

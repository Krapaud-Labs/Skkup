import { expect, test } from '@playwright/test';

/**
 * Live-only DASH-V3 QA. No API interception, fixtures, or synthetic product
 * data are allowed. QA_BASE_URL must expose an authenticated QA session.
 */
const target = process.env.QA_BASE_URL;
const qaEmail = process.env.QA_EMAIL;
const qaPassword = process.env.QA_PASSWORD;
const qaStorageState = process.env.QA_STORAGE_STATE;
const captureDir = process.env.QA_CAPTURE_DIR ?? 'test-results/dashboard-v3-live';
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

const landscapeViewport = { width: 844, height: 390 };

test.describe('DASH-V3 secondary live route matrix', () => {
  test.skip(!target || ((!qaEmail || !qaPassword) && !qaStorageState), 'Set QA_BASE_URL plus credentials or QA_STORAGE_STATE for an authenticated QA target.');

  for (const viewport of viewports) {
    for (const route of routes) {
      test(`${route} at ${viewport.name} renders a usable real shell`, async ({ page, request }) => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        const response = await page.goto(route, { waitUntil: 'domcontentloaded' });

        expect(response, `${route} did not return a document`).not.toBeNull();
        expect(response?.status(), `${route} HTTP status`).toBeLessThan(400);
        expect(page.url(), `${route} redirected away from the requested route`).toMatch(
          new RegExp(`${route.replaceAll('/', '\\/')}(?:[/?#]|$)`),
        );

        const shell = page.locator('.skuup-premium-dashboard-shell');
        await expect(shell, `${route} DASH-V3 shell is not rendered`).toBeVisible();
        await expect(page.locator('h1'), `${route} must expose one page title`).toHaveCount(1);

        await page.emulateMedia({ reducedMotion: 'reduce' });
        const motion = await page.evaluate(() => [...document.querySelectorAll('*')].map((element) => {
          const style = getComputedStyle(element);
          return [style.transitionDuration, style.animationDuration, style.animationIterationCount];
        }));
        for (const [transition, animation, iterations] of motion) {
          expect(transition, `${route} keeps transitions with reduced motion`).toBe('0s');
          expect(animation, `${route} keeps animations with reduced motion`).toBe('0s');
          expect(iterations, `${route} keeps repeated animations with reduced motion`).toBe('1');
        }

        const media = await shell.locator('img').evaluateAll((images) => images.map((image) => ({
          alt: image.getAttribute('alt')?.trim() ?? '',
          decorative: image.getAttribute('aria-hidden') === 'true' || image.getAttribute('alt') === '',
          complete: (image as HTMLImageElement).complete,
          naturalWidth: (image as HTMLImageElement).naturalWidth,
        })));
        for (const image of media) {
          expect(image.alt || image.decorative, `${route} contains an image without alternative text`).toBeTruthy();
          if (image.complete) expect(image.naturalWidth, `${route} contains a broken image`).toBeGreaterThan(0);
        }

        const fields = shell.locator('input, select, textarea');
        for (let index = 0; index < await fields.count(); index += 1) {
          const field = fields.nth(index);
          if (!(await field.isVisible())) continue;
          const described = await field.evaluate((element) => {
            const id = element.getAttribute('id');
            return Boolean(
              element.getAttribute('aria-label')?.trim()
              || element.getAttribute('aria-labelledby')?.trim()
              || (id && document.querySelector(`label[for="${CSS.escape(id)}"]`))
              || element.closest('label'),
            );
          });
          expect(described, `${route} form field ${index} has no accessible label`).toBe(true);
        }

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
            const labelledBy = element.getAttribute('aria-labelledby')
              ?.split(/\s+/)
              .map((id) => document.getElementById(id)?.textContent?.trim() ?? '')
              .filter(Boolean)
              .join(' ');
            const name = element.getAttribute('aria-label')?.trim()
              || labelledBy
              || element.textContent?.trim()
              || element.getAttribute('title')?.trim()
              || element.closest('label')?.textContent?.trim();
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
          path: `${captureDir}/${route.replaceAll('/', '_').replace(/^_/, '')}-${viewport.name}.png`,
          fullPage: true,
        });
      });
    }
  }

  for (const route of routes) {
    test(`${route} remains usable in landscape and at 200 percent zoom`, async ({ page }) => {
      await page.setViewportSize(landscapeViewport);
      const response = await page.goto(route, { waitUntil: 'domcontentloaded' });
      expect(response?.status(), `${route} landscape HTTP status`).toBeLessThan(400);
      await expect(page.locator('.skuup-premium-dashboard-shell')).toBeVisible();

      await page.evaluate(() => {
        document.documentElement.style.zoom = '2';
      });
      const layout = await page.evaluate(() => ({
        viewport: window.innerWidth,
        documentWidth: document.documentElement.scrollWidth,
        bodyWidth: document.body.scrollWidth,
      }));
      expect(layout.documentWidth, `${route} horizontal overflow at 200 percent zoom`).toBeLessThanOrEqual(layout.viewport * 2);
      expect(layout.bodyWidth, `${route} body overflow at 200 percent zoom`).toBeLessThanOrEqual(layout.viewport * 2);
      await expect(page.locator('h1')).toHaveCount(1);
    });
  }
});

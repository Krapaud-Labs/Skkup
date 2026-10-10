import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const globalsCss = readFileSync(resolve(process.cwd(), 'src/app/globals.css'), 'utf8');
const cockpitCss = readFileSync(resolve(process.cwd(), 'src/app/admin/cockpit.css'), 'utf8');

test('admin cockpit keeps viewport breakpoints despite the sidebar width', async ({ page }) => {
  await page.setContent(`
    <html>
      <head><meta name="viewport" content="width=device-width, initial-scale=1" /></head>
      <body><div class="skuup-premium-admin-shell">
      <aside class="skuup-premium-dashboard-sidebar"></aside>
      <main class="skuup-premium-dashboard-content">
        <section class="skuup-admin-main-cockpit">
          <div class="skuup-admin-kpi-grid" aria-label="KPI cockpit">
            <a class="skuup-admin-kpi" href="#one">Un</a>
            <a class="skuup-admin-kpi" href="#two">Deux</a>
            <a class="skuup-admin-kpi" href="#three">Trois</a>
            <a class="skuup-admin-kpi" href="#four">Quatre</a>
          </div>
        </section>
        <section class="skuup-raffle-detail-grid" aria-label="Écran secondaire">
          <div>Liste</div><div>Détail</div>
        </section>
      </main>
      </div></body>
    </html>
  `);
  await page.addStyleTag({ content: cockpitCss });
  // Keep the assertion independent from stylesheet injection order. In the
  // app, globals.css and the route stylesheet are bundled separately.
  await page.addStyleTag({ content: globalsCss.replace(/@import[^;]+;/g, '') });

  for (const expected of [
    { width: 1280, cockpitColumns: 4, secondaryColumns: 2 },
    { width: 768, cockpitColumns: 2, secondaryColumns: 1 },
    { width: 767, cockpitColumns: 1, secondaryColumns: 1 },
    { width: 320, cockpitColumns: 1, secondaryColumns: 1 },
  ]) {
    await page.setViewportSize({ width: expected.width, height: 900 });
    const layout = await page.evaluate(() => {
      const countColumns = (selector: string) => {
        const value = getComputedStyle(document.querySelector(selector)!).gridTemplateColumns;
        return value.split(/\s+/).filter(Boolean).length;
      };
      return {
        viewport: window.innerWidth,
        cockpit: countColumns('.skuup-admin-kpi-grid'),
        secondary: countColumns('.skuup-raffle-detail-grid'),
        secondaryTemplate: getComputedStyle(document.querySelector('.skuup-raffle-detail-grid')!).gridTemplateColumns,
      };
    });
    expect(layout.cockpit, `cockpit columns at ${expected.width}px (${JSON.stringify(layout)})`).toBe(expected.cockpitColumns);
    expect(layout.secondary, `secondary columns at ${expected.width}px (${JSON.stringify(layout)})`).toBe(expected.secondaryColumns);
  }
});

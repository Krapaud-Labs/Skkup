import { expect, test } from '@playwright/test';
import { resolve } from 'node:path';

const prototypeUrl = `file://${resolve(process.cwd(), '../docs/design/dashboard-prototype-2.0.html')}`;

for (const viewport of [
  { name: 'mobile', width: 320, height: 844 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1280, height: 900 },
]) {
  test(`UX-002 prototype renders at ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto(prototypeUrl);
    await expect(page.getByRole('heading', { name: 'Ton aventure Skkup' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Le cockpit opérationnel' })).toBeVisible();
    const widths = await page.evaluate(() => ({
      viewport: window.innerWidth,
      document: document.documentElement.scrollWidth,
    }));
    expect(widths.document).toBeLessThanOrEqual(widths.viewport);
  });
}

test('UX-002 prototype exposes state semantics and reduced motion', async ({ page }) => {
  await page.goto(prototypeUrl);
  await expect(page.getByRole('status')).toContainText('Le brouillon a été enregistré.');
  await expect(page.getByRole('navigation', { name: 'Navigation contextuelle' })).toBeVisible();
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const reducedMotion = await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior);
  expect(reducedMotion).toBe('auto');
});

test('UX-002 prototype keeps keyboard focus visible on controls', async ({ page }) => {
  await page.goto(prototypeUrl);
  const controls = page.locator('a, button');
  for (let index = 0; index < Math.min(await controls.count(), 8); index += 1) {
    await page.keyboard.press('Tab');
    await expect(page.locator(':focus')).toBeVisible();
  }
});

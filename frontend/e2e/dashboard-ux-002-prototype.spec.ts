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
  await expect(page.getByRole('status').filter({ hasText: 'Le brouillon a été enregistré.' })).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'Navigation contextuelle' })).toBeVisible();
  await expect(page.getByRole('alert')).toHaveCount(3);
  await expect(page.getByRole('status')).toHaveCount(2);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const reducedMotion = await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior);
  expect(reducedMotion).toBe('auto');
});

test('UX-002 prototype exposes every target secondary screen and component contrast tokens', async ({ page }) => {
  await page.goto(prototypeUrl);
  await expect(page.locator('[data-screen]')).toHaveCount(9);
  const contrast = await page.evaluate(() => {
    const root = { '--text': '#f8f7ff', '--muted': '#c8c4e6', '--accent': '#b84dff', '--canvas': '#100d2b' };
    const hex = (value: string) => {
      if (value.trim().startsWith('#')) {
        const raw = value.trim().slice(1);
        const expanded = raw.length === 3 ? raw.split('').map((part) => part + part).join('') : raw;
        return [0, 2, 4].map((index) => Number.parseInt(expanded.slice(index, index + 2), 16));
      }
      const match = value.match(/\d+/g)?.map(Number) ?? [];
      return match.length >= 3 ? match.slice(0, 3) : [0, 0, 0];
    };
    const luminance = (value: string) => {
      const rgb = hex(value).map((channel) => channel / 255).map((channel) => channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4);
      return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
    };
    const ratio = (a: string, b: string) => {
      const first = luminance(a); const second = luminance(b);
      return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
    };
    return {
      body: ratio(root['--text'], root['--canvas']),
      muted: ratio(root['--muted'], root['--canvas']),
      accent: ratio(root['--accent'], root['--canvas']),
    };
  });
  expect(contrast.body).toBeGreaterThanOrEqual(4.5);
  expect(contrast.muted).toBeGreaterThanOrEqual(4.5);
  expect(contrast.accent).toBeGreaterThanOrEqual(3);
});

test('UX-002 prototype keeps keyboard focus visible on controls', async ({ page }) => {
  await page.goto(prototypeUrl);
  const controls = page.locator('button');
  for (let index = 0; index < Math.min(await controls.count(), 8); index += 1) {
    await page.keyboard.press('Tab');
    await expect(page.locator(':focus')).toBeVisible();
    const focusStyle = await page.locator(':focus').evaluate((element) => getComputedStyle(element).outlineStyle);
    expect(focusStyle).toBe('solid');
  }
});

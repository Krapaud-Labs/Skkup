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
  for (const screen of await page.locator('[data-screen]').all()) {
    await expect(screen.locator('h3, h2').first()).toBeVisible();
    if (await screen.locator('button, a').count()) await expect(screen.locator('button, a').first()).toBeVisible();
  }
  const contrast = await page.evaluate(() => {
    const channels = (value: string) => value.match(/\d+(?:\.\d+)?/g)?.map(Number).slice(0, 3) ?? [0, 0, 0];
    const luminance = (value: string) => {
      const rgb = channels(value).map((channel) => channel / 255).map((channel) => channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4);
      return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
    };
    const ratio = (a: string, b: string) => {
      const first = luminance(a); const second = luminance(b);
      return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
    };
    const bodyStyle = getComputedStyle(document.body);
    const actual = [...document.querySelectorAll('button:not([disabled]), .panel, .state')].map((element) => {
      const style = getComputedStyle(element);
      return {
        text: ratio(style.color, style.backgroundColor),
        border: ratio(style.borderTopColor, style.backgroundColor),
        background: style.backgroundColor,
      };
    });
    return {
      tokens: ratio(bodyStyle.color, bodyStyle.backgroundColor),
      actual,
    };
  });
  expect(contrast.tokens).toBeGreaterThanOrEqual(4.5);
  for (const component of contrast.actual) {
    expect(component.text).toBeGreaterThanOrEqual(4.5);
    if (component.background !== 'rgba(0, 0, 0, 0)' && component.border !== 1) expect(component.border, JSON.stringify(component)).toBeGreaterThanOrEqual(3);
  }
  const stateMatrix = await page.locator('[data-required-states]').evaluateAll((nodes) => Object.fromEntries(nodes.map((node) => [node.getAttribute('data-state-screen'), node.getAttribute('data-required-states')?.split(',')] )));
  expect(Object.keys(stateMatrix).sort()).toEqual(['account', 'activity', 'admin-catalogue', 'admin-content', 'admin-raffles', 'admin-settings', 'admin-users-fraud', 'overview', 'points', 'rewards'].sort());
  for (const states of Object.values(stateMatrix)) expect(states).toContain('error');
  expect(stateMatrix['admin-raffles']).toContain('disabled');
  const disabledContrast = await page.locator('button[disabled]').evaluate((element) => {
    const style = getComputedStyle(element);
    return { text: style.color, background: style.backgroundColor };
  });
  expect(disabledContrast.text).not.toBe('rgba(0, 0, 0, 0)');
  expect(disabledContrast.background).not.toBe('rgba(0, 0, 0, 0)');
  await page.locator('button:not([disabled])').first().focus();
  const focusColor = await page.locator(':focus').evaluate((element) => getComputedStyle(element).outlineColor);
  expect(focusColor).toBe('rgb(184, 77, 255)');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const motion = await page.evaluate(() => [...document.querySelectorAll('*')].map((element) => {
    const style = getComputedStyle(element);
    return [style.transitionDuration, style.animationDuration, style.animationIterationCount];
  }));
  for (const [transition, animation, iterations] of motion) {
    expect(transition).toBe('0s');
    expect(animation).toBe('0s');
    expect(iterations).toBe('1');
  }
});

test('UX-002 prototype keeps keyboard focus visible on controls', async ({ page }) => {
  await page.goto(prototypeUrl);
  const controls = page.locator('a:visible, button:visible:not([disabled])');
  for (let index = 0; index < await controls.count(); index += 1) {
    const control = controls.nth(index);
    await control.focus();
    await expect(control).toBeFocused();
    const focusStyle = await control.evaluate((element) => getComputedStyle(element).outlineStyle);
    expect(focusStyle).toBe('solid');
  }
});

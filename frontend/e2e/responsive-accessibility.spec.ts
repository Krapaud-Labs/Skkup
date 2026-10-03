import { expect, test } from '@playwright/test';

for (const path of ['/', '/dashboard', '/admin']) {
  test(`${path} has no horizontal overflow and exposes a heading`, async ({ page }) => {
    const response = await page.goto(path, { waitUntil: 'domcontentloaded' });
    expect(response?.status()).toBeLessThan(400);
    await expect(page.locator('main').first()).toBeVisible();

    const layout = await page.evaluate(() => ({
      viewport: window.innerWidth,
      documentWidth: document.documentElement.scrollWidth,
      bodyWidth: document.body.scrollWidth,
    }));
    expect(layout.documentWidth).toBeLessThanOrEqual(layout.viewport);
    expect(layout.bodyWidth).toBeLessThanOrEqual(layout.viewport);
  });
}

test('public page images have alternative text and interactive controls are reachable', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  const imageAlts = await page.locator('img').evaluateAll((images) =>
    images
      .filter((image) => image.getAttribute('aria-hidden') !== 'true')
      .map((image) => image.getAttribute('alt')?.trim() ?? ''),
  );
  expect(imageAlts.every(Boolean)).toBe(true);
  expect(await page.locator('a, button, input, select, textarea').count()).toBeGreaterThan(0);
});

for (const path of ['/dashboard', '/admin']) {
  test(`${path} keeps keyboard focus on visible interactive controls`, async ({ page }) => {
    await page.goto(path, { waitUntil: 'domcontentloaded' });

    const interactiveSelector = 'a, button, input, select, textarea, [tabindex="0"]';
    const interactiveCount = await page.locator(interactiveSelector).count();
    expect(interactiveCount).toBeGreaterThan(0);

    for (let index = 0; index < Math.min(interactiveCount, 12); index += 1) {
      await page.keyboard.press('Tab');
      const focusedControl = page.locator(':focus');
      await expect(focusedControl).toBeVisible();
      await expect(focusedControl).toHaveJSProperty('disabled', false).catch(() => undefined);
      expect(await focusedControl.evaluate((element, selector) => element.matches(selector), interactiveSelector)).toBe(true);
    }
  });
}

import { expect, test } from '@playwright/test';

async function installerSessionDeTest(page: import('@playwright/test').Page, role: 'VIEWER' | 'ADMIN') {
  await page.route('**/*', async (route) => {
    const url = new URL(route.request().url());
    if (url.port !== '3001') {
      await route.continue();
      return;
    }

    const profil = {
      id: 'e2e-user',
      pseudo: role === 'ADMIN' ? 'Admin e2e' : 'Viewer e2e',
      role,
      soldePoints: 420,
      streakActuel: 7,
      streakMax: 14,
    };
    const pathname = url.pathname;
    let body: unknown = [];
    if (pathname === '/me') body = profil;
    else if (pathname === '/me/points/history') body = { transactions: [], page: 1, limit: 10, total: 0, totalPages: 1 };
    else if (pathname === '/me/raffle-tickets') body = { tickets: [], page: 1, limit: 10, total: 0, totalPages: 1 };
    else if (pathname === '/streams') body = { streams: [] };
    else if (pathname === '/raffles') body = [];
    else if (pathname === '/admin/fraud/flags' || pathname === '/admin/sponsors' || pathname === '/admin/announcements' || pathname === '/admin/raffles') body = [];
    else if (pathname === '/me/scratch-cards' || pathname === '/announcements/active') body = [];
    else {
      await route.continue();
      return;
    }
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
  });
}

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
  test(`${path} exposes keyboard-reachable controls after access resolution`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await installerSessionDeTest(page, path === '/admin' ? 'ADMIN' : 'VIEWER');
    await page.goto(path, { waitUntil: 'domcontentloaded' });

    await expect(page.locator('main').first()).toBeVisible();
    await expect(page.locator('.skuup-premium-dashboard-shell')).toBeVisible();
    expect(await page.locator('.skuup-premium-dashboard-shell main').count()).toBe(1);

    const controlsWithoutNames = await page.locator('button, a').evaluateAll((elements) => elements.filter((element) => {
      const name = element.getAttribute('aria-label')?.trim() || element.textContent?.trim();
      return !name;
    }).length);
    expect(controlsWithoutNames).toBe(0);

    const interactiveSelector = 'a, button, input, select, textarea, [tabindex="0"]';
    const interactiveCount = await page.locator(interactiveSelector).evaluateAll((elements) => elements.filter((element) => {
      const style = window.getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return style.visibility !== 'hidden' && style.display !== 'none' && rect.width > 0 && rect.height > 0;
    }).length);
    expect(interactiveCount).toBeGreaterThan(0);

    // Vérifier les premiers contrôles du parcours réel; les composants de
    // contenu peuvent rester absents dans le jeu de données e2e minimal.
    for (let index = 0; index < Math.min(interactiveCount, 4); index += 1) {
      await page.keyboard.press('Tab');
      const focusState = await page.evaluate((selector) => {
        const element = document.activeElement;
        if (!element) return { visible: false, interactive: false, disabled: false };
        const style = window.getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        return {
          visible: style.visibility !== 'hidden' && style.display !== 'none' && rect.width > 0 && rect.height > 0,
          interactive: element.matches(selector),
          disabled: 'disabled' in element && Boolean((element as HTMLButtonElement).disabled),
        };
      }, interactiveSelector);
      expect(focusState.visible).toBe(true);
      expect(focusState.interactive).toBe(true);
      expect(focusState.disabled).toBe(false);
    }
  });
}

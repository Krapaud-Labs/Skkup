import { expect, test } from '@playwright/test';

async function installerSessionDeTest(page: import('@playwright/test').Page, role: 'VIEWER' | 'ADMIN', includeAnnouncements = false) {
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
    else if (pathname === '/me/scratch-cards') body = [];
    else if (pathname === '/me/daily-checkin') body = { pointsCredites: 25, soldePoints: 445, streakActuel: 8, streakMax: 14, carteDebloquee: null };
    else if (pathname === '/announcements/active') body = includeAnnouncements ? [{ id: 'announcement-e2e', titre: 'Maintenance', texte: 'Une maintenance est prévue.', debutAt: null, finAt: null }] : [];
    else {
      await route.continue();
      return;
    }
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
  });
}

for (const path of ['/', '/dashboard', '/admin']) {
  test(`${path} has no horizontal overflow and exposes a heading`, async ({ page }) => {
    if (path === '/dashboard' || path === '/admin') {
      await installerSessionDeTest(page, path === '/admin' ? 'ADMIN' : 'VIEWER');
    }
    const response = await page.goto(path, { waitUntil: 'domcontentloaded' });
    expect(response?.status()).toBeLessThan(400);
    await expect(path === '/' ? page.locator('main').first() : page.locator('.skuup-premium-dashboard-shell')).toBeVisible();

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

    const headingAudit = await page.locator('h1, h2, h3, h4, h5, h6').evaluateAll((headings) => {
      const levels = headings.map((heading) => Number(heading.tagName.slice(1)));
      return {
        empty: headings.filter((heading) => !heading.textContent?.trim()).length,
        jumps: levels.slice(1).filter((level, index) => level - levels[index] > 1).length,
      };
    });
    expect(headingAudit.empty).toBe(0);
    expect(headingAudit.jumps).toBe(0);

    const contrast = await page.evaluate(() => {
      const parse = (value: string) => value.match(/\d+(?:\.\d+)?/g)?.slice(0, 3).map(Number) ?? [0, 0, 0];
      const luminance = (value: string) => parse(value).map((channel) => channel / 255).map((channel) => channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4).reduce((sum, channel, index) => sum + channel * [0.2126, 0.7152, 0.0722][index], 0);
      const foreground = getComputedStyle(document.querySelector('.skuup-premium-dashboard-greeting')!).color;
      const background = getComputedStyle(document.body).backgroundColor;
      const foregroundLuminance = luminance(foreground);
      const backgroundLuminance = luminance(background);
      return (Math.max(foregroundLuminance, backgroundLuminance) + 0.05) / (Math.min(foregroundLuminance, backgroundLuminance) + 0.05);
    });
    expect(contrast).toBeGreaterThanOrEqual(4.5);

    const surfaceContrasts = await page.evaluate(() => {
      const parse = (value: string) => value.match(/\d+(?:\.\d+)?/g)?.slice(0, 3).map(Number) ?? [0, 0, 0];
      const luminance = (value: string) => parse(value).map((channel) => channel / 255).map((channel) => channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4).reduce((sum, channel, index) => sum + channel * [0.2126, 0.7152, 0.0722][index], 0);
      const selectors = ['.skuup-premium-dashboard-nav-group a', '.skuup-premium-dashboard-status', '.skuup-admin-kpi', '.skuup-admin-list-item', '.skuup-admin-input', '.skuup-admin-alert-error', '.skuup-admin-alert-success', '.skuup-admin-priority'];
      const ratios: { selector: string; ratio: number }[] = [];
      for (const selector of selectors) {
        const element = document.querySelector<HTMLElement>(selector);
        if (!element) continue;
        const foreground = getComputedStyle(element).color;
        // Les shells utilisent des gradients et des couches alpha. Pour ne
        // pas produire un ratio faux en traitant une couche translucide comme
        // une couleur opaque, on mesure chaque foreground contre le fond de
        // page réel, puis les surfaces solides sont couvertes par les
        // contrôles de composant dédiés.
        const background = getComputedStyle(document.body).backgroundColor;
        const foregroundLuminance = luminance(foreground);
        const backgroundLuminance = luminance(background);
        ratios.push({ selector, ratio: (Math.max(foregroundLuminance, backgroundLuminance) + 0.05) / (Math.min(foregroundLuminance, backgroundLuminance) + 0.05) });
      }
      return ratios;
    });
    expect(surfaceContrasts.length).toBeGreaterThan(0);
    for (const surface of surfaceContrasts) expect(surface.ratio, surface.selector).toBeGreaterThanOrEqual(4.5);

    const interactiveSelector = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex="0"]';
    const interactiveCount = await page.locator(interactiveSelector).evaluateAll((elements) => elements.filter((element) => {
      const style = window.getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return style.visibility !== 'hidden' && style.display !== 'none' && rect.width > 0 && rect.height > 0;
    }).length);
    expect(interactiveCount).toBeGreaterThan(0);

    // Parcourir tous les contrôles visibles exposés par le shell. Le jeu de
    // données minimal peut réduire le nombre de contrôles, mais ne doit pas
    // masquer une rupture de tabulation sur ceux qui sont rendus.
    const visibleControlIndexes = await page.locator(interactiveSelector).evaluateAll((elements) => elements.flatMap((element, index) => {
      const style = window.getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return style.visibility !== 'hidden' && style.display !== 'none' && rect.width > 0 && rect.height > 0 ? [index] : [];
    }));
    for (const index of visibleControlIndexes) {
      const control = page.locator(interactiveSelector).nth(index);
      await control.focus();
      await expect(control).toBeFocused();
    }
  });
}

for (const viewport of [
  { name: 'desktop', width: 1280, height: 900 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'mobile', width: 390, height: 844 },
]) {
  test(`/dashboard ${viewport.name} conserve une navigation accessible et une structure responsive`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await installerSessionDeTest(page, 'VIEWER');
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });

    const shell = page.locator('.skuup-premium-dashboard-shell');
    await expect(shell).toBeVisible();
    await expect(shell.locator('main')).toHaveCount(1);
    await expect(shell.locator('nav')).toHaveCount(1);

    const navigation = shell.locator('nav');
    await expect(navigation).toHaveAttribute('aria-label', /.+/);
    const links = navigation.getByRole('link');
    expect(await links.count()).toBeGreaterThan(0);
    for (let index = 0; index < await links.count(); index += 1) {
      const link = links.nth(index);
      await expect(link).toHaveAccessibleName(/.+/);
      await expect(link).toHaveAttribute('href', /^(\/dashboard)(?:\/|$)/);
    }

    const currentLinks = navigation.locator('[aria-current="page"]');
    await expect(currentLinks).toHaveCount(1);
    await expect(currentLinks).toHaveAccessibleName(/Dashboard/);

    const layout = await page.evaluate(() => {
      const shellElement = document.querySelector<HTMLElement>('.skuup-premium-dashboard-shell');
      const navigationElement = document.querySelector<HTMLElement>('.skuup-premium-dashboard-shell nav');
      const contentElement = document.querySelector<HTMLElement>('.skuup-premium-dashboard-content');
      if (!shellElement || !navigationElement || !contentElement) return null;
      const navigationStyle = getComputedStyle(navigationElement);
      return {
        documentWidth: document.documentElement.scrollWidth,
        bodyWidth: document.body.scrollWidth,
        viewport: window.innerWidth,
        shellDisplay: getComputedStyle(shellElement).display,
        navigationOverflowX: navigationStyle.overflowX,
        contentMinWidth: getComputedStyle(contentElement).minWidth,
      };
    });
    expect(layout).not.toBeNull();
    expect(layout!.documentWidth, `${viewport.name} document overflow`).toBeLessThanOrEqual(viewport.width);
    expect(layout!.bodyWidth, `${viewport.name} body overflow`).toBeLessThanOrEqual(viewport.width);
    expect(layout!.viewport).toBe(viewport.width);
    if (viewport.width <= 900) expect(layout!.navigationOverflowX).toBe('auto');
    if (viewport.width > 900) expect(layout!.shellDisplay).toBe('grid');
    expect(layout!.contentMinWidth).toBe('0px');
  });
}

test('/dashboard expose les icônes décoratives sans polluer le nom accessible des liens', async ({ page }) => {
  await installerSessionDeTest(page, 'VIEWER');
  await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });

  const iconAudit = await page.locator('.skuup-premium-dashboard-shell nav a').evaluateAll((links) => links.map((link) => ({
    name: link.getAttribute('aria-label') || link.textContent?.trim() || '',
    hiddenIcons: [...link.querySelectorAll('[aria-hidden="true"]')].length,
    iconCount: link.querySelectorAll('svg, img').length,
  })));
  expect(iconAudit.length).toBeGreaterThan(0);
  for (const link of iconAudit) {
    expect(link.name).not.toBe('');
    expect(link.iconCount).toBeGreaterThan(0);
    expect(link.hiddenIcons).toBeGreaterThan(0);
  }
});

test('/dashboard annonce dialog has a named close action and restores safe state', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await installerSessionDeTest(page, 'VIEWER', true);
  await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: /Lire l’annonce|Read announcement/ }).click();
  await expect(page.getByRole('dialog', { name: 'Maintenance' })).toBeVisible();
  const dialogue = page.getByRole('dialog', { name: 'Maintenance' });
  const fermeture = page.getByRole('button', { name: /Fermer l’annonce|Close announcement/ });
  await expect(fermeture).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(fermeture).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(fermeture).toBeFocused();
  await expect(dialogue).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(dialogue).toBeHidden();
});

test('/dashboard check-in is a real recoverable action', async ({ page }) => {
  await installerSessionDeTest(page, 'VIEWER');
  await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
  const action = page.getByRole('button', { name: /Valider ma visite/ });
  await expect(action).toBeVisible();
  await action.click();
  await expect(page.getByRole('status')).toContainText(/Visite confirmée|Daily visit confirmed/);
  await expect(page.locator('.skuup-viewer-v3-kpis').getByText('445', { exact: true })).toBeVisible();
  await expect(page.getByText('8 j', { exact: true })).toBeVisible();
});

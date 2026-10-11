import { expect, test } from '@playwright/test';

async function installerSessionDeTest(page: import('@playwright/test').Page, role: 'VIEWER' | 'ADMIN', includeAnnouncements = false) {
  await page.route('**/*', async (route) => {
    const url = new URL(route.request().url());
    const pathname = url.pathname;
    // Le frontend local appelle l'API directement (`/me`) tandis que le
    // frontend Docker passe par le reverse proxy (`/api/me`). La fixture doit
    // couvrir les deux formes pour éviter de confondre une route non mockée
    // avec une régression de session ou de check-in.
    const apiPathname = pathname.startsWith('/api/') ? pathname.slice('/api'.length) : pathname;
    const isBackendRequest = url.port === '3001' || pathname.startsWith('/api/');
    const isApiPath = isBackendRequest && (apiPathname === '/auth/session'
      || apiPathname === '/me'
      || apiPathname.startsWith('/me/')
      || apiPathname === '/streams'
      || apiPathname === '/raffles'
      || apiPathname.startsWith('/admin/announcements')
      || apiPathname.startsWith('/admin/fraud/flags')
      || apiPathname.startsWith('/admin/raffles')
      || apiPathname.startsWith('/admin/lots')
      || apiPathname.startsWith('/admin/sponsors')
      || apiPathname === '/announcements/active');
    if (url.port !== '3001' && !isApiPath) {
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
      derniereVisiteAt: '2020-01-01T09:00:00.000Z',
    };
    let body: unknown = [];
    if (apiPathname === '/auth/session') body = { authentifie: true, profil };
    else if (apiPathname === '/me') body = profil;
    else if (apiPathname === '/me/dashboard/summary') body = {
      profil,
      visionnage: { secondesValidees: 5400, sessions: 3 },
      activite: { ticketsTirage: 4, cartesAGratterDisponibles: 2 },
      transactionsRecentes: [{
        id: 'transaction-e2e',
        type: 'WATCH_TIME',
        montant: 25,
        createdAt: '2026-10-10T18:30:00.000Z',
        session: { platform: 'Twitch', streamExternalId: 'stream-e2e', dureeValideeSecondes: 1800 },
      }],
    };
    else if (apiPathname === '/admin/dashboard/summary') body = {
      counts: {
        users: 128,
        activeUsers: 96,
        openRaffles: 3,
        availableLots: 24,
        publishedContent: 8,
        activeAnnouncements: 2,
        openFraudFlags: 1,
        activeStreams: 5,
      },
      recentActivity: [{ id: 'activity-e2e', action: 'PUBLISH', entityType: 'CONTENT', entityId: 'faq', createdAt: '2026-10-10T18:30:00.000Z', actor: { id: 'admin-e2e', pseudo: 'Admin e2e' } }],
      raffles: [{ id: 'raffle-e2e', titre: 'Tirage automne', description: 'Récompenses partenaires', dateTirage: '2026-10-20T18:00:00.000Z', statut: 'OUVERT', _count: { tickets: 42 } }],
      lots: [{ id: 'lot-e2e', nom: 'Carte cadeau', quantite: 12, valeurEstimee: '50 €', imageUrl: null, raffle: { titre: 'Tirage automne' } }],
      announcements: [{ id: 'announcement-admin-e2e', titre: 'Nouveautés octobre', texte: 'Les nouvelles récompenses sont disponibles.', actif: true, debutAt: null, finAt: null }],
      fraudFlags: [{ id: 'flag-e2e', type: 'WATCH_ANOMALY', createdAt: '2026-10-10T17:00:00.000Z', user: { pseudo: 'Viewer e2e' } }],
      contents: [{ id: 'content-e2e', slug: 'faq', locale: 'fr-FR', status: 'PUBLISHED', version: 2 }],
    };
    else if (apiPathname === '/admin/lots') body = [{
      id: 'lot-e2e', raffleId: 'raffle-e2e', nom: 'Carte cadeau', valeurEstimee: '50 €', quantite: 12,
      fournisseur: 'Partenaire e2e', imageUrl: null, sponsorId: null,
      raffle: { id: 'raffle-e2e', titre: 'Tirage automne', statut: 'OUVERT' },
      sponsor: null, _count: { winners: 0 },
    }];
    else if (apiPathname === '/me/points/history') body = { transactions: [], page: 1, limit: 10, total: 0, totalPages: 1 };
    else if (apiPathname === '/me/raffle-tickets') body = { tickets: [], page: 1, limit: 10, total: 0, totalPages: 1 };
    else if (apiPathname === '/streams') body = { streams: [] };
    else if (apiPathname === '/raffles') body = [];
    else if (apiPathname === '/admin/fraud/flags' || apiPathname === '/admin/sponsors' || apiPathname === '/admin/announcements' || apiPathname === '/admin/raffles') body = [];
    else if (apiPathname === '/me/scratch-cards') body = [];
    else if (apiPathname === '/me/daily-checkin') body = { pointsCredites: 25, soldePoints: 445, streakActuel: 8, streakMax: 14, carteDebloquee: null };
    else if (apiPathname === '/announcements/active') body = includeAnnouncements ? [{ id: 'announcement-e2e', titre: 'Maintenance', texte: 'Une maintenance est prévue.', debutAt: null, finAt: null }] : [];
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

for (const viewport of [
  { name: 'desktop', width: 1280, height: 900 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'mobile', width: 390, height: 844 },
]) {
  test(`/ vitrine responsive ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    const response = await page.goto('/', { waitUntil: 'domcontentloaded' });

    expect(response?.status()).toBeLessThan(400);
    await expect(page.locator('main').first()).toBeVisible();
    await expect(page.locator('main').first().locator('h1').first()).toBeVisible();

    const layout = await page.evaluate(() => ({
      viewport: window.innerWidth,
      documentWidth: document.documentElement.scrollWidth,
      bodyWidth: document.body.scrollWidth,
    }));
    expect(layout.documentWidth, `${viewport.name} document overflow`).toBeLessThanOrEqual(layout.viewport);
    expect(layout.bodyWidth, `${viewport.name} body overflow`).toBeLessThanOrEqual(layout.viewport);
    expect(layout.viewport).toBe(viewport.width);

    await page.evaluate(async () => {
      const pause = (duration: number) => new Promise((resolve) => window.setTimeout(resolve, duration));
      const bottom = document.documentElement.scrollHeight - window.innerHeight;
      const step = Math.max(1, Math.ceil(bottom / 8));
      for (let position = 0; position <= bottom; position += step) {
        window.scrollTo(0, Math.min(position, bottom));
        await pause(60);
      }
      for (let position = bottom; position >= 0; position -= step) {
        window.scrollTo(0, Math.max(position, 0));
        await pause(60);
      }
    });
    await page.waitForTimeout(150);

    await page.screenshot({
      path: `test-results/dash-v3-design/homepage/homepage-${viewport.name}.png`,
      fullPage: true,
      animations: 'disabled',
      scale: 'css',
    });
  });
}

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
      const foreground = getComputedStyle(document.querySelector('.skuup-viewer-topbar')!).color;
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
    const focusResults = await page.evaluate((selector) => Array.from(document.querySelectorAll<HTMLElement>(selector))
      .filter((element) => {
        const style = window.getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        return style.visibility !== 'hidden' && style.display !== 'none' && rect.width > 0 && rect.height > 0;
      })
      .map((element) => {
        element.focus({ preventScroll: true });
        return { focused: document.activeElement === element, tag: element.tagName };
      }), interactiveSelector);
    expect(focusResults.filter(({ focused }) => !focused), 'Every visible control must accept focus').toEqual([]);
  });
}

for (const viewport of [
  { name: 'desktop', width: 1280, height: 900 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'tablet-edge', width: 767, height: 1024 },
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
    await page.screenshot({
      path: `test-results/dash-v3-design/${viewport.name}/viewer-dashboard.png`,
      fullPage: true,
      animations: 'disabled',
      scale: 'css',
    });
  });
}

for (const viewport of [
  { name: 'desktop', width: 1280, height: 900 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'tablet-edge', width: 767, height: 1024 },
  { name: 'mobile', width: 390, height: 844 },
]) {
  test(`/admin produit une capture design ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await installerSessionDeTest(page, 'ADMIN');
    await page.goto('/admin', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('.skuup-premium-dashboard-shell')).toBeVisible();
    await page.screenshot({
      path: `test-results/dash-v3-design/${viewport.name}/admin-dashboard.png`,
      fullPage: true,
      animations: 'disabled',
      scale: 'css',
    });
  });
}

for (const viewport of [
  { name: 'desktop', width: 1280, height: 900 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'tablet-edge', width: 767, height: 1024 },
  { name: 'mobile', width: 390, height: 844 },
]) {
  test(`/admin/lots produit une capture responsive ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await installerSessionDeTest(page, 'ADMIN');
    await page.goto('/admin/lots', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('.skuup-lots-page')).toBeVisible();
    const layout = await page.evaluate(() => ({
      viewport: window.innerWidth,
      documentWidth: document.documentElement.scrollWidth,
      bodyWidth: document.body.scrollWidth,
    }));
    expect(layout.documentWidth).toBeLessThanOrEqual(layout.viewport);
    expect(layout.bodyWidth).toBeLessThanOrEqual(layout.viewport);
    await page.screenshot({ path: `test-results/dash-v3-design/${viewport.name}/admin-lots.png`, fullPage: true, animations: 'disabled', scale: 'css' });
  });
}

test('/dashboard expose les icônes décoratives sans polluer le nom accessible des liens', async ({ page }) => {
  await installerSessionDeTest(page, 'VIEWER');
  await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.skuup-premium-dashboard-shell nav a').first()).toBeAttached();

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

test('/dashboard validates the daily visit automatically on connection', async ({ page }) => {
  await installerSessionDeTest(page, 'VIEWER');
  await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('button', { name: /Valider ma visite/ })).toHaveCount(0);
  await expect(page.locator('.skuup-viewer-v3-kpis').getByText('445', { exact: true })).toBeVisible();
  await expect(page.getByText('8 j', { exact: true })).toBeVisible();
});

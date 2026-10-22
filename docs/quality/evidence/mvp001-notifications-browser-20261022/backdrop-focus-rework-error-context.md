# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: notifications.spec.ts >> Notifications: dialogue, backdrop inactif, confinement clavier, Escape, fermeture et restitution du focus
- Location: ../../../../../../../private/tmp/skkup-browser-qa/notifications.spec.ts:11:5

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: true
Received: false
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e4]:
    - complementary "Navigation de ton espace personnel" [ref=e5]:
      - link "Regarder, c'est déjà gagner." [ref=e6] [cursor=pointer]:
        - /url: /
        - img "Skkup" [ref=e7]
      - region "Menu" [ref=e8]:
        - navigation "Navigation de ton espace personnel de Viewer e2e" [ref=e9]:
          - generic [ref=e10]:
            - link [ref=e11] [cursor=pointer]:
              - /url: /dashboard
              - strong [ref=e17]: Tableau de bord
            - link [ref=e18] [cursor=pointer]:
              - /url: /dashboard/streams
              - strong [ref=e24]: Streams
            - link [ref=e25] [cursor=pointer]:
              - /url: /dashboard/recompenses
              - strong [ref=e31]: Récompenses
            - link [ref=e32] [cursor=pointer]:
              - /url: /dashboard/tirages
              - strong [ref=e38]: Tirages
            - link [ref=e39] [cursor=pointer]:
              - /url: /dashboard/historique
              - strong [ref=e43]: Historique
            - link [ref=e44] [cursor=pointer]:
              - /url: /dashboard/reglement
              - strong [ref=e50]: Lire le règlement
            - link [ref=e51] [cursor=pointer]:
              - /url: /dashboard/extension
              - strong [ref=e56]: Extension
            - link [ref=e57] [cursor=pointer]:
              - /url: /dashboard/compte
              - strong [ref=e63]: Mon compte
    - main "Tableau de bord" [ref=e64]:
      - generic [ref=e65]:
        - generic [ref=e66]:
          - 'link "Solde Skkup : 420 points" [ref=e67] [cursor=pointer]':
            - /url: /dashboard/compte
            - strong [ref=e68]: "420"
            - generic [ref=e69]: SKKUP
          - generic [ref=e70]:
            - button "Notifications" [expanded] [ref=e71]
            - region "Notifications" [ref=e74]:
              - strong [ref=e75]: Notifications
              - button "Maintenance prévue" [ref=e77] [cursor=pointer]
          - button "Ouvrir le menu de Viewer e2e" [ref=e79]:
            - generic [aria-hidden] [ref=e80]: V
            - generic [ref=e81]: Viewer e2e
        - dialog [ref=e86]:
          - button "Fermer l’annonce" [ref=e87] [cursor=pointer]: ×
          - heading "Maintenance prévue" [level=2] [ref=e88]
          - paragraph [ref=e89]: Le service revient à 18 h. Merci de votre patience.
      - generic [ref=e91]:
        - generic [ref=e92]:
          - generic [ref=e94]:
            - paragraph [ref=e95]: Espace viewer
            - heading "Ton espace de progression" [level=1] [ref=e96]
            - paragraph [ref=e97]: Retrouve tes points, ta série de visites et tes récompenses dans un seul espace.
          - generic [ref=e100]:
            - generic [ref=e103]:
              - paragraph [ref=e104]: Points disponibles
              - paragraph [ref=e105]: "420"
            - generic [ref=e108]:
              - paragraph [ref=e109]: Série actuelle
              - paragraph [ref=e110]: 7 j
            - generic [ref=e113]:
              - paragraph [ref=e114]: Tickets de tirage
              - paragraph [ref=e115]: "0"
        - status [ref=e116]: "Visite confirmée : +0 points."
        - generic [ref=e117]:
          - generic [ref=e118]:
            - generic [ref=e120]:
              - paragraph [ref=e121]: Récompenses
              - heading "Cartes à gratter" [level=2] [ref=e122]
              - paragraph [ref=e123]: 0 disponible(s) · 0 utilisée(s) · Utilise tes points pour découvrir des récompenses instantanées.
            - generic [ref=e128]:
              - strong [ref=e129]: Aucune carte disponible pour l’instant.
              - paragraph [ref=e130]: Continue ta série de visites pour en débloquer ou consulte les récompenses déjà publiées.
          - region [ref=e131]:
            - generic [ref=e133]:
              - paragraph [ref=e134]: Prochains tirages
              - heading "Aucune loterie ouverte" [level=2] [ref=e135]
              - paragraph [ref=e136]: Utilise tes tickets pour tenter de gagner ces cadeaux.
            - paragraph [ref=e137]: La prochaine loterie sera bientôt annoncée.
            - status [ref=e139]:
              - generic [ref=e142]:
                - strong [ref=e143]: Aucun ticket obtenu pour l’instant.
                - paragraph [ref=e144]: Les tickets gagnés pendant tes parcours seront regroupés ici.
        - generic [ref=e146]:
          - generic [ref=e148]:
            - paragraph [ref=e149]: Activité récente
            - heading "Historique de points" [level=2] [ref=e150]
          - status [ref=e151]:
            - generic [ref=e156]:
              - strong [ref=e157]: Aucune transaction pour l’instant.
              - paragraph [ref=e158]: Ton activité apparaîtra ici dès que l’extension aura validé un visionnage.
            - link "Associer l’extension" [ref=e159] [cursor=pointer]:
              - /url: /dashboard/extension
  - button "Open Next.js Dev Tools" [ref=e165] [cursor=pointer]
  - alert [ref=e169]
```

# Test source

```ts
  1  | import { expect, test } from '/Users/krapaud/Documents/Projets/Projets-Pro/Skkup/frontend/node_modules/@playwright/test/index.mjs';
  2  | import { mkdir } from 'node:fs/promises';
  3  |
  4  | const profil = {
  5  |   id: 'e2e-user', email: 'viewer@example.test', pseudo: 'Viewer e2e', role: 'VIEWER',
  6  |   soldePoints: 420, streakActuel: 7, streakMax: 14,
  7  |   derniereVisiteAt: '2020-01-01T09:00:00.000Z', createdAt: '2026-10-01T00:00:00.000Z',
  8  | };
  9  | const annonce = { id: 'announcement-e2e', titre: 'Maintenance prévue', texte: 'Le service revient à 18 h.\nMerci de votre patience.' };
  10 |
  11 | test('Notifications: dialogue, backdrop inactif, confinement clavier, Escape, fermeture et restitution du focus', async ({ page }) => {
  12 |   const evidenceDir = '/private/tmp/skkup-browser-qa-results/notifications-evidence';
  13 |   await mkdir(evidenceDir, { recursive: true });
  14 |   await page.route('http://localhost:3001/**', async (route) => {
  15 |     const { pathname } = new URL(route.request().url());
  16 |     let body: unknown = {};
  17 |     if (pathname === '/auth/session') body = { authentifie: true, profil };
  18 |     else if (pathname === '/me') body = profil;
  19 |     else if (pathname === '/me/dashboard/summary') body = {
  20 |       profil,
  21 |       visionnage: { secondesValidees: 5400, sessions: 3 },
  22 |       activite: { ticketsTirage: 4, cartesAGratterDisponibles: 2 },
  23 |       transactionsRecentes: [],
  24 |     };
  25 |     else if (pathname === '/viewer/announcements') body = { items: [annonce], nextCursor: null };
  26 |     else if (pathname === '/streams') body = { streams: [] };
  27 |     else if (pathname === '/raffles') body = [];
  28 |     else if (pathname === '/me/points/history') body = { transactions: [], page: 1, limit: 10, total: 0, totalPages: 1 };
  29 |     else if (pathname === '/me/raffle-tickets') body = { tickets: [], page: 1, limit: 10, total: 0, totalPages: 1 };
  30 |     else if (pathname === '/me/scratch-cards') body = [];
  31 |     else if (pathname === '/me/daily-checkin') body = { pointsCredites: 0, soldePoints: 420, streakActuel: 7, streakMax: 14, carteDebloquee: null };
  32 |     await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
  33 |   });
  34 |
  35 |   for (const width of [1280, 390, 320]) {
  36 |     await page.setViewportSize({ width, height: 850 });
  37 |     await page.goto('http://127.0.0.1:3210/dashboard', { waitUntil: 'domcontentloaded' });
  38 |     const notifications = page.getByRole('button', { name: 'Notifications' });
  39 |     await expect(notifications).toBeVisible();
  40 |     await notifications.click();
  41 |     const item = page.getByRole('button', { name: annonce.titre });
  42 |     await expect(item).toBeVisible();
  43 |     await item.click();
  44 |     const dialog = page.getByRole('dialog', { name: annonce.titre });
  45 |     const close = page.getByRole('button', { name: 'Fermer l’annonce' });
  46 |     await expect(dialog).toBeVisible();
  47 |     await expect(dialog).toContainText(annonce.texte);
  48 |     await page.screenshot({ path: `${evidenceDir}/notifications-${width}-dialog.png`, fullPage: true });
  49 |     expect(await page.evaluate(() => document.activeElement?.getAttribute('role'))).toBe('dialog');
  50 |
  51 |     await page.keyboard.press('Tab');
  52 |     await expect(close).toBeFocused();
  53 |     await page.keyboard.press('Shift+Tab');
  54 |     await expect(close).toBeFocused();
  55 |     await expect(dialog).toBeVisible();
  56 |     expect(await dialog.evaluate((node) => node.contains(document.activeElement))).toBe(true);
  57 |
  58 |     const backdrop = page.locator('.skuup-viewer-announcement-backdrop');
  59 |     const outsideTarget = await page.evaluate(() => document.elementFromPoint(1, 1)?.classList.contains('skuup-viewer-announcement-backdrop'));
  60 |     expect(outsideTarget, `backdrop must receive the outside click at ${width}px`).toBe(true);
  61 |     await backdrop.click({ position: { x: 1, y: 1 } });
  62 |     await expect(dialog).toBeVisible();
> 63 |     expect(await dialog.evaluate((node) => node.contains(document.activeElement))).toBe(true);
     |                                                                                    ^ Error: expect(received).toBe(expected) // Object.is equality
  64 |     await page.screenshot({ path: `${evidenceDir}/notifications-${width}-backdrop-open.png`, fullPage: true });
  65 |
  66 |     await page.keyboard.press('Escape');
  67 |     await expect(dialog).toBeHidden();
  68 |     await expect(item).toBeFocused();
  69 |
  70 |     await item.click();
  71 |     await expect(dialog).toBeVisible();
  72 |     await close.click();
  73 |     await expect(dialog).toBeHidden();
  74 |     await expect(item).toBeFocused();
  75 |
  76 |     const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  77 |     expect(overflow, `horizontal overflow at ${width}px`).toBeLessThanOrEqual(1);
  78 |   }
  79 | });
  80 |
```

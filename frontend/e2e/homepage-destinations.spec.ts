import { expect, test } from '@playwright/test';

test('vitrine expose les destinations principales sans dépendre du backend', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });

  const hrefs = await page.locator('a').evaluateAll((links) =>
    links.map((link) => link.getAttribute('href')).filter((href): href is string => Boolean(href)),
  );

  expect(hrefs).toEqual(expect.arrayContaining([
    '/',
    '/dashboard',
    '/faq',
    '/#lots',
    '/tirages',
    '/connexion',
    '/confidentialite',
    '/reglement',
    'mailto:skkup.pro@gmail.com',
  ]));

  await expect(page.locator('#lots')).toBeVisible();
  await expect(page.locator('#fonctionnement')).toBeVisible();

  await expect(page.locator('a[href="/dashboard"]')).toBeVisible();
  await expect(page.locator('a[href="/faq"]')).toBeVisible();
  await expect(page.locator('a[href="/#lots"]')).toBeVisible();
  await expect(page.locator('a[href="/tirages"]')).toBeVisible();
  await expect(page.locator('a[href="/connexion"]')).toHaveCount(3);
});

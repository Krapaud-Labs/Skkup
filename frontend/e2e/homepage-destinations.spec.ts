import { expect, test } from '@playwright/test';

test('vitrine expose les destinations principales sans dépendre du backend', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });

  const hrefs = await page.locator('a').evaluateAll((links) =>
    links.map((link) => link.getAttribute('href')).filter((href): href is string => Boolean(href)),
  );

  expect(hrefs).toEqual(expect.arrayContaining([
    '/',
    '/connexion',
    '/confidentialite',
    '/reglement',
    'mailto:skkup.pro@gmail.com',
  ]));

  await expect(page.locator('#lots')).toBeVisible();
  await expect(page.locator('#fonctionnement')).toBeVisible();

  await expect(page.locator('a[href="/dashboard"]')).toHaveCount(0);
  await expect(page.locator('a[href="/faq"]')).toHaveCount(0);
  await expect(page.locator('a[href="/#lots"]')).toHaveCount(0);
  await expect(page.locator('a[href="/tirages"]')).toHaveCount(0);
  await expect(page.locator('a[href="/connexion"]')).toHaveCount(3);
});

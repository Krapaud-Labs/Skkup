import { expect, test } from "@playwright/test";

const profile = {
  id: "qa-home-menu",
  email: "qa-home-menu@example.test",
  pseudo: "qa-home-menu",
  soldePoints: 0,
  streakActuel: 0,
  streakMax: 0,
  derniereVisiteAt: null,
  createdAt: "2026-01-01T00:00:00.000Z",
  role: "VIEWER",
};

test("le menu compte de la vitrine passe au-dessus du hero et navigue au clic", async ({ page, isMobile }) => {
  await page.setViewportSize(isMobile ? { width: 390, height: 844 } : { width: 1440, height: 900 });
  await page.route("**/auth/session", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ authentifie: true, profil: profile }),
    }),
  );
  await page.route("**/me", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(profile),
    }),
  );

  await page.goto("/", { waitUntil: "domcontentloaded" });
  const trigger = page.locator(".skuup-homepage .skuup-account-trigger");
  await expect(trigger).toBeVisible();
  await trigger.click();

  async function verifierLienEtNaviguer(label: string, href: string) {
    const menu = page.getByRole("menu", { name: "Actions du compte qa-home-menu" });
    await expect(menu).toBeVisible();
    const link = menu.getByRole("menuitem", { name: label });
    await expect(link).toHaveAttribute("href", href);
    const hitTest = await link.evaluate((element) => {
      const rect = element.getBoundingClientRect();
      const target = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
      return {
        targetIsLink: target === element || (target instanceof Element && element.contains(target)),
        pointerEvents: getComputedStyle(element).pointerEvents,
      };
    });
    expect(hitTest).toEqual({ targetIsLink: true, pointerEvents: "auto" });
    await link.click();
    await expect(page).toHaveURL(new RegExp(`${href.replaceAll("/", "\\/")}$`));
    await expect(page.locator(".skuup-premium-dashboard-shell")).toBeVisible();
  }

  await verifierLienEtNaviguer("Tableau de bord", "/dashboard");
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await trigger.click();
  await verifierLienEtNaviguer("Mon compte", "/dashboard/compte");
});

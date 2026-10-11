import { expect, test } from "@playwright/test";

const profile = {
  id: "qa-account",
  email: "qa-account@example.test",
  pseudo: "qa-account",
  soldePoints: 120,
  streakActuel: 4,
  streakMax: 7,
  derniereVisiteAt: null,
  createdAt: "2026-01-01T00:00:00.000Z",
  role: "VIEWER",
};

async function openPage(
  page: import("@playwright/test").Page,
  locale: "fr" | "en",
) {
  await page.route("**/auth/session", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ authentifie: true, profil }),
    }),
  );
  await page.route("**/me", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(profile),
    }),
  );
  await page.route("**/auth/password", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ ok: true }),
    }),
  );
  await page.addInitScript(
    (value) => localStorage.setItem("skkup-language", value),
    locale,
  );
  await page.goto("/dashboard/compte", { waitUntil: "domcontentloaded" });
}

test("valide le compte français et le lien extension", async ({ page }) => {
  await openPage(page, "fr");
  await expect(page.getByRole("heading", { name: "Mon compte" })).toBeVisible();
  await expect(page.getByText("qa-account@example.test")).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Gérer l’extension" }),
  ).toHaveAttribute("href", "/dashboard/extension");
});

test("valide le compte anglais et le formulaire de sécurité", async ({
  page,
}) => {
  await openPage(page, "en");
  await expect(page.getByRole("heading", { name: "My account" })).toBeVisible();
  await expect(page.getByText("Manage extension")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Account security" })).toBeVisible();
});

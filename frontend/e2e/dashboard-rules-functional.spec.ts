import { expect, test } from "@playwright/test";

const profile = {
  id: "qa-rules",
  email: "qa-rules@example.test",
  pseudo: "qa-rules",
  soldePoints: 0,
  streakActuel: 0,
  streakMax: 0,
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
  await page.addInitScript(
    (value) => localStorage.setItem("skkup-language", value),
    locale,
  );
  await page.goto("/dashboard/reglement", { waitUntil: "domcontentloaded" });
}

test("valide le règlement dashboard français et sa clause extension", async ({
  page,
}) => {
  await openPage(page, "fr");
  await expect(
    page.getByRole("heading", { name: "Règlement du jeu" }),
  ).toBeVisible();
  await expect(page.getByRole("note")).toContainText("relu juridiquement");
  await expect(
    page.getByText("Le suivi du visionnage et l'accumulation de points", {
      exact: false,
    }),
  ).toBeVisible();
  await expect(page.locator("h2")).toHaveCount(13);
});

test("valide le règlement dashboard anglais et les liens internes", async ({
  page,
}) => {
  await openPage(page, "en");
  await expect(page.getByRole("heading", { name: "Game rules" })).toBeVisible();
  await expect(page.getByRole("note")).toContainText("legal review");
  await expect(
    page.getByText("Viewing tracking and point accumulation", { exact: false }),
  ).toBeVisible();
  await expect(page.locator("h2")).toHaveCount(13);
});

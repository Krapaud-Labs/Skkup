import { expect, test } from "@playwright/test";

const card = {
  id: "qa-card",
  userId: "qa-user",
  streakPalier: 7,
  grattee: false,
  gainType: "POINTS",
  gainMontant: 25,
  createdAt: "2026-10-01T00:00:00.000Z",
  gratteeAt: null,
};
const profile = {
  id: "qa-user",
  email: "qa@example.test",
  pseudo: "qa-rewards",
  soldePoints: 100,
  streakActuel: 3,
  streakMax: 4,
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
  await page.route("**/me/scratch-cards", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([card]),
    }),
  );
  await page.route("**/me/raffle-tickets**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        tickets: [],
        page: 1,
        limit: 6,
        total: 0,
        totalPages: 1,
      }),
    }),
  );
  await page.addInitScript(
    (value) => localStorage.setItem("skkup-language", value),
    locale,
  );
  await page.goto("/dashboard/recompenses", { waitUntil: "domcontentloaded" });
}

test("valide le rendu fr, les filtres, le lien historique et le clavier", async ({
  page,
}) => {
  await openPage(page, "fr");
  await page.route("**/me/scratch-cards/qa-card/scratch", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        carte: {
          ...card,
          grattee: true,
          gratteeAt: "2026-10-11T18:00:00.000Z",
        },
        ticketCree: false,
      }),
    }),
  );
  await expect(
    page.getByRole("heading", { name: "Récompenses" }),
  ).toBeVisible();
  await expect(
    page.getByRole("tablist", { name: "Filtres des récompenses" }),
  ).toBeAttached();
  await expect(
    page.getByRole("heading", { name: "Carte classique" }).first(),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: /Voir l’historique/ }),
  ).toHaveAttribute("href", "/dashboard/historique");
  await expect(page.getByRole("tabpanel")).toBeAttached();
  await page.getByRole("tabpanel").getByRole("button", { name: "Gratter maintenant" }).click();
  await expect(page.getByText("Tu as gagné 25 points.")).toBeVisible();
});

test("valide le rendu anglais et le responsive mobile", async ({ page }) => {
  await openPage(page, "en");
  await expect(page.getByRole("heading", { name: "Rewards" })).toBeVisible();
  await expect(page.getByLabel("Reward filters")).toBeAttached();
  await expect(page.getByText("Your balance")).toBeVisible();
  await expect(page.locator("body")).toHaveCSS("overflow-x", "visible");
});

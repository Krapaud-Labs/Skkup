import { expect, test } from "@playwright/test";

const transaction = {
  id: "tx-qa",
  userId: "qa-user",
  type: "WATCH_TIME",
  montant: 25,
  createdAt: "2026-10-10T10:00:00.000Z",
};
const profile = {
  id: "qa-user",
  email: "qa@example.test",
  pseudo: "qa-history",
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
  await page.route("**/me/points/history**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        transactions: [transaction],
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1,
      }),
    }),
  );
  await page.route("**/me/dashboard/summary", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        profil: profile,
        visionnage: { secondesValidees: 60, sessions: 1 },
        activite: { ticketsTirage: 0, cartesAGratterDisponibles: 0 },
        transactionsRecentes: [
          {
            ...transaction,
            session: {
              platform: "TWITCH",
              streamExternalId: "qa-stream",
              dureeValideeSecondes: 60,
            },
          },
        ],
      }),
    }),
  );
  await page.addInitScript(
    (value) => localStorage.setItem("skkup-language", value),
    locale,
  );
  await page.goto("/dashboard/historique", { waitUntil: "domcontentloaded" });
}

test("valide l historique français, la sélection clavier et l export", async ({
  page,
}) => {
  await openPage(page, "fr");
  await expect(
    page.getByRole("heading", { name: "Historique des points" }),
  ).toBeVisible();
  await expect(
    page.getByRole("row", { name: /Temps de visionnage/ }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Exporter CSV" }),
  ).toBeEnabled();
  await page.getByRole("row", { name: /Temps de visionnage/ }).press("Enter");
  await expect(
    page.getByRole("heading", { name: "Temps de visionnage" }),
  ).toBeVisible();
});

test("valide les libellés anglais et les sessions contractuelles", async ({
  page,
}) => {
  await openPage(page, "en");
  await expect(
    page.getByRole("heading", { name: "Points history" }),
  ).toBeVisible();
  await expect(page.getByRole("row", { name: /Watch time/ })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Watch sessions" }),
  ).toBeVisible();
  await expect(page.getByText("qa-stream")).toBeVisible();
});

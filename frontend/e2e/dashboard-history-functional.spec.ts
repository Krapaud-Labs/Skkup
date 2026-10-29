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
  derniereVisiteAt: new Date().toISOString(),
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

test("redirige l’ancien historique vers l’activité récente en français", async ({
  page,
}) => {
  await openPage(page, "fr");
  await expect(page).toHaveURL(/\/dashboard#history$/);
  await expect(page.getByRole("heading", { name: "Ton espace de progression" })).toBeVisible();
  await expect(page.getByRole("link", { name: /historique/i })).toHaveCount(0);

  const activity = page.getByRole("list", { name: "Activité récente" });
  await expect(activity).toBeVisible();
  await expect(activity).toContainText("Temps de visionnage");
  await expect(activity).toContainText("Twitch · 1 min validées");
  await activity.focus();
  await expect(activity).toBeFocused();
});

test("redirige l’ancien historique vers l’activité récente en anglais", async ({
  page,
}) => {
  await openPage(page, "en");
  await expect(page).toHaveURL(/\/dashboard#history$/);
  await expect(page.getByRole("heading", { name: "Your progress space" })).toBeVisible();
  await expect(page.getByRole("link", { name: /history/i })).toHaveCount(0);

  const activity = page.getByRole("list", { name: "Recent activity" });
  await expect(activity).toBeVisible();
  await expect(activity).toContainText("Viewing time");
  await expect(activity).toContainText("Twitch · 1 min validated");
});

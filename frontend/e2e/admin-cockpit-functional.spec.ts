import { expect, test } from "@playwright/test";

const profile = {
  id: "qa-admin",
  email: "qa-admin@example.test",
  pseudo: "qa-admin",
  soldePoints: 250,
  streakActuel: 4,
  streakMax: 8,
  derniereVisiteAt: null,
  createdAt: "2026-01-15T10:00:00.000Z",
  role: "ADMIN",
};
const summary = {
  counts: {
    openRaffles: 1,
    totalLots: 2,
    activeAnnouncements: 1,
    openFraudFlags: 1,
    activeContents: 1,
  },
  raffles: [
    {
      id: "raffle-qa",
      titre: "Tirage QA",
      description: "Lot QA",
      dateTirage: "2026-10-20T18:00:00.000Z",
      statut: "OUVERT",
      _count: { tickets: 12 },
    },
  ],
  lots: [
    {
      id: "lot-qa",
      nom: "Carte QA",
      quantite: 1,
      valeurEstimee: "50",
      imageUrl: null,
      raffle: { titre: "Tirage QA" },
    },
  ],
  announcements: [
    {
      id: "announcement-qa",
      titre: "Annonce QA",
      contenu: "Contenu QA",
      publie: true,
      createdAt: "2026-10-10T10:00:00.000Z",
    },
  ],
  fraudFlags: [
    {
      id: "flag-qa",
      type: "SIGNAL",
      createdAt: "2026-10-10T10:00:00.000Z",
      user: { pseudo: "qa-user" },
    },
  ],
  contents: [
    { id: "content-qa", cle: "LEGAL", titre: "Règlement", statut: "PUBLIE" },
  ],
  recentActivity: [
    {
      id: "audit-qa",
      action: "CREATE",
      createdAt: "2026-10-10T10:00:00.000Z",
      actor: { pseudo: "qa-admin" },
      entityType: "RAFFLE",
      entityId: "raffle-qa",
    },
  ],
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
  await page.route("**/admin/dashboard/summary", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(summary),
    }),
  );
  await page.addInitScript(
    (value) => localStorage.setItem("skkup-language", value),
    locale,
  );
  await page.goto("/admin", { waitUntil: "domcontentloaded" });
}

test("valide le cockpit admin français, les tableaux et la navigation", async ({
  page,
}) => {
  await openPage(page, "fr");
  await expect(
    page.getByRole("heading", { name: "Administration Skkup" }),
  ).toBeVisible();
  await expect(page.getByRole("table").first()).toBeVisible();
  await expect(page.getByText("Tirage QA").first()).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Voir tous les tirages" }),
  ).toHaveAttribute("href", "/admin/raffles");
});

test("valide le cockpit admin anglais et le format de date", async ({
  page,
}) => {
  await openPage(page, "en");
  await expect(
    page.getByRole("heading", { name: "Skkup administration" }),
  ).toBeVisible();
  await expect(page.getByText("View all draws").first()).toBeVisible();
  await expect(page.getByText("10/20/26").first()).toBeAttached();
});

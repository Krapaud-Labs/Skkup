import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  list: vi.fn(),
  update: vi.fn(),
  language: { value: "fr" as "fr" | "en" },
  ApiError: class extends Error {
    statut: number;
    constructor(message: string, statut: number) {
      super(message);
      this.statut = statut;
    }
  },
}));
vi.mock("@/lib/admin", () => ({
  listerUtilisateursAdmin: mocks.list,
  modifierStatutUtilisateurAdmin: mocks.update,
}));
vi.mock("@/lib/api", () => ({ ErreurApi: mocks.ApiError }));
vi.mock("@/components/i18n/LanguageProvider", () => ({
  useLanguage: () => ({ langue: mocks.language.value }),
  traductions: { fr: { logout: "Déconnexion" }, en: { logout: "Log out" } },
}));
vi.mock("next/navigation", () => ({
  usePathname: () => "/admin/users",
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

import { UsersAdminV3 } from "./UsersAdminV3";

const user = {
  id: "user-1",
  pseudo: "Alice",
  email: "alice@example.com",
  role: "USER",
  actif: true,
  soldePoints: 42,
  createdAt: "2026-10-01T08:00:00.000Z",
  _count: { watchSessions: 3, raffleTickets: 2 },
};
beforeEach(() => {
  vi.clearAllMocks();
  mocks.language.value = "fr";
  mocks.list.mockResolvedValue([user]);
  mocks.update.mockResolvedValue({ ...user, actif: false });
  window.confirm = vi.fn(() => true);
});

test("localise la recherche, les filtres et le détail en anglais", async () => {
  const utilisateur = userEvent.setup();
  mocks.language.value = "en";
  render(<UsersAdminV3 />);
  expect(
    await screen.findByRole("heading", { name: "Users and security" }),
  ).toBeTruthy();
  expect(screen.getByRole("textbox", { name: "Search a user" })).toBeTruthy();
  expect(screen.getByRole("combobox", { name: "Role" })).toBeTruthy();
  expect(screen.getByText("100% of result")).toBeTruthy();
  await utilisateur.click(screen.getByRole("button", { name: /Alice/ }));
  expect(
    screen.getByRole("complementary", { name: "User detail" }),
  ).toBeTruthy();
  for (const label of ["Role", "Status", "Watch sessions", "Entries"])
    expect(screen.getAllByText(label).length).toBeGreaterThan(0);
  expect(screen.getAllByText("Member").length).toBeGreaterThan(0);
  expect(screen.getAllByText("Registered on").length).toBeGreaterThan(0);
  const registrationLabel = screen.getByText("Registered on");
  expect(
    registrationLabel.parentElement?.querySelector("dd")?.textContent,
  ).not.toContain("Registered on");
  expect(screen.queryByRole("tab", { name: "Activity" })).toBeNull();
  expect(
    screen.getByRole("tab", { name: "Overview" }).getAttribute("aria-controls"),
  ).toBe("user-detail-panel");
});

test("affiche une erreur 403 lors de la mutation du statut", async () => {
  const utilisateur = userEvent.setup();
  mocks.update.mockRejectedValueOnce(new mocks.ApiError("forbidden", 403));
  render(<UsersAdminV3 />);
  await utilisateur.click(
    await screen.findByRole("button", { name: "Désactiver" }),
  );
  expect((await screen.findByRole("alert")).textContent).toContain(
    "réservée aux administrateurs",
  );
});

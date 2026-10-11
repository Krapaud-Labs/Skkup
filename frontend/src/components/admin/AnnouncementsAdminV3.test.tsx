import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, test, vi } from "vitest";

const {
  archiverAnnonce,
  creerAnnonce,
  historiqueAnnonce,
  listerAnnonces,
  modifierAnnonce,
} = vi.hoisted(() => ({
  archiverAnnonce: vi.fn(),
  creerAnnonce: vi.fn(),
  historiqueAnnonce: vi.fn(),
  listerAnnonces: vi.fn(),
  modifierAnnonce: vi.fn(),
}));
const language = vi.hoisted(() => ({ value: "fr" as "fr" | "en" }));
const apiError = vi.hoisted(() => class extends Error { statut: number; constructor(message: string, statut: number) { super(message); this.statut = statut; } });

vi.mock("@/lib/admin", () => ({
  archiverAnnonce,
  creerAnnonce,
  historiqueAnnonce,
  listerAnnonces,
  modifierAnnonce,
}));
vi.mock("next/navigation", () => ({
  usePathname: () => "/admin/announcements",
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));
vi.mock("@/components/i18n/LanguageProvider", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/components/i18n/LanguageProvider")>()),
  useLanguage: () => ({ langue: language.value, definirLangue: vi.fn() }),
}));
vi.mock("@/lib/api", () => ({ ErreurApi: apiError }));

import { AnnouncementsAdminV3 } from "./AnnouncementsAdminV3";

const announcement = {
  id: "announcement-1",
  titre: "Maintenance planifiée",
  texte: "Le service sera indisponible quelques minutes.",
  actif: true,
  debutAt: "2026-10-01T08:00:00.000Z",
  finAt: "2026-10-01T10:00:00.000Z",
  createdAt: "2026-09-30T12:00:00.000Z",
};

beforeEach(() => {
  vi.clearAllMocks();
  language.value = "fr";
  listerAnnonces.mockResolvedValue([announcement]);
  historiqueAnnonce.mockResolvedValue([]);
  modifierAnnonce.mockResolvedValue(announcement);
  archiverAnnonce.mockResolvedValue({ ...announcement, actif: false });
});

test("affiche les seules métadonnées contractuelles de l’annonce sans colonnes fictives", async () => {
  render(<AnnouncementsAdminV3 />);

  expect((await screen.findAllByText("Maintenance planifiée")).length).toBeGreaterThanOrEqual(1);
  expect(screen.getByText(/01\/10\/2026.*01\/10\/2026/)).toBeTruthy();
  expect(screen.getAllByText(/30\/09\/2026/).length).toBeGreaterThanOrEqual(1);
  expect(screen.queryByText("Version")).toBeNull();
  expect(screen.queryByText("Auteur")).toBeNull();
  expect(
    screen.getByRole("button", {
      name: "Ouvrir l’annonce Maintenance planifiée",
    }),
  ).toBeTruthy();
});

test("conserve la sélection et les actions réelles depuis une carte responsive", async () => {
  const user = userEvent.setup();
  render(<AnnouncementsAdminV3 />);

  await user.click(
    await screen.findByRole("button", {
      name: "Ouvrir l’annonce Maintenance planifiée",
    }),
  );

  await waitFor(() =>
    expect(historiqueAnnonce).toHaveBeenCalledWith("announcement-1"),
  );
  expect(
    screen.getByRole("heading", { name: "Modifier l’annonce" }),
  ).toBeTruthy();
  expect(screen.getByRole("button", { name: "Archiver" })).toBeTruthy();
  expect(screen.getByDisplayValue("Maintenance planifiée")).toBeTruthy();
});

test("filtre les annonces expirées avec le statut contractuel dérivé", async () => {
  const user = userEvent.setup();
  render(<AnnouncementsAdminV3 />);

  const expiredTab = await screen.findByRole("tab", { name: "Expirées · 1" });
  await user.click(expiredTab);

  expect(expiredTab.getAttribute("aria-selected")).toBe("true");
  expect(screen.getByRole("button", { name: "Ouvrir l’annonce Maintenance planifiée" })).toBeTruthy();
  expect(screen.getByText("Expirée")).toBeTruthy();
});

test("localise le cockpit en anglais et conserve les dates contractuelles", async () => {
  language.value = "en";
  render(<AnnouncementsAdminV3 />);

  expect(await screen.findByRole("heading", { name: "Announcements and content" })).toBeTruthy();
  expect(screen.getByRole("textbox", { name: "Search announcements" })).toBeTruthy();
  expect(screen.getByText(/10\/1\/26/)).toBeTruthy();
  expect(screen.getByText("Published")).toBeTruthy();
});

test("expose une erreur d’autorisation explicite lors de l’enregistrement", async () => {
  const user = userEvent.setup();
  modifierAnnonce.mockRejectedValueOnce(new apiError("forbidden", 403));
  render(<AnnouncementsAdminV3 />);

  await user.click(await screen.findByRole("button", { name: "Ouvrir l’annonce Maintenance planifiée" }));
  await user.click(screen.getByRole("button", { name: "Enregistrer les modifications" }));

  expect((await screen.findByRole("alert")).textContent).toContain("réservée aux comptes administrateurs");
});

test("affiche l’état vide du filtre des annonces expirées", async () => {
  const user = userEvent.setup();
  listerAnnonces.mockResolvedValueOnce([{
    ...announcement,
    debutAt: "2026-12-01T08:00:00.000Z",
    finAt: "2026-12-01T10:00:00.000Z",
  }]);

  render(<AnnouncementsAdminV3 />);

  const expiredTab = await screen.findByRole("tab", { name: "Expirées · 0" });
  await user.click(expiredTab);

  expect(expiredTab.getAttribute("aria-selected")).toBe("true");
  expect(await screen.findByText("Aucune annonce renvoyée par le contrat.")).toBeTruthy();
});

test("réinitialise l’éditeur pour créer une annonce sans débordement de formulaire", async () => {
  const user = userEvent.setup();
  render(<AnnouncementsAdminV3 />);

  await user.click(screen.getByRole("button", { name: "＋ Nouvelle annonce" }));

  expect(
    screen.getByRole("heading", { name: "Créer une annonce" }),
  ).toBeTruthy();
  expect((screen.getByLabelText("Titre") as HTMLInputElement).value).toBe("");
  expect((screen.getByLabelText("Message") as HTMLTextAreaElement).value).toBe(
    "",
  );
  expect(screen.getByRole("button", { name: "Créer l’annonce" })).toBeTruthy();
});

test("permet de reprendre après une erreur de chargement", async () => {
  const user = userEvent.setup();
  listerAnnonces
    .mockRejectedValueOnce(new Error("service indisponible"))
    .mockResolvedValueOnce([announcement]);

  render(<AnnouncementsAdminV3 />);

  expect((await screen.findByRole("alert")).textContent).toContain("Impossible de charger les annonces.");
  await user.click(screen.getByRole("button", { name: "Réessayer" }));

  expect(await screen.findByRole("button", { name: "Ouvrir l’annonce Maintenance planifiée" })).toBeTruthy();
  expect(screen.queryByText("Impossible de charger les annonces.")).toBeNull();
  expect(listerAnnonces).toHaveBeenCalledTimes(2);
});

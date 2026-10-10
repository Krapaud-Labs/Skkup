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
  expect(screen.getByText("EXPIRÉE")).toBeTruthy();
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

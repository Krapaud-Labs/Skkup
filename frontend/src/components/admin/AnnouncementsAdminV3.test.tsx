import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, test, vi } from "vitest";
import type { EvenementAnnonceAdmin } from "@/lib/admin";
import { imagesForSource } from "@/test-utils/next-image";

const {
  archiverAnnonce,
  creerAnnonce,
  historiqueAnnonce,
  listerAnnonces,
  modifierAnnonce,
  publierAnnonce,
  restaurerAnnonce,
} = vi.hoisted(() => ({
  archiverAnnonce: vi.fn(),
  creerAnnonce: vi.fn(),
  historiqueAnnonce: vi.fn(),
  listerAnnonces: vi.fn(),
  modifierAnnonce: vi.fn(),
  publierAnnonce: vi.fn(),
  restaurerAnnonce: vi.fn(),
}));
const language = vi.hoisted(() => ({ value: "fr" as "fr" | "en" }));
const apiError = vi.hoisted(
  () =>
    class extends Error {
      statut: number;
      constructor(message: string, statut: number) {
        super(message);
        this.statut = statut;
      }
    },
);

vi.mock("@/lib/admin", () => ({
  archiverAnnonce,
  creerAnnonce,
  historiqueAnnonce,
  listerAnnonces,
  modifierAnnonce,
  publierAnnonce,
  restaurerAnnonce,
}));
vi.mock("next/navigation", () => ({
  usePathname: () => "/admin/announcements",
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));
vi.mock("@/components/i18n/LanguageProvider", async (importOriginal) => ({
  ...(await importOriginal<
    typeof import("@/components/i18n/LanguageProvider")
  >()),
  useLanguage: () => ({ langue: language.value, definirLangue: vi.fn() }),
}));
vi.mock("@/lib/api", () => ({ ErreurApi: apiError }));

import { AnnouncementsAdminV3 } from "./AnnouncementsAdminV3";

const announcement = {
  id: "announcement-1",
  titre: "Maintenance planifiée",
  texte: "Le service sera indisponible quelques minutes.",
  status: "PUBLISHED" as const,
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
  publierAnnonce.mockResolvedValue({ ...announcement, status: "PUBLISHED", actif: true });
  archiverAnnonce.mockResolvedValue({ ...announcement, status: "ARCHIVED", actif: false });
  restaurerAnnonce.mockResolvedValue({ ...announcement, status: "DRAFT", actif: false });
});

test("affiche les seules métadonnées contractuelles de l’annonce sans colonnes fictives", async () => {
  const { container } = render(<AnnouncementsAdminV3 />);

  expect(
    (await screen.findAllByText("Maintenance planifiée")).length,
  ).toBeGreaterThanOrEqual(1);
  expect(screen.getByText(/01\/10\/2026.*01\/10\/2026/)).toBeTruthy();
  expect(screen.getAllByText(/30\/09\/2026/).length).toBeGreaterThanOrEqual(1);
  expect(screen.queryByText("Version")).toBeNull();
  expect(screen.queryByText("Auteur")).toBeNull();
  expect(
    screen.getByRole("button", {
      name: "Ouvrir l’annonce Maintenance planifiée",
    }),
  ).toBeTruthy();
  expect(imagesForSource(container, "/assets/icons/ui/arrow.png")).not.toHaveLength(0);
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
  expect(
    screen.getByRole("button", {
      name: "Ouvrir l’annonce Maintenance planifiée",
    }),
  ).toBeTruthy();
  expect(screen.getByText("Expirée")).toBeTruthy();
});

test("localise le cockpit en anglais et conserve les dates contractuelles", async () => {
  language.value = "en";
  render(<AnnouncementsAdminV3 />);

  expect(
    await screen.findByRole("heading", { name: "Announcements and content" }),
  ).toBeTruthy();
  expect(
    screen.getByRole("textbox", { name: "Search announcements" }),
  ).toBeTruthy();
  expect(screen.getByText(/10\/1\/26/)).toBeTruthy();
  expect(screen.getByText("Published")).toBeTruthy();
});

test("relie les onglets aux panneaux par des identifiants ARIA stables", async () => {
  const user = userEvent.setup();
  render(<AnnouncementsAdminV3 />);

  const allTab = await screen.findByRole("tab", { name: "Toutes · 1" });
  const listPanel = screen.getByRole("tabpanel", { name: "Toutes · 1" });
  expect(allTab.id).toBe("announcements-tab-all");
  expect(allTab.getAttribute("aria-controls")).toBe("announcements-list-panel");
  expect(listPanel.getAttribute("aria-labelledby")).toBe(allTab.id);

  const editorTab = screen.getByRole("tab", { name: "Édition" });
  const editorPanel = screen.getByRole("tabpanel", { name: "Édition" });
  expect(editorTab.id).toBe("announcement-tab-edition");
  expect(editorPanel.getAttribute("aria-labelledby")).toBe(editorTab.id);

  await user.click(screen.getByRole("tab", { name: "Expirées · 1" }));
  expect(screen.getByRole("tabpanel", { name: "Expirées · 1" }).getAttribute("aria-labelledby")).toBe("announcements-tab-expired");
  await user.click(screen.getByRole("tab", { name: "Révisions (0)" }));
  expect(screen.getByRole("tabpanel", { name: "Révisions (0)" }).getAttribute("aria-labelledby")).toBe("announcement-tab-revisions");
});

test("expose une erreur d’autorisation explicite lors de l’enregistrement", async () => {
  const user = userEvent.setup();
  modifierAnnonce.mockRejectedValueOnce(new apiError("forbidden", 403));
  render(<AnnouncementsAdminV3 />);

  await user.click(
    await screen.findByRole("button", {
      name: "Ouvrir l’annonce Maintenance planifiée",
    }),
  );
  await user.click(
    screen.getByRole("button", { name: "Enregistrer les modifications" }),
  );

  expect((await screen.findByRole("alert")).textContent).toContain(
    "réservée aux comptes administrateurs",
  );
});

test("affiche l’état vide du filtre des annonces expirées", async () => {
  const user = userEvent.setup();
  listerAnnonces.mockResolvedValueOnce([
    {
      ...announcement,
      debutAt: "2026-12-01T08:00:00.000Z",
      finAt: "2026-12-01T10:00:00.000Z",
    },
  ]);

  render(<AnnouncementsAdminV3 />);

  const expiredTab = await screen.findByRole("tab", { name: "Expirées · 0" });
  await user.click(expiredTab);

  expect(expiredTab.getAttribute("aria-selected")).toBe("true");
  expect(
    await screen.findByText("Aucune annonce renvoyée par le contrat."),
  ).toBeTruthy();
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

  expect((await screen.findByRole("alert")).textContent).toContain(
    "Impossible de charger les annonces.",
  );
  expect(
    screen.queryByText("Aucune annonce renvoyée par le contrat."),
  ).toBeNull();
  await user.click(screen.getByRole("button", { name: "Réessayer" }));

  expect(
    await screen.findByRole("button", {
      name: "Ouvrir l’annonce Maintenance planifiée",
    }),
  ).toBeTruthy();
  expect(screen.queryByText("Impossible de charger les annonces.")).toBeNull();
  expect(listerAnnonces).toHaveBeenCalledTimes(2);
});
test("crée une annonce en brouillon puis la publie par action explicite", async () => {
  const user = userEvent.setup();
  const draft = { ...announcement, status: "DRAFT" as const, actif: false };
  listerAnnonces.mockResolvedValueOnce([]);
  render(<AnnouncementsAdminV3 />);
  await user.click(await screen.findByRole("button", { name: "＋ Nouvelle annonce" }));
  await user.type(screen.getByLabelText("Titre"), "Nouvelle règle");
  await user.type(screen.getByLabelText("Message"), "Le texte de la règle.");
  creerAnnonce.mockResolvedValueOnce(draft);
  await user.click(screen.getByRole("button", { name: "Créer l’annonce" }));
  expect((await screen.findAllByText("Brouillon")).length).toBeGreaterThan(0);
  expect(creerAnnonce).toHaveBeenCalledWith("Nouvelle règle", "Le texte de la règle.", {});
  expect(screen.getByRole("button", { name: "Publier" })).toBeTruthy();
  publierAnnonce.mockResolvedValueOnce({ ...draft, status: "PUBLISHED", actif: true });
  await user.click(screen.getByRole("button", { name: "Publier" }));
  await waitFor(() => expect(publierAnnonce).toHaveBeenCalledWith(draft.id));
  expect(await screen.findByText("Annonce publiée.")).toBeTruthy();
});

test("restaure une annonce archivée avec son événement d’archive", async () => {
  const user = userEvent.setup();
  const archived = { ...announcement, status: "ARCHIVED" as const, actif: false };
  listerAnnonces.mockResolvedValueOnce([archived]);
  historiqueAnnonce.mockResolvedValue([{ id: "archive-event-1", action: "ANNOUNCEMENT_ARCHIVED", metadata: {}, actorId: "admin", createdAt: "2026-10-01T10:00:00.000Z" }]);
  render(<AnnouncementsAdminV3 />);
  await user.click(await screen.findByRole("button", { name: "Ouvrir l’annonce Maintenance planifiée" }));
  await user.click(await screen.findByRole("button", { name: "Restaurer" }));
  await waitFor(() => expect(restaurerAnnonce).toHaveBeenCalledWith(archived.id, "archive-event-1"));
});

test("archive une annonce publiée par l’action dédiée", async () => {
  const user = userEvent.setup();
  render(<AnnouncementsAdminV3 />);
  await user.click(await screen.findByRole("button", { name: "Ouvrir l’annonce Maintenance planifiée" }));
  await user.click(screen.getByRole("button", { name: "Archiver" }));
  await waitFor(() => expect(archiverAnnonce).toHaveBeenCalledWith(announcement.id));
  expect(await screen.findByText("Annonce archivée.")).toBeTruthy();
});

test("rafraîchit les événements entre archive, restauration puis nouvel archivage", async () => {
  const user = userEvent.setup();
  const archiveEvents: EvenementAnnonceAdmin[] = [];
  let archiveNumber = 0;
  historiqueAnnonce.mockImplementation(async () => archiveEvents);
  archiverAnnonce.mockImplementation(async () => {
    archiveNumber += 1;
    const event: EvenementAnnonceAdmin = {
      id: `archive-event-${archiveNumber}`,
      action: "ANNOUNCEMENT_ARCHIVED",
      metadata: { previous: { status: "PUBLISHED" } },
      actorId: "admin",
      createdAt: `2026-10-01T10:0${archiveNumber}:00.000Z`,
    };
    archiveEvents.unshift(event);
    return { ...announcement, status: "ARCHIVED", actif: false };
  });
  restaurerAnnonce.mockImplementation(async (_announcementId, eventId) => {
    archiveEvents.unshift({
      id: `restore-event-${eventId}`,
      action: "ANNOUNCEMENT_RESTORED",
      metadata: { sourceEventId: eventId },
      actorId: "admin",
      createdAt: "2026-10-01T11:00:00.000Z",
    });
    return { ...announcement, status: "PUBLISHED", actif: true };
  });
  render(<AnnouncementsAdminV3 />);
  await user.click(await screen.findByRole("button", { name: "Ouvrir l’annonce Maintenance planifiée" }));

  await user.click(screen.getByRole("button", { name: "Archiver" }));
  await user.click(await screen.findByRole("button", { name: "Restaurer" }));
  await waitFor(() => expect(restaurerAnnonce).toHaveBeenNthCalledWith(1, announcement.id, "archive-event-1"));

  await user.click(await screen.findByRole("button", { name: "Archiver" }));
  await user.click(await screen.findByRole("button", { name: "Restaurer" }));
  await waitFor(() => expect(restaurerAnnonce).toHaveBeenNthCalledWith(2, announcement.id, "archive-event-2"));
});

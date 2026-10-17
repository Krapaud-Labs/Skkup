import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { priorities } from "./priorities";

const remplacer = vi.fn();
const recupererProfil = vi.fn();
const recupererResumeDashboardAdmin = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: remplacer }), usePathname: () => "/admin" }));
vi.mock("@/lib/dashboard", () => ({ recupererProfil }));
vi.mock("@/lib/admin", () => ({ recupererResumeDashboardAdmin }));
vi.mock("@/components/admin/NavigationAdmin", () => ({ NavigationAdmin: () => <nav aria-label="Navigation administration" /> }));

const { default: PageAdministration } = await import("./page");
const resume = { counts: { users: 12, activeUsers: 9, openRaffles: 2, availableLots: 48, publishedContent: 4, activeAnnouncements: 1, openFraudFlags: 3, activeStreams: 5 }, recentActivity: [{ id: "a1", action: "PUBLISH", entityType: "CONTENT", entityId: "faq", createdAt: "2026-10-03T10:00:00Z", actor: { id: "u1", pseudo: "Ada" } }], raffles: [{ id: "r1", titre: "Tirage test", description: "Description contractuelle", dateTirage: "2026-10-10T10:00:00Z", statut: "OUVERT", _count: { tickets: 4 } }], lots: [], announcements: [{ id: "a2", titre: "Annonce test", texte: "Texte contractuel", actif: true, debutAt: null, finAt: null }], fraudFlags: [], contents: [] };

beforeEach(() => { vi.clearAllMocks(); recupererProfil.mockResolvedValue({ pseudo: "Ada", role: "ADMIN" }); recupererResumeDashboardAdmin.mockResolvedValue(resume); });

describe("PageAdministration", () => {
  test("expose le KPI des membres avec une clé numérique du résumé", () => {
    const usersKpi = priorities.find((priority) => priority.key === "users");
    expect(usersKpi?.href).toBe("/admin/users");
    expect(usersKpi?.totalKey).toBe("users");
  });

  test("consomme le résumé et rend le cockpit V3 sans ancien formulaire monolithique", async () => {
    render(<PageAdministration />);
    expect(await screen.findByRole("heading", { name: "Administration Skkup" })).toBeTruthy();
    await waitFor(() => expect(recupererResumeDashboardAdmin).toHaveBeenCalledTimes(1));
    expect(screen.getByRole("heading", { name: "Tirages à piloter" })).toBeTruthy();
    expect(screen.getByRole("link", { name: /Membres inscrits/ }).getAttribute("href")).toBe("/admin/users");
    expect(screen.getAllByRole("link", { name: /Signalements à traiter/ }).every((link) => link.getAttribute("href") === "/admin/moderation")).toBe(true);
    expect(screen.queryByRole("heading", { name: "Nouveau sponsor" })).toBeNull();
    expect(screen.getByText("PUBLISH")).toBeTruthy();
    expect(screen.getByText(/Ada ·/)).toBeTruthy();
    expect(screen.getByText("Description contractuelle")).toBeTruthy();
    expect(screen.getByText("Texte contractuel")).toBeTruthy();
  });
  test("affiche un état vide contextualisé", async () => {
    recupererResumeDashboardAdmin.mockResolvedValue({ counts: { users: 0, activeUsers: 0, openRaffles: 0, availableLots: 0, publishedContent: 0, activeAnnouncements: 0, openFraudFlags: 0, activeStreams: 0 }, recentActivity: [], raffles: [], lots: [], announcements: [], fraudFlags: [], contents: [] });
    render(<PageAdministration />);
    expect(await screen.findByText("Aucune activité récente à afficher.")).toBeTruthy();
  });
  test("affiche un chargement puis une erreur récupérable", async () => {
    let reject!: (reason: Error) => void;
    recupererResumeDashboardAdmin.mockReturnValue(new Promise((_, fail) => { reject = fail; }));
    render(<PageAdministration />);
    await waitFor(() => expect(recupererResumeDashboardAdmin).toHaveBeenCalledTimes(1));
    expect(screen.getByText("Chargement du cockpit…")).toBeTruthy();
    reject(new Error("API indisponible"));
    await waitFor(() =>
      expect(screen.getByRole("alert").textContent).toContain(
        "Impossible de charger le cockpit administrateur.",
      ),
    );
    expect(screen.getByRole("button", { name: "Réessayer" })).toBeTruthy();
  });
});

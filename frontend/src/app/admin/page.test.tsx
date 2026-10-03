import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";

const remplacer = vi.fn();
const recupererProfil = vi.fn();
const recupererResumeDashboardAdmin = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: remplacer }), usePathname: () => "/admin" }));
vi.mock("@/lib/dashboard", () => ({ recupererProfil }));
vi.mock("@/lib/admin", () => ({ recupererResumeDashboardAdmin }));
vi.mock("@/components/admin/NavigationAdmin", () => ({ NavigationAdmin: () => <nav aria-label="Navigation administration" /> }));

const { default: PageAdministration } = await import("./page");
const resume = { counts: { users: 12, activeUsers: 9, openRaffles: 2, publishedContent: 4, activeAnnouncements: 1, openFraudFlags: 3, activeStreams: 5 }, recentActivity: [{ id: "a1", action: "PUBLISH", entityType: "CONTENT", entityId: "faq", createdAt: "2026-10-03T10:00:00Z", actor: { id: "u1", pseudo: "Ada" } }] };

beforeEach(() => { vi.clearAllMocks(); recupererProfil.mockResolvedValue({ pseudo: "Ada", role: "ADMIN" }); recupererResumeDashboardAdmin.mockResolvedValue(resume); });

describe("PageAdministration", () => {
  test("consomme le résumé et rend le cockpit V3 sans ancien formulaire monolithique", async () => {
    render(<PageAdministration />);
    expect(await screen.findByRole("heading", { name: "Le cockpit opérationnel" })).toBeTruthy();
    await waitFor(() => expect(recupererResumeDashboardAdmin).toHaveBeenCalledTimes(1));
    expect(screen.getByText("9")).toBeTruthy();
    expect(screen.getByRole("link", { name: /Examiner les signalements/ }).getAttribute("href")).toBe("/admin/moderation");
    expect(screen.queryByRole("heading", { name: "Nouveau sponsor" })).toBeNull();
    expect(screen.getByText(/Ada · faq/)).toBeTruthy();
  });
  test("affiche un état vide contextualisé", async () => {
    recupererResumeDashboardAdmin.mockResolvedValue({ counts: { users: 0, activeUsers: 0, openRaffles: 0, publishedContent: 0, activeAnnouncements: 0, openFraudFlags: 0, activeStreams: 0 }, recentActivity: [] });
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
  test("redirige un viewer avant d'appeler le résumé admin", async () => {
    recupererProfil.mockResolvedValue({ pseudo: "Viewer", role: "VIEWER" });
    render(<PageAdministration />);
    await waitFor(() => expect(remplacer).toHaveBeenCalledWith("/dashboard"));
    expect(recupererResumeDashboardAdmin).not.toHaveBeenCalled();
  });
});

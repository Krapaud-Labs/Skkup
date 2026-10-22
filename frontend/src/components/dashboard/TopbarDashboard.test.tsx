import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { PropsWithChildren } from "react";
import { beforeEach, expect, test, vi } from "vitest";
import { TopbarDashboard } from "./TopbarDashboard";

const recupererAnnoncesViewer = vi.fn();
vi.mock("@/lib/dashboard", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/dashboard")>()),
  recupererAnnoncesViewer: (...args: unknown[]) => recupererAnnoncesViewer(...args),
}));

vi.mock("@/lib/temps-reel", () => ({
  connecterTempsReel: () => ({ on: vi.fn(), disconnect: vi.fn() }),
  EVENEMENT_APPARIEMENTS_MIS_A_JOUR: "extension:pairings-updated",
  EVENEMENT_CARTE_DEBLOQUEE: "scratch-card:unlocked",
  EVENEMENT_POINTS_MIS_A_JOUR: "points:updated",
  EVENEMENT_STREAK_MIS_A_JOUR: "streak:updated",
}));

vi.mock("next/link", () => ({ default: ({ children, ...props }: PropsWithChildren<{ href: string }>) => <a {...props} href={props.href}>{children}</a> }));

vi.mock("@/components/dashboard/MenuCompteDashboard", () => ({
  MenuCompteDashboard: ({ profil }: { profil: { pseudo: string } | null }) => (
    <button type="button" aria-label={profil ? `Ouvrir le menu de ${profil.pseudo}` : "Ouvrir le menu du compte"}>Compte</button>
  ),
}));

const profil = {
  id: "user-1",
  email: "ada@example.com",
  pseudo: "Ada",
  soldePoints: 120,
  streakActuel: 3,
  streakMax: 7,
  derniereVisiteAt: null,
  createdAt: "2026-01-01T00:00:00.000Z",
  role: "VIEWER" as const,
};

beforeEach(() => recupererAnnoncesViewer.mockReset());

test("ne répète pas le logo S et conserve le pseudo uniquement dans le menu du compte", () => {
  render(<TopbarDashboard profil={profil} />);

  expect(screen.queryByRole("link", { name: "Skkup" })).toBeNull();
  expect(screen.queryByRole("img", { name: "Skkup" })).toBeNull();
  expect(screen.queryByText("Ada")).toBeNull();
  expect(screen.getByRole("button", { name: "Ouvrir le menu de Ada" })).not.toBeNull();
});

test("conserve le solde dans son contrôle dédié", () => {
  render(<TopbarDashboard profil={profil} />);

  expect(screen.getByRole("link", { name: "Solde Skkup : 120 points" }).textContent).toContain("120");
  expect(screen.getByRole("link", { name: "Solde Skkup : 120 points" }).querySelector("img")?.getAttribute("src")).toContain("skkup-icon-points.png");
});

test("charge les annonces à chaque ouverture sans supprimer les notifications temps réel", async () => {
  recupererAnnoncesViewer.mockResolvedValue([{ id: "announcement-1", titre: "Maintenance", texte: "Retour à 18 h" }]);
  render(<TopbarDashboard profil={profil} />);
  const notifications = screen.getByRole("button", { name: "Notifications" });
  fireEvent.click(notifications);
  expect(screen.getByRole("status").textContent).toContain("Chargement");
  expect(await screen.findByRole("button", { name: "Maintenance" })).not.toBeNull();
  fireEvent.click(notifications);
  fireEvent.click(notifications);
  await waitFor(() => expect(recupererAnnoncesViewer).toHaveBeenCalledTimes(2));
  expect(screen.queryByRole("button", { name: /non lue/ })).toBeNull();
});

test("le dialogue annonce applique le focus initial, Tab et Shift+Tab", async () => {
  recupererAnnoncesViewer.mockResolvedValue([{ id: "announcement-1", titre: "Mise à jour", texte: "Détails" }]);
  render(<TopbarDashboard profil={profil} />);
  fireEvent.click(screen.getByRole("button", { name: "Notifications" }));
  fireEvent.click(await screen.findByRole("button", { name: "Mise à jour" }));
  const dialog = screen.getByRole("dialog", { name: "Mise à jour" });
  const closeButton = screen.getByRole("button", { name: "Fermer l’annonce" });
  expect(document.activeElement).toBe(dialog);
  closeButton.focus();
  const forward = new KeyboardEvent("keydown", { key: "Tab", bubbles: true, cancelable: true });
  document.dispatchEvent(forward);
  expect(forward.defaultPrevented).toBe(true);
  expect(document.activeElement).toBe(closeButton);
  const backward = new KeyboardEvent("keydown", { key: "Tab", shiftKey: true, bubbles: true, cancelable: true });
  document.dispatchEvent(backward);
  expect(backward.defaultPrevented).toBe(true);
  expect(document.activeElement).toBe(closeButton);
});

test("la cible CSS conserve une fermeture de modal de 44×44 CSS px", () => {
  const css = readFileSync(resolve(process.cwd(), "src/app/globals.css"), "utf8");
  const rule = css.match(/\.skuup-viewer-announcement-close\s*\{([^}]+)\}/)?.[1] ?? "";
  expect(rule).toMatch(/width\s*:\s*44px/);
  expect(rule).toMatch(/height\s*:\s*44px/);
});

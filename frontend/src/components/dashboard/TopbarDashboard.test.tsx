import { render, screen } from "@testing-library/react";
import type { PropsWithChildren } from "react";
import { expect, test, vi } from "vitest";
import { TopbarDashboard } from "./TopbarDashboard";

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
  expect(screen.getByRole("link", { name: "Solde Skkup : 120 points" }).querySelector("img")?.getAttribute("src")).toContain("coin-points-transparent.png");
});

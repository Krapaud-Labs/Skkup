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

test("affiche le logo S et conserve le pseudo uniquement dans le menu du compte", () => {
  render(<TopbarDashboard profil={profil} />);

  expect(screen.getByRole("link", { name: "Skkup" }).getAttribute("href")).toBe("/");
  expect(decodeURIComponent(screen.getByRole("img", { name: "Skkup" }).getAttribute("src") ?? "")).toContain("/branding/skkup-s-source.png");
  expect(screen.queryByText("Ada")).toBeNull();
  expect(screen.getByRole("button", { name: "Ouvrir le menu de Ada" })).not.toBeNull();
});

test("conserve la pièce dans le contrôle du solde, distincte du logo", () => {
  render(<TopbarDashboard profil={profil} />);

  expect(screen.getByRole("link", { name: "Solde Skkup : 120 points" }).textContent).toContain("120");
  expect(screen.getByRole("link", { name: "Skkup" }).textContent).not.toContain("120");
});

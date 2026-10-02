import { render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";

vi.mock("next/navigation", () => ({ usePathname: () => "/admin" }));

import { NavigationAdmin } from "./NavigationAdmin";

test("expose uniquement les parcours de l’espace administrateur", () => {
  render(<NavigationAdmin profil={{ id: "admin-1", email: "admin@example.com", pseudo: "Admin", role: "ADMIN", soldePoints: 0, streakActuel: 0, streakMax: 0, derniereVisiteAt: null, createdAt: "2026-01-01T00:00:00.000Z" }} />);

  expect(screen.getByRole("link", { name: /Contenus/ }).getAttribute("href")).toBe("/admin#content");
  expect(screen.getByRole("link", { name: /Annonces/ }).getAttribute("href")).toBe("/admin#announcements");
  expect(screen.getByRole("link", { name: /Tirages/ }).getAttribute("href")).toBe("/admin#raffles");
  expect(screen.getByRole("link", { name: /Pilotage du service/ }).getAttribute("href")).toBe("/admin");
  expect(screen.getByRole("link", { name: /Espace viewer/ }).getAttribute("href")).toBe("/dashboard");
});

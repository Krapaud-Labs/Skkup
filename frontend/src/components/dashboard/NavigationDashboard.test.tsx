import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import { NavigationDashboard } from "./NavigationDashboard";

const profil = {
  id: "user-1",
  email: "viewer@example.com",
  pseudo: "Viewer",
  soldePoints: 0,
  streakActuel: 0,
  streakMax: 0,
  derniereVisiteAt: null,
  createdAt: "2026-01-01T00:00:00.000Z",
};

test("regroupe les parcours internes dans le Dashboard", () => {
  render(<NavigationDashboard profil={profil} />);

  expect(screen.getByRole("link", { name: /Regarder des streams/ }).getAttribute("href")).toBe("/streams");
  expect(screen.getByRole("link", { name: /Voir les tirages/ }).getAttribute("href")).toBe("/tirages");
  expect(screen.getByRole("link", { name: /Gérer l’extension/ }).getAttribute("href")).toBe("/extension");
  expect(screen.queryByRole("link", { name: /Administration/ })).toBeNull();
});

test("ajoute le parcours administration uniquement pour un administrateur", () => {
  render(<NavigationDashboard profil={{ ...profil, role: "ADMIN" }} />);

  expect(screen.getByRole("link", { name: /Administration/ }).getAttribute("href")).toBe("/admin");
});

import { render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";

const langue = vi.hoisted(() => ({ value: "fr" as "fr" | "en" }));
vi.mock("@/components/i18n/LanguageProvider", () => ({ useLanguage: () => ({ langue: langue.value }) }));

vi.mock("next/navigation", () => ({ usePathname: () => "/admin" }));

import { NavigationAdmin } from "./NavigationAdmin";

test("expose uniquement les parcours de l’espace administrateur", () => {
  langue.value = "fr";
  render(<NavigationAdmin />);

  expect(screen.queryByRole("link", { name: /Contenus/ })).toBeNull();
  expect(screen.getByRole("link", { name: /Annonces/ }).getAttribute("href")).toBe("/admin/announcements");
  expect(screen.getByRole("link", { name: /Tirages/ }).getAttribute("href")).toBe("/admin/raffles");
  expect(screen.getByRole("link", { name: /Boutique/ }).getAttribute("href")).toBe("/admin/shop");
  expect(screen.queryByRole("link", { name: /^Lots$/ })).toBeNull();
  expect(screen.getByRole("link", { name: /Vue d’ensemble/ }).getAttribute("href")).toBe("/admin#overview");
  expect(screen.queryByRole("link", { name: /Espace viewer/ })).toBeNull();
  expect(screen.queryByText("Menu")).toBeNull();
  const adminLinks = screen.getAllByRole("link");
  expect(adminLinks).toHaveLength(7);
  expect(adminLinks.every((link) => link.querySelector("img") !== null)).toBe(true);
});

test("localise la navigation administrateur en anglais", () => {
  langue.value = "en";
  render(<NavigationAdmin />);

  expect(screen.getByRole("navigation", { name: "Administration navigation" })).toBeTruthy();
  expect(screen.getByRole("link", { name: "Overview" })).toBeTruthy();
  expect(screen.getByRole("link", { name: "Shop" }).getAttribute("href")).toBe("/admin/shop");
  expect(screen.queryByRole("link", { name: "Viewer space" })).toBeNull();
  expect(screen.queryByText("Menu")).toBeNull();
  langue.value = "fr";
});

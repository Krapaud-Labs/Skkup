import { render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";

const langue = vi.hoisted(() => ({ value: "fr" as "fr" | "en" }));
vi.mock("@/components/i18n/LanguageProvider", () => ({ useLanguage: () => ({ langue: langue.value }) }));

vi.mock("next/navigation", () => ({ usePathname: () => "/admin" }));

import { NavigationAdmin } from "./NavigationAdmin";

test("expose uniquement les parcours de l’espace administrateur", () => {
  langue.value = "fr";
  render(<NavigationAdmin />);

  expect(screen.getByRole("link", { name: /Contenus/ }).getAttribute("href")).toBe("/admin/content");
  expect(screen.getByRole("link", { name: /Annonces/ }).getAttribute("href")).toBe("/admin/announcements");
  expect(screen.getByRole("link", { name: /Tirages/ }).getAttribute("href")).toBe("/admin/raffles");
  expect(screen.getByRole("link", { name: /Vue d’ensemble/ }).getAttribute("href")).toBe("/admin#overview");
  expect(screen.getByRole("link", { name: /Espace viewer/ }).getAttribute("href")).toBe("/dashboard");
});

test("localise la navigation administrateur en anglais", () => {
  langue.value = "en";
  render(<NavigationAdmin />);

  expect(screen.getByRole("navigation", { name: "Administration navigation" })).toBeTruthy();
  expect(screen.getByRole("link", { name: "Overview" })).toBeTruthy();
  expect(screen.getByRole("link", { name: "Viewer space" })).toBeTruthy();
  langue.value = "fr";
});

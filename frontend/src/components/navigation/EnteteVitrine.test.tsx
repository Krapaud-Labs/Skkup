// @vitest-environment jsdom

import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { EnteteVitrine } from "./EnteteVitrine";

const { recupererSession } = vi.hoisted(() => ({ recupererSession: vi.fn() }));

vi.mock("@/lib/auth", () => ({ recupererSession }));
vi.mock("@/components/i18n/LanguageProvider", () => ({
  traductions: {
    fr: {
      dashboard: "Tableau de bord",
      faq: "FAQ",
      partners: "Partenaires",
      shop: "Tirages",
      signup: "S'inscrire",
      home: { lots: [["", "", "Voir les streams"]] },
    },
  },
  useLanguage: () => ({ langue: "fr" }),
}));
vi.mock("@/components/dashboard/MenuCompteDashboard", () => ({
  MenuCompteDashboard: () => <button type="button">Menu du compte</button>,
}));

describe("EnteteVitrine", () => {
  beforeEach(() => {
    recupererSession.mockReset();
  });

  test("conserve le logo et l’action de compte sans navigation publique pour un visiteur", async () => {
    recupererSession.mockResolvedValue({ profil: null });

    render(<EnteteVitrine actionHref="/connexion" actionLabel="Se connecter" />);

    expect(screen.getByRole("link", { name: "Accueil Skkup" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Accueil Skkup" }).querySelector("img")?.getAttribute("width")).toBe("190");
    expect(screen.getByRole("link", { name: "Accueil Skkup" }).querySelector("img")?.getAttribute("height")).toBe("70");
    expect(screen.getByRole("link", { name: "Se connecter" }).getAttribute("href")).toBe("/connexion");
    expect(screen.queryByRole("navigation", { name: "Navigation vitrine" })).toBeNull();
    await waitFor(() => expect(recupererSession).toHaveBeenCalledOnce());
  });

  test("conserve uniquement le logo et le menu de compte avec une session active", async () => {
    recupererSession.mockResolvedValue({ profil: { id: "user-1", pseudo: "Ada" } });

    render(<EnteteVitrine actionHref="/connexion" actionLabel="Se connecter" />);

    await waitFor(() => expect(screen.getByRole("button", { name: "Menu du compte" })).toBeTruthy());
    expect(screen.getByRole("link", { name: "Accueil Skkup" })).toBeTruthy();
    expect(screen.queryByRole("navigation", { name: "Navigation vitrine" })).toBeNull();
    expect(screen.queryByRole("link", { name: "Tableau de bord" })).toBeNull();
    expect(screen.queryByRole("link", { name: "FAQ" })).toBeNull();
    expect(screen.queryByRole("link", { name: "Tirages" })).toBeNull();
  });
});

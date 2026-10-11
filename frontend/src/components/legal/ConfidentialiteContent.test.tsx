import { render, screen } from "@testing-library/react";
import { beforeEach, expect, test, vi } from "vitest";
import { ConfidentialiteContent } from "./ConfidentialiteContent";

const { lireContenuPublic } = vi.hoisted(() => ({ lireContenuPublic: vi.fn() }));

vi.mock("@/lib/api", () => ({ lireContenuPublic }));
vi.mock("@/components/i18n/LanguageProvider", async () => {
  const actual = await vi.importActual<typeof import("@/components/i18n/LanguageProvider")>("@/components/i18n/LanguageProvider");
  return { ...actual, useLanguage: () => ({ langue: "fr" }) };
});
vi.mock("@/components/navigation/EnteteVitrine", () => ({ EnteteVitrine: () => <nav aria-label="Navigation publique" /> }));

beforeEach(() => {
  vi.clearAllMocks();
  lireContenuPublic.mockResolvedValue(null);
});

test("nomme la zone de confidentialité et conserve le fallback si les sections gérées sont vides", async () => {
  lireContenuPublic.mockResolvedValue({ title: "Brouillon vide", intro: "", sections: [] });
  render(<ConfidentialiteContent />);

  expect(await screen.findByRole("region", { name: "Politique de confidentialité" })).toBeDefined();
  expect(screen.getByRole("heading", { level: 1, name: "Politique de confidentialité" })).toBeDefined();
  expect(screen.getByRole("heading", { level: 2, name: "1. Responsable du traitement" })).toBeDefined();
  expect(screen.getByRole("note")).toBeDefined();
  expect(screen.getByRole("link", { name: "Lire le règlement du jeu" }).getAttribute("href")).toBe("/reglement");
  expect(screen.getByRole("link", { name: "Retour à l'accueil" }).getAttribute("href")).toBe("/");
});

test("retombe sur le contenu local quand le chargement API rejette", async () => {
  lireContenuPublic.mockRejectedValue(new Error("network"));
  render(<ConfidentialiteContent />);

  expect(await screen.findByRole("heading", { level: 2, name: "1. Responsable du traitement" })).toBeDefined();
});

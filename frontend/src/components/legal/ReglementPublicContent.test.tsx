import { render, screen } from "@testing-library/react";
import { beforeEach, expect, test, vi } from "vitest";
import { ReglementPublicContent } from "./ReglementPublicContent";

const { lireContenuPublic, requeteApi } = vi.hoisted(() => ({ lireContenuPublic: vi.fn(), requeteApi: vi.fn() }));

vi.mock("@/lib/api", () => ({ lireContenuPublic, requeteApi }));
vi.mock("@/components/i18n/LanguageProvider", async () => {
  const actual = await vi.importActual<typeof import("@/components/i18n/LanguageProvider")>("@/components/i18n/LanguageProvider");
  return { ...actual, useLanguage: () => ({ langue: "fr" }) };
});

beforeEach(() => {
  vi.clearAllMocks();
  lireContenuPublic.mockResolvedValue(null);
  requeteApi.mockResolvedValue(null);
});

test("conserve un seul titre principal avec le règlement de secours", async () => {
  render(<ReglementPublicContent />);

  expect(await screen.findByRole("heading", { level: 1, name: "Règlement du jeu" })).toBeDefined();
  expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
  expect(screen.getByRole("region", { name: "Règlement du jeu" })).toBeDefined();
});

test("utilise le règlement de secours si le contenu géré est vide", async () => {
  lireContenuPublic.mockResolvedValue({ title: "Brouillon vide", intro: "", sections: [] });
  render(<ReglementPublicContent />);

  expect(await screen.findByText("Article 1. Organisateur")).toBeDefined();
  expect(screen.queryByText("Brouillon vide")).toBeNull();
});

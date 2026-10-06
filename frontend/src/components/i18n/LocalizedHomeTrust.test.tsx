import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { LocalizedHomeTrust } from "./LocalizedHomeTrust";

const handlers = new Map<string, (payload: { nombre: number }) => void>();
const close = vi.fn();

vi.mock("./LanguageProvider", () => ({
  useLanguage: () => ({ langue: "fr" }),
  traductions: { fr: { home: { stats: [["Temps", "visionnage"], ["Points", "gagnés"], ["Tirages", "résultats"], ["Gratuit", "sans achat"]], lotsKicker: "", lotsTitle: "", lots: [["A", "B", "C"], ["D", "E", "F"], ["G", "H", "I"]] } } },
}));

vi.mock("@/lib/api", () => ({
  requeteApi: vi.fn().mockResolvedValue({ nombreUtilisateursInscrits: 7 }),
}));

vi.mock("@/lib/temps-reel", () => ({
  EVENEMENT_UTILISATEURS_INSCRITS: "users:count",
  connecterTempsReel: vi.fn(() => ({
    on: (event: string, handler: (payload: { nombre: number }) => void) => handlers.set(event, handler),
    off: vi.fn(),
    close,
  })),
}));

describe("LocalizedHomeTrust", () => {
  beforeEach(() => {
    handlers.clear();
    close.mockReset();
  });

  test("affiche le nombre fourni par l’API publique", async () => {
    render(<LocalizedHomeTrust />);
    await waitFor(() => expect(screen.getByText("7")).toBeTruthy());
    expect(screen.getByText("membres inscrits")).toBeTruthy();
  });

  test("actualise le compteur quand le serveur diffuse une nouvelle inscription", async () => {
    render(<LocalizedHomeTrust />);
    await waitFor(() => expect(screen.getByText("7")).toBeTruthy());
    handlers.get("users:count")?.({ nombre: 8 });
    await waitFor(() => expect(screen.getByText("8")).toBeTruthy());
  });
});

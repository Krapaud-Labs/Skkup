import { render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import { LocalizedHomeTrust } from "./LocalizedHomeTrust";

vi.mock("./LanguageProvider", () => ({
  useLanguage: () => ({ langue: "fr" }),
  traductions: { fr: { home: { stats: [["Temps", "visionnage"], ["Points", "gagnés"], ["Tirages", "résultats"], ["Gratuit", "sans achat"]], lotsKicker: "", lotsTitle: "", lots: [["A", "B", "C"], ["D", "E", "F"], ["G", "H", "I"]] } } },
}));

describe("LocalizedHomeTrust", () => {
  test("n’affiche plus le compteur public de membres", () => {
    const { container } = render(<LocalizedHomeTrust />);
    expect(screen.queryByText("membres inscrits")).toBeNull();
    expect(container.querySelectorAll("img.skuup-generated-icon")).toHaveLength(0);
    expect(container.querySelectorAll("svg").length).toBeGreaterThan(0);
  });
});

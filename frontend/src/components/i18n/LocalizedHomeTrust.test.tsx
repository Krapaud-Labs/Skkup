import { render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import { LocalizedHomeTrust } from "./LocalizedHomeTrust";

vi.mock("./LanguageProvider", () => ({
  useLanguage: () => ({ langue: "fr" }),
  traductions: { fr: { home: { stats: [["Temps", "visionnage"], ["Points", "gagnés"], ["Tirages", "résultats"], ["Gratuit", "sans achat"]], lotsKicker: "", lotsTitle: "", lots: [["A", "B", "C"], ["D", "E", "F"], ["G", "H", "I"]] } } },
}));

describe("LocalizedHomeTrust", () => {
  test("affiche les statistiques générales sans compteur de membres", () => {
    const { container } = render(<LocalizedHomeTrust />);
    expect(screen.getByText("visionnage")).toBeTruthy();
    expect(screen.queryByText("membres inscrits")).toBeNull();
    const icons = container.querySelectorAll("img.skuup-generated-icon");
    expect(icons.length).toBeGreaterThan(0);
    expect(container.querySelectorAll("svg")).toHaveLength(0);
    expect([...icons].every((icon) => icon.getAttribute("src")?.endsWith(".png"))).toBe(true);
  });
});

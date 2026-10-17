import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { LocalizedAuthIntro } from "./LocalizedAuthIntro";

vi.mock("./LanguageProvider", () => ({
  useLanguage: () => ({ langue: "fr" }),
  traductions: {
    fr: {
      auth: {
        connexion: {
          kicker: "Ton espace Skkup",
          titleLine: "Reviens là où",
          titleAccent: "chaque vue compte.",
          description: "Retrouve ton activité.",
          benefitOne: "Points et historique centralisés",
          benefitTwo: "Tirages publics et vérifiables",
        },
        inscription: {
          kicker: "Bienvenue dans Skkup",
          titleLine: "Ton temps de",
          titleAccent: "visionnage a de la valeur.",
          description: "Crée ton compte.",
          benefitOne: "Gratuit et sans achat obligatoire",
          benefitTwo: "Lots et résultats transparents",
        },
      },
    },
  },
}));

describe("LocalizedAuthIntro", () => {
  it.each(["connexion", "inscription"] as const)("utilise les assets du dashboard en mode %s", (mode) => {
    const { container } = render(<LocalizedAuthIntro mode={mode} />);

    expect(screen.getByText(mode === "connexion" ? "Points et historique centralisés" : "Gratuit et sans achat obligatoire")).toBeTruthy();
    expect(screen.getByText(mode === "connexion" ? "Tirages publics et vérifiables" : "Lots et résultats transparents")).toBeTruthy();
    const images = [...container.querySelectorAll("img")].map((image) => image.getAttribute("src") ?? "");
    expect(images).toHaveLength(2);
    expect(images.some((src) => src.includes("skkup-icon-points.png"))).toBe(true);
    expect(images.some((src) => src.includes("skkup-icon-ticket.png"))).toBe(true);
  });
});

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
    const images = [...container.querySelectorAll<HTMLImageElement>("img.skuup-generated-icon")].map((image) =>
      new URL(image.getAttribute("src") ?? "", "http://localhost").searchParams.get("url")?.replace(/#.*$/, ""),
    );
    expect(images).toHaveLength(2);
    expect(images).toContain("/assets/icons/ui/points.png");
    expect(images).toContain("/assets/icons/ui/ticket.png");
    expect(container.querySelectorAll("[data-brand-mark='official-s']")).toHaveLength(0);
  });
});

import { render, screen } from "@testing-library/react";
import { beforeEach, expect, test, vi } from "vitest";
import { ReglementPublicContent } from "./ReglementPublicContent";

const { lireContenuPublic, requeteApi, langueCourante } = vi.hoisted(() => ({ lireContenuPublic: vi.fn(), requeteApi: vi.fn(), langueCourante: { value: "fr" as "fr" | "en" } }));

vi.mock("@/lib/api", () => ({ lireContenuPublic, requeteApi }));
vi.mock("@/components/i18n/LanguageProvider", async () => {
  const actual = await vi.importActual<typeof import("@/components/i18n/LanguageProvider")>("@/components/i18n/LanguageProvider");
  return { ...actual, useLanguage: () => ({ langue: langueCourante.value }) };
});

beforeEach(() => {
  vi.clearAllMocks();
  langueCourante.value = "fr";
  lireContenuPublic.mockResolvedValue(null);
  requeteApi.mockResolvedValue(null);
});

test("conserve un seul titre principal avec le règlement de secours", async () => {
  render(<ReglementPublicContent />);

  expect(await screen.findByRole("heading", { level: 1, name: "Règlement du jeu" })).toBeDefined();
  expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
  expect(screen.getByRole("region", { name: "Règlement du jeu" })).toBeDefined();
});

test.each(["fr", "en"] as const)("n’affiche pas l’avertissement de relecture juridique en %s", async (langue) => {
  langueCourante.value = langue;
  render(<ReglementPublicContent />);

  expect(await screen.findByRole("region", { name: langue === "en" ? "Game rules" : "Règlement du jeu" })).toBeDefined();
  expect(screen.queryByRole("note")).toBeNull();
  expect(screen.queryByText(/legal review|relecture juridique|vérifier juridiquement/i)).toBeNull();
});

test("utilise le règlement de secours si le contenu géré est vide", async () => {
  lireContenuPublic.mockResolvedValue({ title: "Brouillon vide", intro: "", sections: [] });
  render(<ReglementPublicContent />);

  expect(await screen.findByText("Article 1. Organisateur")).toBeDefined();
  expect(screen.queryByText("Brouillon vide")).toBeNull();
});

test.each([
  ["fr", "En version 1.0, seuls les visionnages actifs reconnus sur Twitch, YouTube Gaming ou Kick via l'extension officielle Skkup dans Chrome de bureau peuvent générer des points de visionnage. Les applications natives, sur mobile ou ordinateur, les téléphones, tablettes, téléviseurs connectés et navigateurs sans l'extension ne sont pas éligibles. Les autres plateformes de streaming sont hors périmètre. Firefox et Opera ne sont pas pris en charge pour les points de visionnage en version 1.0; leur prise en charge est prévue en version 1.1."],
  ["en", "In version 1.0, only active viewing recognised on Twitch, YouTube Gaming or Kick through the official Skkup extension in desktop Google Chrome can earn viewing points. Native apps on mobile or desktop, phones, tablets, connected TVs, and browsers without the extension are not eligible. Other streaming platforms are out of scope. Firefox and Opera are not supported for viewing points in version 1.0; support is planned for version 1.1."],
] as const)("affiche la règle d'éligibilité en %s juste après l'article 4", async (langue, clause) => {
  langueCourante.value = langue;
  lireContenuPublic.mockResolvedValue({
    title: "Game rules",
    intro: "",
    sections: [
      { heading: langue === "en" ? "Article 3. Participation requirements" : "Article 3. Conditions de participation", body: "Participation." },
      { heading: langue === "en" ? "Article 4. Earning points and tickets" : "Article 4. Obtention des points et des tickets", body: langue === "en" ? "Points follow the published limits." : "Les points suivent les plafonds affichés." },
    ],
  });

  render(<ReglementPublicContent />);

  const articleBody = await screen.findByText(langue === "en" ? "Points follow the published limits." : "Les points suivent les plafonds affichés.");
  const articleFour = screen.getByRole("heading", { level: 2, name: /Article 4\./ });
  const renderedClause = articleFour.nextElementSibling as HTMLElement | null;
  expect(renderedClause?.tagName).toBe("P");
  expect(renderedClause?.textContent).toBe(clause);
  expect(renderedClause?.nextElementSibling).toBe(articleBody);
  expect(screen.queryByText(/cannot be held liable|ne pourra être tenu responsable/i)).toBeNull();
});

test.each([
  ["fr", "En version 1.0, seuls les visionnages actifs reconnus sur Twitch, YouTube Gaming ou Kick via l'extension officielle Skkup dans Chrome de bureau peuvent générer des points de visionnage. Les applications natives, sur mobile ou ordinateur, les téléphones, tablettes, téléviseurs connectés et navigateurs sans l'extension ne sont pas éligibles. Les autres plateformes de streaming sont hors périmètre. Firefox et Opera ne sont pas pris en charge pour les points de visionnage en version 1.0; leur prise en charge est prévue en version 1.1."],
  ["en", "In version 1.0, only active viewing recognised on Twitch, YouTube Gaming or Kick through the official Skkup extension in desktop Google Chrome can earn viewing points. Native apps on mobile or desktop, phones, tablets, connected TVs, and browsers without the extension are not eligible. Other streaming platforms are out of scope. Firefox and Opera are not supported for viewing points in version 1.0; support is planned for version 1.1."],
] as const)("conserve la règle d'éligibilité dans le règlement de secours en %s", async (langue, clause) => {
  langueCourante.value = langue;
  lireContenuPublic.mockResolvedValue(null);

  render(<ReglementPublicContent />);

  const articleFour = screen.getByRole("heading", { level: 2, name: /Article 4\./ });
  const renderedClause = articleFour.nextElementSibling as HTMLElement | null;
  expect(renderedClause?.tagName).toBe("P");
  expect(renderedClause?.textContent).toBe(clause);
  expect(screen.queryByText(/cannot be held liable|ne pourra être tenu responsable/i)).toBeNull();
});

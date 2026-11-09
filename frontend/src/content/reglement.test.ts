import { describe, expect, test } from "vitest";
import { reglementMarkdown } from "./reglement";
import { reglementMarkdownEn } from "./reglement-en";

function articles(markdown: string) {
  return [...markdown.matchAll(/^## Article (\d+)\./gm)].map((match) => match[1]);
}

describe("bilingual game rules", () => {
  test("publishes the same twelve article sections in French and English", () => {
    expect(articles(reglementMarkdown)).toEqual(Array.from({ length: 12 }, (_, index) => String(index + 1)));
    expect(articles(reglementMarkdownEn)).toEqual(articles(reglementMarkdown));
    expect(reglementMarkdown).toContain("## Article 1. Objet et durée");
    expect(reglementMarkdownEn).toContain("## Article 1. Purpose and duration");
    expect(reglementMarkdown).not.toContain("## Article 1. Organisateur");
    expect(reglementMarkdownEn).not.toContain("## Article 1. Organiser");
  });

  test("keeps the English document free of French article headings", () => {
    expect(reglementMarkdownEn).toContain("# Skkup game rules");
    expect(reglementMarkdownEn).not.toContain("# Règlement du jeu Skkup");
    expect(reglementMarkdownEn).toContain("appropriate human review");
  });
});

import { describe, expect, test } from "vitest";
import { reglementMarkdown } from "./reglement";
import { reglementMarkdownEn } from "./reglement-en";

function articles(markdown: string) {
  return [...markdown.matchAll(/^## Article (\d+)\./gm)].map((match) => match[1]);
}

describe("bilingual game rules", () => {
  test("publishes the same thirteen article sections in French and English", () => {
    expect(articles(reglementMarkdown)).toEqual(Array.from({ length: 13 }, (_, index) => String(index + 1)));
    expect(articles(reglementMarkdownEn)).toEqual(articles(reglementMarkdown));
  });

  test("keeps the English document free of French article headings", () => {
    expect(reglementMarkdownEn).toContain("# Skkup game rules");
    expect(reglementMarkdownEn).not.toContain("# Règlement du jeu Skkup");
    expect(reglementMarkdownEn).toContain("appropriate human review");
  });
});

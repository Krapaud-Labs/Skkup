import { render, screen } from "@testing-library/react";
import { beforeEach, expect, test, vi } from "vitest";
import { FaqContent } from "./FaqContent";
import { imagesForSource } from "@/test-utils/next-image";

vi.mock("@/components/i18n/LanguageProvider", () => ({
  useLanguage: () => ({ langue: "fr" }),
}));
vi.mock("@/lib/api", () => ({
  lireContenuPublic: vi.fn().mockResolvedValue(null),
}));

beforeEach(() => vi.clearAllMocks());

test("relie la section FAQ et chaque réponse à son titre", async () => {
  render(<FaqContent />);

  const section = screen.getByRole("region", { name: "Questions fréquentes" });
  expect(section.getAttribute("aria-labelledby")).toBe("faq-page-title");
  expect(imagesForSource(section, "/assets/icons/ui/sparkle.png")).toHaveLength(1);
  expect(screen.getAllByRole("article")).toHaveLength(4);
  for (const article of screen.getAllByRole("article")) {
    const titreId = article.getAttribute("aria-labelledby");
    expect(titreId).toBeTruthy();
    expect(document.getElementById(titreId ?? "")?.tagName).toBe("H2");
  }
});

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { traductions } from "./LanguageProvider";
import { LocalizedExtensionIntro } from "./LocalizedExtensionIntro";

vi.mock("./LanguageProvider", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./LanguageProvider")>();
  return { ...actual, useLanguage: () => ({ langue: "fr" }) };
});

describe("LocalizedExtensionIntro", () => {
  it("rend le pictogramme PNG du lien externe", () => {
    const { container } = render(<LocalizedExtensionIntro />);

    expect(screen.getByRole("link", { name: traductions.fr.extension.installExtensionAria })).toBeDefined();
    expect(container.querySelector('img[src="/assets/icons/ui/arrow-up-right.png"]')).not.toBeNull();
  });
});

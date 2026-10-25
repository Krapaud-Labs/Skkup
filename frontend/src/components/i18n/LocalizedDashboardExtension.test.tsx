import { render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import { CHROME_WEB_STORE_URL } from "@/lib/extension";
import { LocalizedDashboardExtension } from "./LocalizedDashboardExtension";

vi.mock("./LanguageProvider", () => ({
  traductions: { fr: { extension: { kicker: "Extension", dashboardHeading: "Associe Chrome", dashboardDescription: "Description", installExtension: "Installer l’extension", installExtensionAria: "Installer l’extension Skkup depuis le Chrome Web Store" }, home: { lots: [["", "", "Voir les streams"]] } } },
  useLanguage: () => ({ langue: "fr" }),
}));

describe("LocalizedDashboardExtension", () => {
  test("expose le lien publié du Chrome Web Store sans inventer d'autres navigateurs", () => {
    render(<LocalizedDashboardExtension />);
    const lien = screen.getByRole("link", { name: "Installer l’extension Skkup depuis le Chrome Web Store" });
    expect(lien.getAttribute("href")).toBe(CHROME_WEB_STORE_URL);
    expect(lien.getAttribute("target")).toBe("_blank");
    expect(screen.queryByText(/Firefox|Edge/)).toBeNull();
    expect(document.querySelector("img[src*='skkup-icon-extension-dashboard.png']")).not.toBeNull();
  });
});

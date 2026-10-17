import { render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import { LocalizedDashboardExtensionPage } from "./LocalizedDashboardExtensionPage";

const langue = vi.hoisted(() => ({ value: "en" as "fr" | "en" }));

vi.mock("./LanguageProvider", async () => {
  const actual = await vi.importActual<typeof import("./LanguageProvider")>("./LanguageProvider");
  return { ...actual, useLanguage: () => ({ langue: langue.value, definirLangue: () => undefined }) };
});
vi.mock("@/components/extension/CodeAppariement", () => ({
  CodeAppariement: () => <div>Pairing panel</div>,
}));

describe("LocalizedDashboardExtensionPage", () => {
  test("rend le dashboard extension en anglais sans libellé français résiduel", () => {
    render(<LocalizedDashboardExtensionPage />);

    expect(screen.getByText("Supported platforms")).toBeDefined();
    expect(screen.queryByRole("heading", { name: "Pair your extension" })).toBeNull();
    expect(screen.getByRole("link", { name: "Install the Skkup extension from the Chrome Web Store" })).toBeDefined();
    expect(screen.getByText("Simple and transparent tracking")).toBeDefined();
    expect(screen.queryByText("Supported browsers")).toBeNull();
  });
});

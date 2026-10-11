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

    expect(screen.getByRole("heading", { name: "Supported browsers" })).toBeDefined();
    expect(screen.getByRole("heading", { name: "Pair your extension" })).toBeDefined();
    expect(screen.getByText("Install from the Chrome Web Store")).toBeDefined();
    expect(screen.getByText("Privacy & permissions")).toBeDefined();
    expect(screen.queryByText("Navigateurs compatibles")).toBeNull();
  });
});

import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { LanguageProvider, useLanguage } from "./LanguageProvider";

function Probe() {
  const { langue, definirLangue } = useLanguage();
  return (
    <div>
      <output>{langue}</output>
      <button type="button" onClick={() => definirLangue("en")}>EN</button>
    </div>
  );
}

describe("LanguageProvider", () => {
  afterEach(() => {
    window.localStorage.clear();
    Object.defineProperty(navigator, "languages", { configurable: true, value: ["de-DE"] });
  });

  it("falls back to French when the browser language is unsupported", () => {
    Object.defineProperty(navigator, "languages", { configurable: true, value: ["de-DE", "es-ES"] });

    render(<LanguageProvider><Probe /></LanguageProvider>);

    expect(screen.getByText("fr")).toBeDefined();
  });

  it("persists a manual language choice", () => {
    render(<LanguageProvider><Probe /></LanguageProvider>);

    fireEvent.click(screen.getByRole("button", { name: "EN" }));

    expect(screen.getByText("en")).toBeDefined();
    expect(window.localStorage.getItem("skkup-language")).toBe("en");
    expect(document.documentElement.lang).toBe("en");
  });
});

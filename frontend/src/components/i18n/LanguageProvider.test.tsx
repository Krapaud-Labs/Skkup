import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, test } from "vitest";
import { LanguageProvider, useLanguage } from "./LanguageProvider";

function Probe() {
  const { langue, definirLangue } = useLanguage();
  return <button type="button" onClick={() => definirLangue(langue === "fr" ? "en" : "fr")}>{langue}</button>;
}

describe("LanguageProvider accessibility state", () => {
  beforeEach(() => {
    const values = new Map<string, string>();
    values.set("skkup-language", "fr");
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: {
        getItem: (key: string) => values.get(key) ?? null,
        setItem: (key: string, value: string) => values.set(key, value),
        removeItem: (key: string) => values.delete(key),
        clear: () => values.clear(),
      },
    });
    window.localStorage.clear();
    Object.defineProperty(window.navigator, "languages", { configurable: true, value: ["fr-FR"] });
    Object.defineProperty(window.navigator, "language", { configurable: true, value: "fr-FR" });
    document.documentElement.lang = "fr";
  });

  test("keeps document language synchronized with the active language", () => {
    render(<LanguageProvider><Probe /></LanguageProvider>);
    expect(document.documentElement.lang).toBe("fr");
    fireEvent.click(screen.getByRole("button", { name: "fr" }));
    expect(screen.getByRole("button", { name: "en" })).toBeDefined();
    expect(document.documentElement.lang).toBe("en");
  });
});

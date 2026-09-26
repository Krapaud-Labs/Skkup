import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, test } from "vitest";
import { LanguageProvider, useLanguage } from "./LanguageProvider";

function Probe() {
  const { langue, definirLangue } = useLanguage();
  return <button type="button" onClick={() => definirLangue(langue === "fr" ? "en" : "fr")}>{langue}</button>;
}

describe("LanguageProvider accessibility state", () => {
  beforeEach(() => {
    window.localStorage.clear();
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

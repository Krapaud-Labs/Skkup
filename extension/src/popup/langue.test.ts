import { describe, expect, it } from "vitest";
import { choisirLangueInterface } from "./langue";

describe("choisirLangueInterface", () => {
  it("reconnaît le français avec une région", () => {
    expect(choisirLangueInterface(["fr-CA", "en-US"])).toBe("fr");
  });

  it("prend la première langue prise en charge dans les préférences", () => {
    expect(choisirLangueInterface(["de-DE", "en-GB", "fr-FR"])).toBe("en");
    expect(choisirLangueInterface(["de-DE", "fr-FR"])).toBe("fr");
  });

  it("utilise l'anglais si aucune langue prise en charge n'est préférée", () => {
    expect(choisirLangueInterface(["de-DE", "es-ES"])).toBe("en");
    expect(choisirLangueInterface([])).toBe("en");
    expect(choisirLangueInterface(undefined)).toBe("en");
    expect(choisirLangueInterface(null)).toBe("en");
  });
});

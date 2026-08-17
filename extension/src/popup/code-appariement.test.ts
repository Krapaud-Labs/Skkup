import { describe, expect, it } from "vitest";
import { codeComplet, formaterCodeSaisi } from "./code-appariement";

describe("formaterCodeSaisi", () => {
  it("met en majuscules et regroupe par blocs de quatre", () => {
    expect(formaterCodeSaisi("h4t7k9mp2xqz")).toBe("H4T7-K9MP-2XQZ");
  });

  it("absorbe les séparateurs déjà saisis", () => {
    expect(formaterCodeSaisi("h4t7 k9mp-2xqz")).toBe("H4T7-K9MP-2XQZ");
  });

  it("laisse la saisie partielle lisible", () => {
    expect(formaterCodeSaisi("h4t7k")).toBe("H4T7-K");
    expect(formaterCodeSaisi("")).toBe("");
  });

  it("tronque au-delà de la longueur d'un code", () => {
    expect(formaterCodeSaisi("h4t7k9mp2xqzSUPPLEMENT")).toBe("H4T7-K9MP-2XQZ");
  });
});

describe("codeComplet", () => {
  it("reconnaît un code de douze caractères, séparateurs compris ou non", () => {
    expect(codeComplet("H4T7-K9MP-2XQZ")).toBe(true);
    expect(codeComplet("h4t7k9mp2xqz")).toBe(true);
  });

  it("refuse une saisie trop courte", () => {
    expect(codeComplet("H4T7-K9MP")).toBe(false);
  });
});

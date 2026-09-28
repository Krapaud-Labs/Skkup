import { describe, expect, it } from "vitest";
import { validerOrigineApi } from "./config";

describe("validerOrigineApi", () => {
  it("accepte HTTPS en production", () => {
    expect(validerOrigineApi("https://api.skkup.fr/v1")).toBe("https://api.skkup.fr");
  });

  it("n'accepte HTTP qu'en local", () => {
    expect(validerOrigineApi("http://localhost:3001")).toBe("http://localhost:3001");
    expect(() => validerOrigineApi("http://api.skkup.fr")).toThrow();
  });

  it("refuse les identifiants et fragments dans l'URL", () => {
    expect(() => validerOrigineApi("https://user:pass@api.skkup.fr")).toThrow();
    expect(() => validerOrigineApi("https://api.skkup.fr/#secret")).toThrow();
  });
});

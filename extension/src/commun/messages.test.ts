import { describe, expect, it } from "vitest";
import { estMessageExtension } from "./messages";
import { LONGUEUR_MAX_IDENTIFIANT_CHAINE } from "./plateformes";

const PAGE = { plateforme: "TWITCH", identifiantChaine: "machaine" };

describe("estMessageExtension", () => {
  it("accepte un signal de lecture bien formé", () => {
    expect(
      estMessageExtension({
        type: "etat-lecture",
        page: PAGE,
        enLecture: true,
        positionSecondes: 42,
      }),
    ).toBe(true);
  });

  it("accepte les messages sans données", () => {
    expect(estMessageExtension({ type: "fin-page" })).toBe(true);
    expect(estMessageExtension({ type: "etat-extension" })).toBe(true);
    expect(estMessageExtension({ type: "etat-extension", langue: "en" })).toBe(true);
    expect(estMessageExtension({ type: "appariement-modifie" })).toBe(true);
  });

  it("refuse un message inconnu ou sans forme", () => {
    expect(estMessageExtension(null)).toBe(false);
    expect(estMessageExtension("etat-lecture")).toBe(false);
    expect(estMessageExtension({ type: "ouvre-moi-une-session" })).toBe(false);
    expect(estMessageExtension({ type: "etat-extension", langue: "de" })).toBe(false);
  });

  it("refuse un signal de lecture amputé de sa page", () => {
    expect(
      estMessageExtension({
        type: "etat-lecture",
        enLecture: true,
        positionSecondes: 0,
      }),
    ).toBe(false);
  });

  it("refuse une plateforme hors de la liste connue", () => {
    expect(
      estMessageExtension({
        type: "etat-lecture",
        page: { plateforme: "KICK", identifiantChaine: "machaine" },
        enLecture: true,
        positionSecondes: 0,
      }),
    ).toBe(false);
  });

  /**
   * L'identifiant de chaîne vient du balisage d'une page tierce et finit
   * dans un appel API : sa longueur est bornée avant d'être transmise.
   */
  it("refuse un identifiant de chaîne vide ou démesuré", () => {
    const signal = (identifiantChaine: string) => ({
      type: "etat-lecture",
      page: { plateforme: "YOUTUBE", identifiantChaine },
      enLecture: true,
      positionSecondes: 0,
    });
    expect(estMessageExtension(signal(""))).toBe(false);
    expect(
      estMessageExtension(signal("U".repeat(LONGUEUR_MAX_IDENTIFIANT_CHAINE))),
    ).toBe(true);
    expect(
      estMessageExtension(
        signal("U".repeat(LONGUEUR_MAX_IDENTIFIANT_CHAINE + 1)),
      ),
    ).toBe(false);
  });

  it("refuse une position de lecture aberrante", () => {
    const signal = (positionSecondes: unknown) => ({
      type: "etat-lecture",
      page: PAGE,
      enLecture: true,
      positionSecondes,
    });
    expect(estMessageExtension(signal(-1))).toBe(false);
    expect(estMessageExtension(signal(Number.NaN))).toBe(false);
    expect(estMessageExtension(signal("42"))).toBe(false);
  });
});

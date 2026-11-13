import { describe, expect, it } from "vitest";
import { calculerPourcentageProgression } from "./progression";

describe("calculerPourcentageProgression", () => {
  it("dérive la barre des seules durées validées par le serveur", () => {
    expect(
      calculerPourcentageProgression({
        statut: "EN_COURS",
        secondesValideesJour: 35 * 60,
        secondesAvantProchainPalier: 25 * 60,
        pointsProchainCredit: 10,
      }),
    ).toBeCloseTo(58.33, 1);
  });

  it("mesure la tranche horaire courante après une heure déjà validée", () => {
    expect(
      calculerPourcentageProgression({
        statut: "EN_COURS",
        secondesValideesJour: 95 * 60,
        secondesAvantProchainPalier: 25 * 60,
        pointsProchainCredit: 10,
      }),
    ).toBeCloseTo(58.33, 1);
  });

  it("affiche le plafond journalier atteint comme progression complète", () => {
    expect(
      calculerPourcentageProgression({
        statut: "PLAFOND_ATTEINT",
        secondesValideesJour: 6 * 60 * 60,
        secondesAvantProchainPalier: null,
        pointsProchainCredit: 0,
      }),
    ).toBe(100);
  });

  it("renvoie zéro quand le backend ne rapporte aucune durée", () => {
    expect(
      calculerPourcentageProgression({
        statut: "EN_COURS",
        secondesValideesJour: 0,
        secondesAvantProchainPalier: 3600,
        pointsProchainCredit: 10,
      }),
    ).toBe(0);
  });

  it("renvoie zéro si le backend ne fournit pas de prochain palier", () => {
    expect(
      calculerPourcentageProgression({
        statut: "EN_COURS",
        secondesValideesJour: 35 * 60,
        secondesAvantProchainPalier: null,
        pointsProchainCredit: 0,
      }),
    ).toBe(0);
  });
});

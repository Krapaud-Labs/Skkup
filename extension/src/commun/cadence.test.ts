import { describe, expect, it } from "vitest";
import {
  ECART_HEARTBEAT_MAX_MS,
  prochainDelaiHeartbeatMs,
  prochainePeriodeSignalMs,
} from "./cadence";

// Plafond de plausibilité du backend (watch-sessions.service.ts) :
// INTERVALLE_HEARTBEAT_ATTENDU_SECONDES * 3.
const PLAFOND_SERVEUR_MS = 90_000;

describe("cadence", () => {
  it("tire un délai de heartbeat strictement variable", () => {
    const delais = new Set(
      [0, 0.25, 0.5, 0.75, 0.99].map((valeur) =>
        prochainDelaiHeartbeatMs(() => valeur),
      ),
    );
    expect(delais.size).toBe(5);
  });

  it("tire une période de signal strictement variable", () => {
    const periodes = new Set(
      [0, 0.25, 0.5, 0.75, 0.99].map((valeur) =>
        prochainePeriodeSignalMs(() => valeur),
      ),
    );
    expect(periodes.size).toBe(5);
  });

  /**
   * Le serveur invalide une session dont cinq intervalles consécutifs sont
   * identiques à la seconde près. Avec une période de signal fixe, tous les
   * heartbeats retomberaient sur la même grille et l'écart mesuré serait
   * constant malgré la gigue du délai : c'est cette régression que le test
   * verrouille.
   */
  it("produit des écarts distincts entre heartbeats successifs", () => {
    const tirages = [0.1, 0.4, 0.9, 0.3, 0.7, 0.05, 0.6, 0.85];
    let suivant = 0;
    const aleatoire = () => tirages[suivant++ % tirages.length] ?? 0;

    const ecarts = new Set<number>();
    for (let essai = 0; essai < 5; essai += 1) {
      const delai = prochainDelaiHeartbeatMs(aleatoire);
      // Le heartbeat part au premier signal reçu après l'échéance : on
      // accumule les périodes de signal jusqu'à dépasser le délai.
      let ecart = 0;
      while (ecart < delai) {
        ecart += prochainePeriodeSignalMs(aleatoire);
      }
      ecarts.add(Math.floor(ecart / 1000));
    }

    expect(ecarts.size).toBeGreaterThan(1);
  });

  it("reste sous le plafond de plausibilité du serveur", () => {
    expect(ECART_HEARTBEAT_MAX_MS).toBeLessThan(PLAFOND_SERVEUR_MS);
  });
});

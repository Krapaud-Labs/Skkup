import type { ProgressionVisionnage } from "../commun/endpoints";

/**
 * Le pourcentage est dérivé uniquement de durées validées par le serveur.
 * La position du lecteur n'est volontairement pas acceptée par cette API.
 */
export function calculerPourcentageProgression(
  progression: ProgressionVisionnage,
): number {
  if (progression.statut === "PLAFOND_ATTEINT") return 100;

  if (progression.secondesAvantProchainPalier === null) return 0;

  const secondesDansLaTranche = Math.max(
    0,
    3600 - progression.secondesAvantProchainPalier,
  );
  return Math.min(100, Math.max(0, (secondesDansLaTranche / 3600) * 100));
}

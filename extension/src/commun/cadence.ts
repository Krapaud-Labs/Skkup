/**
 * Tirage des délais qui rythment le suivi.
 *
 * Les deux cadences sont regroupées ici parce qu'elles ne sont pas
 * indépendantes : le serveur ne voit ni le délai de heartbeat ni la
 * période de signal, seulement l'écart entre deux heartbeats reçus, qui
 * résulte des deux. Ce sont ces deux tirages ensemble qui produisent
 * l'irrégularité attendue par la détection d'intervalles identiques
 * (contexte sécurité agentic, « Fraude au watch time »).
 */

import {
  HEARTBEAT_DELAI_BASE_MS,
  HEARTBEAT_GIGUE_MAX_MS,
  SIGNAL_GIGUE_MAX_MS,
  SIGNAL_PERIODE_BASE_MS,
} from "./config";

/** Source d'aléa, injectable pour rendre les cadences vérifiables. */
export type Aleatoire = () => number;

function tirer(base: number, gigue: number, aleatoire: Aleatoire): number {
  return base + Math.floor(aleatoire() * gigue);
}

/** Délai visé avant le prochain heartbeat, en millisecondes. */
export function prochainDelaiHeartbeatMs(
  aleatoire: Aleatoire = Math.random,
): number {
  return tirer(HEARTBEAT_DELAI_BASE_MS, HEARTBEAT_GIGUE_MAX_MS, aleatoire);
}

/** Délai avant le prochain signal du script de contenu, en millisecondes. */
export function prochainePeriodeSignalMs(
  aleatoire: Aleatoire = Math.random,
): number {
  return tirer(SIGNAL_PERIODE_BASE_MS, SIGNAL_GIGUE_MAX_MS, aleatoire);
}

/**
 * Écart maximal possible entre deux heartbeats successifs : le délai le
 * plus long suivi de la période de signal la plus longue. Sert de
 * garde-fou vis-à-vis du plafond de plausibilité du serveur.
 */
export const ECART_HEARTBEAT_MAX_MS =
  HEARTBEAT_DELAI_BASE_MS +
  HEARTBEAT_GIGUE_MAX_MS +
  SIGNAL_PERIODE_BASE_MS +
  SIGNAL_GIGUE_MAX_MS;

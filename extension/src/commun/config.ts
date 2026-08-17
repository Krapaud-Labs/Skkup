/**
 * Constantes partagées par le service worker, le script de contenu et la
 * popup. L'URL de l'API est injectée au build (voir scripts/build.mjs) :
 * elle doit correspondre à la permission d'hôte inscrite dans le
 * manifeste, ce qu'une valeur modifiable à l'exécution ne garantirait
 * pas.
 */

declare const __URL_API__: string;

export const URL_API: string = __URL_API__;

// ─── Rythme des heartbeats ────────────────────────────────────────────────────

/**
 * Le backend rejette tout intervalle supérieur à 90 secondes et invalide
 * une session dont cinq intervalles consécutifs tombent à la seconde
 * près (`watch-sessions.service.ts`). Un service worker MV3 étant
 * réveillé par des alarmes dont la granularité minimale est de
 * 30 secondes, on vise 45 à 60 secondes : au-dessus du minimum imposé
 * par Chrome, assez loin du plafond serveur pour absorber un réveil
 * tardif, et volontairement irrégulier.
 */
export const HEARTBEAT_DELAI_BASE_MS = 45_000;
export const HEARTBEAT_GIGUE_MAX_MS = 15_000;

/** Nom de l'alarme MV3 qui réveille le service worker pour un heartbeat. */
export const ALARME_HEARTBEAT = "viewer-rewards:heartbeat";

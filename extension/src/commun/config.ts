/**
 * Constantes partagées par le service worker, le script de contenu et la
 * popup. L'URL de l'API est injectée au build (voir scripts/build.mjs) :
 * elle doit correspondre à la permission d'hôte inscrite dans le
 * manifeste, ce qu'une valeur modifiable à l'exécution ne garantirait
 * pas.
 */

declare const __URL_API__: string;

/**
 * L'URL est injectée au build et devient une donnée de confiance du paquet.
 * Refuser ici toute origine non HTTPS (sauf localhost pour le développement)
 * évite de publier par erreur une extension qui enverrait son jeton sur un
 * réseau non chiffré ou vers une URL inattendue.
 */
export function validerOrigineApi(urlApi: string): string {
  let url: URL;
  try {
    url = new URL(urlApi);
  } catch {
    throw new Error("SKKUP_API_URL doit être une URL absolue.");
  }
  const hoteLocal = url.hostname === "localhost" || url.hostname === "127.0.0.1" || url.hostname === "[::1]";
  if (url.username || url.password || url.hash || (!hoteLocal && url.protocol !== "https:")) {
    throw new Error("SKKUP_API_URL doit utiliser HTTPS hors développement local.");
  }
  return url.origin;
}

export const URL_API: string = validerOrigineApi(__URL_API__);

// ─── Rythme des heartbeats ───────────────────────────────────────────────────

/**
 * Le backend rejette tout intervalle supérieur à 90 secondes et invalide
 * une session dont cinq intervalles consécutifs tombent à la seconde
 * près (`watch-sessions.service.ts`). On vise donc 40 à 50 secondes :
 * assez loin du plafond serveur pour absorber la période de signal
 * ci-dessous et un réveil tardif du service worker, et volontairement
 * irrégulier.
 */
export const HEARTBEAT_DELAI_BASE_MS = 40_000;
export const HEARTBEAT_GIGUE_MAX_MS = 10_000;

// ─── Rythme des signaux du script de contenu ─────────────────────────────────

/**
 * Le service worker n'envoie un heartbeat qu'au premier signal reçu
 * après l'échéance du délai ci-dessus : l'intervalle que mesure le
 * serveur est donc celui des signaux, pas celui du délai tiré au sort.
 * Une période de signal fixe rendrait cette gigue purement décorative
 * (tous les heartbeats retomberaient sur la même grille, à la
 * milliseconde près) et déclencherait la détection d'intervalles
 * identiques du backend. La période est donc tirée au sort elle aussi,
 * à chaque signal.
 *
 * Plafond : `HEARTBEAT_DELAI_BASE_MS + HEARTBEAT_GIGUE_MAX_MS +
 * SIGNAL_PERIODE_BASE_MS + SIGNAL_GIGUE_MAX_MS` doit rester nettement
 * sous les 90 secondes du serveur (66 s ici, soit 24 s de marge pour la
 * latence réseau et le réveil du service worker).
 */
export const SIGNAL_PERIODE_BASE_MS = 10_000;
export const SIGNAL_GIGUE_MAX_MS = 6_000;

/** Nom de l'alarme MV3 qui réveille le service worker pour un heartbeat. */
export const ALARME_HEARTBEAT = "skuup:heartbeat";

/**
 * Passerelle avec le lecteur YouTube embarqué.
 *
 * Le lecteur est piloté par postMessage plutôt qu'en chargeant le script
 * officiel `iframe_api` : ce script s'exécuterait dans l'origine du site,
 * alors que le protocole postMessage laisse tout le code tiers confiné
 * dans l'iframe cross-origin (aucun accès à notre DOM ni à nos cookies,
 * et un `frame-src` suffit côté CSP, sans `script-src` tiers). C'est le
 * même protocole que celui utilisé en interne par l'IFrame Player API.
 *
 * Toute la logique pure (construction d'URL, interprétation des
 * messages) vit ici pour rester testable sans navigateur réel.
 */

// ─── Constantes du protocole ─────────────────────────────────────────────────

export const ORIGINE_YOUTUBE = "https://www.youtube.com";

/**
 * États renvoyés par le lecteur dans `info.playerState`. Seul LECTURE
 * compte comme visionnage actif : la mise en mémoire tampon ou la pause
 * n'ouvrent pas droit à des points.
 */
const ETAT_LECTURE = 1;

// ─── Construction de l'URL d'embarquement ────────────────────────────────────

/**
 * Le direct en cours d'une chaîne s'embarque via `embed/live_stream`.
 * `enablejsapi` active le protocole postMessage et `origin` restreint les
 * messages émis par le lecteur à notre seule origine.
 */
export function urlEmbarquementYouTube(
  identifiantChaine: string,
  origine: string,
): string {
  const parametres = new URLSearchParams({
    channel: identifiantChaine,
    enablejsapi: "1",
    origin: origine,
  });
  return `${ORIGINE_YOUTUBE}/embed/live_stream?${parametres.toString()}`;
}

// ─── Interprétation des messages entrants ────────────────────────────────────

export interface EtatLecteur {
  enLecture: boolean;
  positionSecondes: number;
}

interface MessageYouTube {
  event?: string;
  info?: { playerState?: number; currentTime?: number };
}

/**
 * Traduit un message brut du lecteur en état de visionnage, ou renvoie
 * null si le message ne porte pas d'information exploitable (accusés de
 * réception, messages de dimensionnement, format inattendu).
 */
export function interpreterMessageYouTube(donnees: unknown): EtatLecteur | null {
  if (typeof donnees !== "string") {
    return null;
  }

  let message: MessageYouTube;
  try {
    message = JSON.parse(donnees) as MessageYouTube;
  } catch {
    return null;
  }

  const info = message?.info;
  if (!info || typeof info.playerState !== "number") {
    return null;
  }

  return {
    enLecture: info.playerState === ETAT_LECTURE,
    positionSecondes:
      typeof info.currentTime === "number" ? info.currentTime : 0,
  };
}

// ─── Messages sortants ───────────────────────────────────────────────────────

/**
 * Poignée de main : sans ce message le lecteur n'émet rien. Le second
 * message abonne explicitement la page aux changements d'état, pour ne
 * pas dépendre uniquement des rapports périodiques du lecteur.
 */
export const messagesAbonnementYouTube = [
  { event: "listening", id: "viewer-rewards", channel: "widget" },
  {
    event: "command",
    func: "addEventListener",
    args: ["onStateChange"],
    id: "viewer-rewards",
    channel: "widget",
  },
] as const;

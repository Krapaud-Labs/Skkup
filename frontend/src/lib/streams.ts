import { requeteApi } from "./api";

/**
 * Catalogue public des streams disponibles (GET /streams).
 *
 * L'endpoint est volontairement anonyme (docs/04-api-contract.md, section
 * Visionnage) : la liste s'affiche sans compte, seule l'ouverture d'une
 * session de visionnage exige d'être connecté. On passe donc par
 * requeteApi et non par fetchAuthentifie, pour ne pas envoyer le cookie
 * de session à un endpoint qui n'en a pas besoin.
 */

// ─── Types du contrat ────────────────────────────────────────────────────────

export type Plateforme = "TWITCH" | "YOUTUBE" | "FACEBOOK";

export interface Stream {
  id: string;
  plateforme: Plateforme;
  /** Identifiant de la chaîne sur la plateforme, réutilisé comme streamExternalId. */
  identifiantChaine: string;
  nomAffiche: string;
  /** Miniature HTTPS réellement fournie par la plateforme, si disponible. */
  thumbnailUrl?: string | null;
  estPartenaire?: boolean;
  bonusPointsHeure?: number;
}

interface ReponseStreams {
  streams: Stream[];
}

// ─── Requêtes ────────────────────────────────────────────────────────────────

export async function listerStreams(): Promise<Stream[]> {
  const reponse = await requeteApi<ReponseStreams>("/streams");
  return reponse.streams;
}

/** Retourne l'image contractuelle ou la miniature publique Twitch dérivable. */
export function miniatureStream(stream: Stream): string | null {
  if (stream.thumbnailUrl) return stream.thumbnailUrl;
  if (stream.plateforme !== "TWITCH" || !stream.identifiantChaine.trim()) return null;
  const chaine = encodeURIComponent(stream.identifiantChaine.trim());
  return `https://static-cdn.jtvnw.net/previews-ttv/live_user/${chaine}-640x360.jpg`;
}

// ─── Libellés d'affichage ────────────────────────────────────────────────────

export const libellesPlateforme: Record<Plateforme, string> = {
  TWITCH: "Twitch",
  YOUTUBE: "YouTube",
  FACEBOOK: "Facebook",
};

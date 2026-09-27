/**
 * Accès HTTP à l'API depuis l'extension.
 *
 * Différence essentielle avec le client du site (frontend/src/lib/api.ts) :
 * l'extension n'a pas le cookie de session, elle présente le jeton
 * d'appariement en `Authorization: Bearer`. Les requêtes partent donc
 * sans `credentials`, pour ne jamais joindre par mégarde une session web
 * qui traînerait dans le profil du navigateur : les deux credentials
 * restent cloisonnés (contexte sécurité agentic, « Cloisonnement des
 * credentials »).
 */

import { URL_API } from "./config";

// ─── Erreurs ─────────────────────────────────────────────────────────────────

export class ErreurApi extends Error {
  readonly statut: number;

  constructor(message: string, statut: number) {
    super(message);
    this.name = "ErreurApi";
    this.statut = statut;
  }
}

interface CorpsErreurNest {
  message?: string | string[];
}

async function messageDErreur(reponse: Response): Promise<string> {
  try {
    const corps = (await reponse.json()) as CorpsErreurNest;
    if (Array.isArray(corps.message) && corps.message.length > 0) {
      return corps.message.join(" ");
    }
    if (typeof corps.message === "string" && corps.message.length > 0) {
      return corps.message;
    }
  } catch {
    // Réponse sans corps JSON exploitable : message générique.
  }
  return "Une erreur est survenue. Merci de réessayer.";
}

// ─── Requêtes ────────────────────────────────────────────────────────────────

export interface OptionsRequete {
  methode: "GET" | "POST";
  corps?: unknown;
  /** Jeton d'appariement de l'extension, absent sur les routes publiques. */
  jeton?: string | null;
}

/**
 * Appelle l'API et renvoie le corps JSON, ou lève une `ErreurApi`
 * portant le statut HTTP, dont dépend l'orchestration des sessions.
 */
export async function requeteApi<T>(
  chemin: string,
  { methode, corps, jeton }: OptionsRequete,
): Promise<T> {
  const entetes: Record<string, string> = { Accept: "application/json" };
  if (corps !== undefined) {
    entetes["Content-Type"] = "application/json";
  }
  if (jeton) {
    entetes["Authorization"] = `Bearer ${jeton}`;
  }

  let reponse: Response;
  try {
    reponse = await fetch(`${URL_API}${chemin}`, {
      method: methode,
      headers: entetes,
      body: corps === undefined ? undefined : JSON.stringify(corps),
      credentials: "omit",
    });
  } catch {
    throw new ErreurApi("Impossible de joindre le serveur.", 0);
  }

  if (!reponse.ok) {
    throw new ErreurApi(await messageDErreur(reponse), reponse.status);
  }
  if (reponse.status === 204) {
    return undefined as T;
  }
  return (await reponse.json()) as T;
}

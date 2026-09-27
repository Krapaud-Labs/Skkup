// Accès HTTP à l'API backend : URL de base et normalisation des erreurs.
// Le contrat des endpoints est décrit dans le backend et le contexte agentic.

// ─── URL de base ─────────────────────────────────────────────────────────────

// Le navigateur appelle l'API directement (domaine distinct du frontend en
// production, port 3001 en développement via docker-compose.override.yml),
// d'où une variable NEXT_PUBLIC_* lue côté client.
export const URL_API =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

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

// NestJS renvoie soit un message unique (exceptions métier), soit un
// tableau de messages (erreurs de validation class-validator).
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
    // Réponse sans corps JSON exploitable : on retombe sur le message générique.
  }
  return "Une erreur est survenue. Merci de réessayer.";
}

// ─── Requêtes ────────────────────────────────────────────────────────────────

/**
 * Appelle l'API et renvoie le corps JSON désérialisé, ou lève une
 * ErreurApi portant le message renvoyé par le backend.
 */
export async function requeteApi<T>(
  chemin: string,
  options: RequestInit = {},
): Promise<T> {
  let reponse: Response;
  try {
    reponse = await fetch(`${URL_API}${chemin}`, options);
  } catch {
    throw new ErreurApi(
      "Impossible de joindre le serveur. Vérifie ta connexion.",
      0,
    );
  }

  if (!reponse.ok) {
    throw new ErreurApi(await messageDErreur(reponse), reponse.status);
  }

  // Certains endpoints (clôture de session, par exemple) répondent sans corps.
  if (reponse.status === 204) {
    return undefined as T;
  }

  return (await reponse.json()) as T;
}

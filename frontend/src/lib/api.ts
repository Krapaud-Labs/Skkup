// Accès HTTP à l'API backend : URL de base et normalisation des erreurs.
// Le contrat des endpoints est décrit dans docs/04-api-contract.md.

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

/**
 * Transforme une erreur de transport ou d’API en libellé d’interface.
 * Les messages métier du backend ne sont pas affichés tels quels : ils ne
 * portent pas encore la langue choisie par le visiteur.
 */
export function messageErreurInterface(
  exception: unknown,
  langue: "fr" | "en",
  messageParDefaut: string,
): string {
  if (!(exception instanceof ErreurApi)) {
    return messageParDefaut;
  }

  const anglais = langue === "en";
  switch (exception.statut) {
    case 0:
      return anglais ? "Unable to reach the server. Check your connection and try again." : "Impossible de joindre le serveur. Vérifie ta connexion puis réessaie.";
    case 400:
      return anglais ? "Some information is invalid. Check the form and try again." : "Certaines informations sont invalides. Vérifie le formulaire puis réessaie.";
    case 401:
      return anglais ? "Your session has expired. Please sign in again." : "Ta session a expiré. Connecte-toi de nouveau.";
    case 403:
      return anglais ? "You do not have permission to perform this action." : "Tu n’as pas l’autorisation d’effectuer cette action.";
    case 404:
      return anglais ? "The requested resource could not be found." : "La ressource demandée est introuvable.";
    case 409:
      return anglais ? "This action conflicts with the current state. Refresh and try again." : "Cette action entre en conflit avec l’état actuel. Actualise puis réessaie.";
    case 429:
      return anglais ? "Too many requests. Please try again later." : "Trop de demandes. Réessaie plus tard.";
    default:
      return exception.statut >= 500
        ? anglais ? "The service is temporarily unavailable. Please try again later." : "Le service est temporairement indisponible. Réessaie plus tard."
        : messageParDefaut;
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

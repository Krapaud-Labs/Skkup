import { fetchAuthentifie } from "./auth";

/**
 * Association de l'extension navigateur au compte.
 *
 * Le site n'a qu'une moitié du flux : il génère un code à usage unique
 * depuis la session web (cookie), l'utilisateur le recopie dans
 * l'extension, et c'est l'extension qui l'échange contre son propre
 * jeton (`POST /extension/pair`, appelé depuis l'extension et jamais
 * depuis cette page). Le jeton de l'extension n'existe donc à aucun
 * moment dans l'origine du site.
 *
 * Contrat : docs/04-api-contract.md, section Extension navigateur.
 */

// ─── Types du contrat ────────────────────────────────────────────────────────

export interface CodeAppariement {
  code: string;
  /** Fin de validité, en ISO 8601 (5 minutes après la génération). */
  expireAt: string;
}

// ─── Requêtes ────────────────────────────────────────────────────────────────

/**
 * Génère un code d'association. Le précédent code non consommé est
 * invalidé par le serveur : il n'y en a jamais deux valables à la fois.
 */
export function genererCodeAppariement(): Promise<CodeAppariement> {
  return fetchAuthentifie<CodeAppariement>("/extension/pairing-token", {
    method: "POST",
  });
}

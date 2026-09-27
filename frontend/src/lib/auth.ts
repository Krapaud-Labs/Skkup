import { requeteApi } from "./api";
import type { Profil } from "./dashboard";

/**
 * Authentification email/mot de passe : appels à /auth/*.
 *
 * La session est portée par un cookie `httpOnly` posé par le backend à la
 * réponse de /auth/login et /auth/register : le jeton n'est jamais exposé
 * au JavaScript de la page, et le client n'a donc rien à stocker ni à
 * relire. La seule contrainte côté frontend est d'émettre les requêtes
 * avec `credentials: "include"`, sans quoi le cookie ne part pas et le
 * backend répond 401.
 *
 * Contrat : backend et .codex/DOCUMENTATION-SOURCE-MAP.md, authentification.
 */

// ─── Types du contrat ────────────────────────────────────────────────────────

export interface IdentifiantsConnexion {
  email: string;
  motDePasse: string;
}

export interface IdentifiantsInscription extends IdentifiantsConnexion {
  pseudo: string;
}

/** Corps renvoyé par /auth/login et /auth/register : jamais de jeton. */
export interface ReponseAuth {
  pseudo: string;
}

export interface ReponseSession {
  authentifie: boolean;
  profil: Profil | null;
}

export interface ChangementMotDePasse {
  ancienMotDePasse: string;
  nouveauMotDePasse: string;
}

// ─── Requêtes authentifiées ──────────────────────────────────────────────────

/**
 * Même signature que requeteApi, en joignant le cookie de session.
 *
 * `credentials: "include"` n'est pas activé globalement dans requeteApi :
 * les endpoints publics (catalogue de streams, tirages) n'ont aucune
 * raison de recevoir la session. Passer par ce point d'entrée unique
 * évite d'oublier l'option là où elle est indispensable.
 */
export function fetchAuthentifie<T>(
  chemin: string,
  options: RequestInit = {},
): Promise<T> {
  return requeteApi<T>(chemin, { ...options, credentials: "include" });
}

// ─── Endpoints d'authentification ────────────────────────────────────────────

function authentifier(
  chemin: "/auth/login" | "/auth/register",
  identifiants: IdentifiantsConnexion | IdentifiantsInscription,
): Promise<ReponseAuth> {
  return fetchAuthentifie<ReponseAuth>(chemin, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(identifiants),
  });
}

export function connexion(
  identifiants: IdentifiantsConnexion,
): Promise<ReponseAuth> {
  return authentifier("/auth/login", identifiants);
}

export function inscription(
  identifiants: IdentifiantsInscription,
): Promise<ReponseAuth> {
  return authentifier("/auth/register", identifiants);
}

/** État de session anonyme ou authentifiée, sans réponse 401 pour l'anonyme. */
export function recupererSession(): Promise<ReponseSession> {
  return fetchAuthentifie<ReponseSession>("/auth/session");
}

/** Change le mot de passe et révoque les accès existants côté serveur. */
export function changerMotDePasse(
  donnees: ChangementMotDePasse,
): Promise<void> {
  return fetchAuthentifie<void>('/auth/password', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(donnees),
  });
}

/**
 * Efface le cookie de session côté serveur : un cookie `httpOnly` ne peut
 * pas être supprimé par le script de la page. L'appel réussit toujours,
 * même si la session est déjà expirée.
 */
export function deconnexion(): Promise<void> {
  return fetchAuthentifie<void>("/auth/logout", { method: "POST" });
}

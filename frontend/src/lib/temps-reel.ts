import { io, type Socket } from "socket.io-client";
import { URL_API } from "./api";

/**
 * Client de la Gateway temps réel (Socket.io), room privée de
 * l'utilisateur authentifié. Contrat : docs/04-api-contract.md, section
 * "Temps réel (WebSocket)".
 *
 * Le temps réel est un confort, jamais une dépendance bloquante : une
 * connexion absente ou coupée ne doit jamais empêcher l'affichage des
 * données déjà chargées par REST, seulement priver l'utilisateur des
 * mises à jour en direct.
 */

// ─── Événements de la room privée ────────────────────────────────────────────

export const EVENEMENT_POINTS_MIS_A_JOUR = "points:updated";
export const EVENEMENT_STREAK_MIS_A_JOUR = "streak:updated";
export const EVENEMENT_CARTE_DEBLOQUEE = "scratch-card:unlocked";

export interface EvenementPointsMisAJour {
  soldePoints: number;
  montant: number;
  type: string;
}

export interface EvenementStreakMisAJour {
  streakActuel: number;
  streakMax: number;
}

export interface EvenementCarteDebloquee {
  carteId: string;
  streakPalier: number;
}

// ─── Connexion ───────────────────────────────────────────────────────────────

/**
 * Ouvre la connexion à la Gateway. Le cookie de session httpOnly est
 * joint à la poignée de main via `withCredentials` (comme
 * `fetchAuthentifie` côté REST) : le client n'a ni jeton à lire, ni room
 * à choisir, celle-ci est dérivée du JWT côté serveur.
 */
export function connecterTempsReel(): Socket {
  return io(URL_API, { withCredentials: true });
}

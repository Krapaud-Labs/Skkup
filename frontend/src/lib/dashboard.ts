import { fetchAuthentifie } from "./auth";

/**
 * Données du tableau de bord viewer : profil, historique de points,
 * cartes à gratter et tickets de tirage. Contrat : docs/04-api-contract.md.
 */

// ─── Types du contrat ────────────────────────────────────────────────────────

export interface Profil {
  id: string;
  email: string;
  pseudo: string;
  soldePoints: number;
  streakActuel: number;
  streakMax: number;
  derniereVisiteAt: string | null;
  createdAt: string;
  role?: "VIEWER" | "ADMIN";
}

export type TypeTransactionPoints =
  | "VISITE_QUOTIDIENNE"
  | "WATCH_TIME"
  | "CARTE_A_GRATTER"
  | "AJUSTEMENT_ADMIN";

export interface TransactionPoints {
  id: string;
  userId: string;
  type: TypeTransactionPoints;
  montant: number;
  createdAt: string;
}

interface ReponsePaginee {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface HistoriquePoints extends ReponsePaginee {
  transactions: TransactionPoints[];
}

export type StatutTirage = "OUVERT" | "CLOTURE" | "TIRE";

export interface TicketTirage {
  ticketId: string;
  raffleId: string;
  raffleTitre: string;
  raffleStatut: StatutTirage;
  obtenuLe: string;
  gagnant: boolean;
  lot: { id: string; nom: string } | null;
}

export interface TicketsTirage extends ReponsePaginee {
  tickets: TicketTirage[];
}

export interface CarteAGratter {
  id: string;
  userId: string;
  streakPalier: number;
  grattee: boolean;
  gainType: string | null;
  gainMontant: number | null;
  createdAt: string;
  gratteeAt: string | null;
}

// ─── Requêtes ────────────────────────────────────────────────────────────────

export function recupererProfil(): Promise<Profil> {
  return fetchAuthentifie<Profil>("/me");
}

export function recupererHistoriquePoints(
  page = 1,
  limit = 10,
): Promise<HistoriquePoints> {
  return fetchAuthentifie<HistoriquePoints>(
    `/me/points/history?page=${page}&limit=${limit}`,
  );
}

export function recupererTicketsTirage(
  page = 1,
  limit = 10,
): Promise<TicketsTirage> {
  return fetchAuthentifie<TicketsTirage>(
    `/me/raffle-tickets?page=${page}&limit=${limit}`,
  );
}

export function recupererCartesAGratter(): Promise<CarteAGratter[]> {
  return fetchAuthentifie<CarteAGratter[]>("/me/scratch-cards");
}

// ─── Libellés d'affichage ────────────────────────────────────────────────────

export const libellesTypeTransaction: Record<TypeTransactionPoints, string> = {
  VISITE_QUOTIDIENNE: "Visite quotidienne",
  WATCH_TIME: "Temps de visionnage",
  CARTE_A_GRATTER: "Carte à gratter",
  AJUSTEMENT_ADMIN: "Ajustement",
};

export const libellesStatutTirage: Record<StatutTirage, string> = {
  OUVERT: "En cours",
  CLOTURE: "Clôturé",
  TIRE: "Résultat publié",
};

/**
 * Paliers de streak débloquant une carte à gratter, alignés sur
 * `PALIERS_STREAK_CARTE_A_GRATTER` côté backend
 * (backend/src/me/me.service.ts) : valeurs provisoires côté serveur, à
 * ajuster ici en même temps si elles changent, faute d'endpoint qui les
 * expose.
 */
const PALIERS_STREAK = [1, 3, 7, 14, 30];

/** Prochain palier de streak à atteindre, pour la barre de progression. */
export function prochainPalierStreak(streakActuel: number): number {
  const prochain = PALIERS_STREAK.find((palier) => palier > streakActuel);
  return prochain ?? Math.max(streakActuel, PALIERS_STREAK[PALIERS_STREAK.length - 1]);
}

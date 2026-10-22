import { fetchAuthentifie } from "./auth";
import { requeteApi } from "./api";

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

export interface ResumeRecompenses {
  profil: Pick<Profil, "id" | "pseudo" | "soldePoints" | "streakActuel" | "streakMax">;
  cartes: CarteAGratter[];
  transactions: TransactionPoints[];
  tickets: TicketTirage[];
  limite: number;
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

export interface AnnoncePublique {
  id: string;
  titre: string;
  texte: string;
  debutAt: string | null;
  finAt: string | null;
}

/** Contrat minimal renvoyé au viewer par GET /viewer/announcements. */
export type AnnonceViewer = Pick<AnnoncePublique, "id" | "titre" | "texte">;

export interface TiragePublic {
  id: string;
  titre: string;
  description: string;
  dateOuverture: string;
  dateTirage: string;
  statut: StatutTirage;
  lots: Array<{ id: string; nom: string; valeurEstimee: string; quantite: number; fournisseur: string; imageUrl?: string | null }>;
  ticketsDistribues: number;
}

export interface ResumeDashboard {
  profil: Pick<Profil, "id" | "pseudo" | "soldePoints" | "streakActuel" | "streakMax" | "derniereVisiteAt">;
  visionnage: { secondesValidees: number; sessions: number };
  activite: { ticketsTirage: number; cartesAGratterDisponibles: number };
  transactionsRecentes: Array<{
    id: string;
    type: TypeTransactionPoints;
    montant: number;
    createdAt: string;
    session: { platform: string; streamExternalId: string; dureeValideeSecondes: number } | null;
  }>;
}

export interface SessionVisionnageHistorique {
  id: string;
  createdAt: string;
  platform: string;
  streamExternalId: string;
  dureeValideeSecondes: number;
  points: number;
}

/**
 * Extrait uniquement les sessions réellement liées aux transactions du
 * résumé dashboard. Le contrat ne fournit pas d'historique de sessions
 * paginé : l'interface doit donc rendre cette limite explicitement.
 */
export function sessionsDepuisResume(
  resume: ResumeDashboard | null,
): SessionVisionnageHistorique[] {
  if (!resume) return [];
  return resume.transactionsRecentes
    .filter((transaction) => transaction.session !== null)
    .map((transaction) => ({
      id: transaction.id,
      createdAt: transaction.createdAt,
      platform: transaction.session!.platform,
      streamExternalId: transaction.session!.streamExternalId,
      dureeValideeSecondes: transaction.session!.dureeValideeSecondes,
      points: transaction.montant,
    }));
}

// ─── Requêtes ────────────────────────────────────────────────────────────────

export function recupererProfil(): Promise<Profil> {
  return fetchAuthentifie<Profil>("/me");
}

export function recupererResumeDashboard(): Promise<ResumeDashboard> {
  return fetchAuthentifie<ResumeDashboard>("/me/dashboard/summary");
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

export function recupererResumeRecompenses(limit = 6): Promise<ResumeRecompenses> {
  return fetchAuthentifie<ResumeRecompenses>(
    `/me/rewards-summary?limit=${limit}`,
  );
}

export function recupererCartesAGratter(): Promise<CarteAGratter[]> {
  return fetchAuthentifie<CarteAGratter[]>("/me/scratch-cards");
}

export function gratterCarte(cardId: string): Promise<{ carte: CarteAGratter; ticketCree: boolean }> {
  return fetchAuthentifie(`/me/scratch-cards/${encodeURIComponent(cardId)}/scratch`, { method: "POST" });
}

export function enregistrerVisiteQuotidienne(): Promise<{ streakActuel: number; streakMax: number; soldePoints: number; pointsCredites: number; carteDebloquee: CarteAGratter | null }> {
  return fetchAuthentifie("/me/daily-checkin", { method: "POST" });
}

export function recupererAnnoncesViewer(): Promise<AnnonceViewer[]> {
  return fetchAuthentifie<AnnonceViewer[]>("/viewer/announcements");
}

export function recupererAnnoncesActives(): Promise<AnnoncePublique[]> {
  return requeteApi<AnnoncePublique[]>("/announcements/active");
}

export function recupererTiragesPublics(): Promise<TiragePublic[]> {
  return requeteApi<TiragePublic[]>("/raffles");
}

export function inscrireTirage(raffleId: string): Promise<{ ticketId: string; raffleId: string }> {
  return fetchAuthentifie(`/me/raffles/${encodeURIComponent(raffleId)}/register`, { method: "POST" });
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
 * (backend/src/me/me.service.ts). Les tickets des dizaines sont des
 * récompenses de carte après le palier 30 et ne changent pas la progression
 * de la barre.
 */
const PALIERS_STREAK = [3, 7, 14, 30, 40];

/** Prochain palier de streak à atteindre, pour la barre de progression. */
export function prochainPalierStreak(streakActuel: number): number {
  const prochain = PALIERS_STREAK.find((palier) => palier > streakActuel);
  return prochain ?? Math.max(streakActuel, PALIERS_STREAK[PALIERS_STREAK.length - 1]);
}

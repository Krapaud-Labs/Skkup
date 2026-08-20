import { requeteApi } from "@/lib/api";

export type StatutTirage = "OUVERT" | "CLOTURE" | "TIRE";

export interface LotTirage {
  id: string;
  nom: string;
  valeurEstimee: number | null;
  quantite: number;
  fournisseur: string | null;
}

export interface Tirage {
  id: string;
  titre: string;
  description: string | null;
  dateOuverture: string;
  dateTirage: string;
  statut: StatutTirage;
  resultatPublieAt: string | null;
  lots: LotTirage[];
  ticketsDistribues: number;
}

export interface ResultatTirage {
  id: string;
  gagnants: Array<{
    lotId: string;
    lotNom: string;
    ticketId: string;
    pseudo: string;
  }>;
}

export function listerTirages(): Promise<Tirage[]> {
  return requeteApi<Tirage[]>("/raffles");
}

export function recupererResultat(id: string): Promise<ResultatTirage> {
  return requeteApi<ResultatTirage>(`/raffles/${encodeURIComponent(id)}/result`);
}

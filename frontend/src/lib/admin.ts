import { fetchAuthentifie } from "./auth";

export interface SponsorAdmin {
  id: string;
  nom: string;
  logoUrl: string | null;
  actif: boolean;
  _count: { lots: number };
}

export type StatutSignalement = "OUVERTE" | "EXAMINEE" | "IGNOREE";

export interface SignalementAdmin {
  id: string;
  type: string;
  details: string;
  statut: StatutSignalement;
  createdAt: string;
  user: { id: string; pseudo: string; email: string };
  watchSession: {
    id: string;
    platform: string;
    streamExternalId: string;
    statut: string;
  } | null;
}

export function listerSponsors(): Promise<SponsorAdmin[]> {
  return fetchAuthentifie<SponsorAdmin[]>("/admin/sponsors");
}

export function creerSponsor(nom: string, logoUrl?: string): Promise<SponsorAdmin> {
  return fetchAuthentifie<SponsorAdmin>("/admin/sponsors", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nom, ...(logoUrl ? { logoUrl } : {}) }),
  });
}

export function listerSignalements(): Promise<SignalementAdmin[]> {
  return fetchAuthentifie<SignalementAdmin[]>("/admin/fraud/flags");
}

export function modifierSignalement(
  id: string,
  statut: StatutSignalement,
): Promise<SignalementAdmin> {
  return fetchAuthentifie<SignalementAdmin>(`/admin/fraud/flags/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ statut }),
  });
}

export interface TirageAdminInput {
  titre: string;
  description: string;
  dateOuverture: string;
  dateTirage: string;
  engagementGraine: string;
  lots: Array<{
    nom: string;
    valeurEstimee: string;
    quantite: number;
    fournisseur: string;
  }>;
}

export function creerAnnonce(titre: string, texte: string) {
  return fetchAuthentifie("/admin/announcements", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ titre, texte }),
  });
}

export function creerTirage(dto: TirageAdminInput) {
  return fetchAuthentifie("/admin/raffles", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  });
}

export function configurerRecompenseStream(
  id: string,
  estPartenaire: boolean,
  bonusPointsHeure: number,
) {
  return fetchAuthentifie(`/streams/admin/${encodeURIComponent(id)}/reward`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ estPartenaire, bonusPointsHeure }),
  });
}

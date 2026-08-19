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

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

export interface AnnonceAdmin {
  id: string;
  titre: string;
  texte: string;
  actif: boolean;
  debutAt: string | null;
  finAt: string | null;
  createdAt: string;
}

export function listerAnnonces(): Promise<AnnonceAdmin[]> {
  return fetchAuthentifie<AnnonceAdmin[]>("/admin/announcements");
}

export function modifierAnnonce(id: string, data: Partial<Pick<AnnonceAdmin, "titre" | "texte" | "actif">>) {
  return fetchAuthentifie<AnnonceAdmin>(`/admin/announcements/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export function archiverAnnonce(id: string) {
  return fetchAuthentifie<AnnonceAdmin>(`/admin/announcements/${encodeURIComponent(id)}`, { method: "DELETE" });
}

export interface EvenementAnnonceAdmin {
  id: string;
  action: string;
  metadata: Record<string, unknown>;
  actorId: string;
  createdAt: string;
}

export function historiqueAnnonce(id: string): Promise<EvenementAnnonceAdmin[]> {
  return fetchAuthentifie<EvenementAnnonceAdmin[]>(`/admin/announcements/${encodeURIComponent(id)}/history`);
}

export function restaurerAnnonce(id: string, eventId: string) {
  return fetchAuthentifie<AnnonceAdmin>(`/admin/announcements/${encodeURIComponent(id)}/restore/${encodeURIComponent(eventId)}`, { method: "POST" });
}

export function creerTirage(dto: TirageAdminInput) {
  return fetchAuthentifie("/admin/raffles", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  });
}

export interface TirageAdmin {
  id: string;
  titre: string;
  description: string;
  dateOuverture: string;
  dateTirage: string;
  statut: string;
  lots: Array<{ id: string; nom: string; valeurEstimee: string; quantite: number; fournisseur: string }>;
  audits: Array<{ id: string; executedAt: string; resultHash: string; seedCommitment: string }>;
  _count: { tickets: number; winners: number };
}

export function listerTiragesAdmin(): Promise<TirageAdmin[]> {
  return fetchAuthentifie<TirageAdmin[]>("/admin/raffles");
}

export function historiqueTirage(id: string) {
  return fetchAuthentifie<Array<{ id: string; adminUserId: string; executedAt: string; resultHash: string; seedCommitment: string }>>(`/admin/raffles/${encodeURIComponent(id)}/history`);
}

export function modifierTirage(id: string, data: Partial<Pick<TirageAdmin, "titre" | "description" | "dateTirage" | "lots">>) {
  return fetchAuthentifie<TirageAdmin>(`/admin/raffles/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
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

export type TypeContenuAdmin = "LANDING" | "LEGAL" | "ANNOUNCEMENT" | "FAQ" | "MEDIA";
export interface ContenuAdmin {
  id: string;
  slug: string;
  type: TypeContenuAdmin;
  locale: "fr" | "en";
  status: "DRAFT" | "PUBLISHED";
  data: Record<string, unknown>;
  version: number;
  publishedAt: string | null;
}

export function listerContenus(): Promise<ContenuAdmin[]> {
  return fetchAuthentifie<ContenuAdmin[]>("/admin/content");
}

export function creerContenu(dto: Pick<ContenuAdmin, "slug" | "type" | "locale"> & { data: Record<string, unknown> }): Promise<ContenuAdmin> {
  return fetchAuthentifie<ContenuAdmin>("/admin/content", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(dto) });
}

export function modifierContenu(id: string, data: Record<string, unknown>): Promise<ContenuAdmin> {
  return fetchAuthentifie<ContenuAdmin>(`/admin/content/${encodeURIComponent(id)}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ data }) });
}

export function publierContenu(id: string): Promise<ContenuAdmin> {
  return fetchAuthentifie<ContenuAdmin>(`/admin/content/${encodeURIComponent(id)}/publish`, { method: "POST" });
}

export function depublierContenu(id: string): Promise<ContenuAdmin> {
  return fetchAuthentifie<ContenuAdmin>(`/admin/content/${encodeURIComponent(id)}/unpublish`, { method: "POST" });
}

export interface VersionContenuAdmin {
  id: string;
  version: number;
  data: Record<string, unknown>;
  status: "DRAFT" | "PUBLISHED";
  createdById: string;
  createdAt: string;
}

export function listerVersionsContenu(id: string): Promise<VersionContenuAdmin[]> {
  return fetchAuthentifie<VersionContenuAdmin[]>(`/admin/content/${encodeURIComponent(id)}/versions`);
}

export function restaurerVersionContenu(id: string, versionId: string): Promise<ContenuAdmin> {
  return fetchAuthentifie<ContenuAdmin>(`/admin/content/${encodeURIComponent(id)}/restore/${encodeURIComponent(versionId)}`, { method: "POST" });
}

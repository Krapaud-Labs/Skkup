"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ErreurApi } from "@/lib/api";
import {
  creerSponsor,
  creerAnnonce,
  archiverAnnonce,
  historiqueAnnonce,
  restaurerAnnonce,
  listerTiragesAdmin,
  historiqueTirage,
  executerTirage,
  modifierTirage,
  creerTirage,
  configurerRecompenseStream,
  listerSignalements,
  listerSponsors,
  listerAnnonces,
  listerAuditContenu,
  modifierAnnonce,
  modifierSignalement,
  listerLotsAdmin,
  creerLotAdmin,
  modifierLotAdmin,
  supprimerLotAdmin,
  listerUtilisateursAdmin,
  modifierStatutUtilisateurAdmin,
  type SignalementAdmin,
  type SponsorAdmin,
  type StatutSignalement,
  type AnnonceAdmin,
  type TirageAdmin,
  type AuditContenuAdmin,
  type LotAdmin,
  type UtilisateurAdmin,
} from "@/lib/admin";
import { recupererProfil, type Profil } from "@/lib/dashboard";
import { listerStreams, type Stream } from "@/lib/streams";
import { GestionContenu } from "@/components/admin/GestionContenu";
import { NavigationAdmin } from "@/components/admin/NavigationAdmin";
import { SkkupIcon } from "@/components/ui/SkkupIcon";

const statuts: StatutSignalement[] = ["OUVERTE", "EXAMINEE", "IGNOREE"];

function afficherDiffAnnonce(metadata: Record<string, unknown>) {
  const previous = metadata.previous;
  const current = metadata.current;
  if (!previous || !current) return null;
  return <details className="text-xs text-foreground-muted"><summary>Voir le diff</summary><pre className="mt-1 max-w-full overflow-auto whitespace-pre-wrap">{JSON.stringify({ avant: previous, après: current }, null, 2)}</pre></details>;
}

export default function PageAdministration() {
  const router = useRouter();
  const [profil, setProfil] = useState<Profil | null>(null);
  const [sponsors, setSponsors] = useState<SponsorAdmin[]>([]);
  const [signalements, setSignalements] = useState<SignalementAdmin[]>([]);
  const [streams, setStreams] = useState<Stream[]>([]);
  const [annonces, setAnnonces] = useState<AnnonceAdmin[]>([]);
  const [annonceEnEdition, setAnnonceEnEdition] = useState<string | null>(null);
  const [historiquesAnnonces, setHistoriquesAnnonces] = useState<Record<string, Array<{ id: string; action: string; createdAt: string; metadata: Record<string, unknown> }>>>({});
  const [tirages, setTirages] = useState<TirageAdmin[]>([]);
  const [journalAudit, setJournalAudit] = useState<AuditContenuAdmin[]>([]);
  const [filtreAuditAction, setFiltreAuditAction] = useState("");
  const [filtreAuditType, setFiltreAuditType] = useState("");
  const [lotsAdmin, setLotsAdmin] = useState<LotAdmin[]>([]);
  const [utilisateursAdmin, setUtilisateursAdmin] = useState<UtilisateurAdmin[]>([]);
  const [chargementLots, setChargementLots] = useState(true);
  const [chargementUtilisateurs, setChargementUtilisateurs] = useState(true);
  const [erreurLots, setErreurLots] = useState<string | null>(null);
  const [erreurUtilisateurs, setErreurUtilisateurs] = useState<string | null>(null);
  const [lotEnEdition, setLotEnEdition] = useState<string | null>(null);
  const [rechercheUtilisateurs, setRechercheUtilisateurs] = useState("");
  const [nouveauLot, setNouveauLot] = useState({ raffleId: "", nom: "", valeurEstimee: "", quantite: 1, fournisseur: "" });
  const [tirageEnEdition, setTirageEnEdition] = useState<string | null>(null);
  const [tirageEnExecution, setTirageEnExecution] = useState<string | null>(null);
  const [tiragePrepare, setTiragePrepare] = useState<string | null>(null);
  const [graineExploitant, setGraineExploitant] = useState("");
  const [entropiePublique, setEntropiePublique] = useState("");
  const [historiquesTirages, setHistoriquesTirages] = useState<Record<string, Array<{ id: string; adminUserId: string; executedAt: string; resultHash: string; seedCommitment: string }>>>({});
  const [nomSponsor, setNomSponsor] = useState("");
  const [logoSponsor, setLogoSponsor] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<string | null>(null);
  const [titreAnnonce, setTitreAnnonce] = useState("");
  const [texteAnnonce, setTexteAnnonce] = useState("");
  const [titreTirage, setTitreTirage] = useState("");
  const [descriptionTirage, setDescriptionTirage] = useState("");
  const [dateTirage, setDateTirage] = useState("");
  const [nomLot, setNomLot] = useState("");
  const [valeurLot, setValeurLot] = useState("");
  const [fournisseurLot, setFournisseurLot] = useState("");
  const [engagementGraine, setEngagementGraine] = useState("");
  const [rechercheAdmin, setRechercheAdmin] = useState("");
  const [filtreAnnonces, setFiltreAnnonces] = useState<"TOUTES" | "ACTIVES" | "ARCHIVEES">("TOUTES");
  const [filtreTirages, setFiltreTirages] = useState<"TOUS" | "OUVERT" | "TIRE" | "ANNULE">("TOUS");
  const [pageAnnonces, setPageAnnonces] = useState(1);
  const [pageTirages, setPageTirages] = useState(1);
  const [cleChargement, setCleChargement] = useState(0);
  const verrouAction = useRef<string | null>(null);
  const taillePage = 10;

  function reinitialiserFiltres() {
    setRechercheAdmin("");
    setFiltreAnnonces("TOUTES");
    setFiltreTirages("TOUS");
    setPageAnnonces(1);
    setPageTirages(1);
  }

  useEffect(() => {
    let annule = false;

    async function chargerAdministration() {
      setErreur(null);
      try {
        const profilRecu = await recupererProfil();
        if (profilRecu.role !== "ADMIN") {
          router.replace("/dashboard");
          return;
        }

        const resultats = await Promise.allSettled([
            listerSponsors(),
            listerSignalements(),
            listerStreams(),
            listerAnnonces(),
            listerTiragesAdmin(),
            listerAuditContenu(),
            listerLotsAdmin(),
            listerUtilisateursAdmin(),
          ]);

        if (annule) return;
        setProfil(profilRecu);
        if (resultats[0].status === "fulfilled") setSponsors(resultats[0].value);
        if (resultats[1].status === "fulfilled") setSignalements(resultats[1].value);
        if (resultats[2].status === "fulfilled") setStreams(resultats[2].value);
        if (resultats[3].status === "fulfilled") setAnnonces(resultats[3].value);
        if (resultats[4].status === "fulfilled") setTirages(resultats[4].value);
        if (resultats[5].status === "fulfilled") setJournalAudit(resultats[5].value);
        if (resultats[6].status === "fulfilled") { setLotsAdmin(resultats[6].value); setErreurLots(null); } else setErreurLots("Impossible de charger les lots.");
        if (resultats[7].status === "fulfilled") { setUtilisateursAdmin(resultats[7].value); setErreurUtilisateurs(null); } else setErreurUtilisateurs("Impossible de charger les utilisateurs.");
        setChargementLots(false);
        setChargementUtilisateurs(false);
        if (resultats.some((resultat) => resultat.status === "rejected")) {
          setErreur("Certains modules sont temporairement indisponibles. Les données disponibles restent consultables.");
        }
      } catch (exception: unknown) {
        if (annule) return;
        if (exception instanceof ErreurApi && exception.statut === 401) {
          router.replace("/connexion");
          return;
        }
        setErreur(
          exception instanceof ErreurApi
            ? exception.message
            : "Impossible de charger le back-office.",
        );
      }
    }

    void chargerAdministration();
    return () => {
      annule = true;
    };
  }, [router, cleChargement]);

  useEffect(() => {
    let annule = false;
    void listerAuditContenu({ action: filtreAuditAction || undefined, entityType: filtreAuditType || undefined })
      .then((events) => { if (!annule) setJournalAudit(events); })
      .catch(() => { /* Le chargement global conserve le dernier état confirmé. */ })
    return () => { annule = true; };
  }, [filtreAuditAction, filtreAuditType]);

  async function rechargerLots() {
    setChargementLots(true); setErreurLots(null);
    try { setLotsAdmin(await listerLotsAdmin()); }
    catch (exception) { setErreurLots(exception instanceof ErreurApi ? exception.message : "Impossible de charger les lots."); }
    finally { setChargementLots(false); }
  }

  async function rechargerUtilisateurs() {
    setChargementUtilisateurs(true); setErreurUtilisateurs(null);
    try { setUtilisateursAdmin(await listerUtilisateursAdmin(rechercheUtilisateurs)); }
    catch (exception) { setErreurUtilisateurs(exception instanceof ErreurApi ? exception.message : "Impossible de charger les utilisateurs."); }
    finally { setChargementUtilisateurs(false); }
  }

  async function soumettreLot(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (verrouAction.current || !nouveauLot.raffleId) return;
    verrouAction.current = "lot:create"; setErreur(null);
    try {
      const lot = await creerLotAdmin(nouveauLot);
      setLotsAdmin((anciens) => [lot, ...anciens]);
      setNouveauLot({ raffleId: nouveauLot.raffleId, nom: "", valeurEstimee: "", quantite: 1, fournisseur: "" });
      setConfirmation("Lot créé.");
    } catch (exception) { setErreur(exception instanceof ErreurApi ? exception.message : "Création du lot impossible."); }
    finally { verrouAction.current = null; }
  }

  async function enregistrerLot(lot: LotAdmin) {
    if (verrouAction.current) return;
    verrouAction.current = `lot:${lot.id}`;
    try {
      const modifie = await modifierLotAdmin(lot.id, { nom: lot.nom, valeurEstimee: lot.valeurEstimee, quantite: lot.quantite, fournisseur: lot.fournisseur, ...(lot.sponsorId ? { sponsorId: lot.sponsorId } : {}) });
      setLotsAdmin((anciens) => anciens.map((item) => item.id === modifie.id ? modifie : item)); setLotEnEdition(null); setConfirmation("Lot mis à jour.");
    } catch (exception) { setErreur(exception instanceof ErreurApi ? exception.message : "Mise à jour du lot impossible."); }
    finally { verrouAction.current = null; }
  }

  async function supprimerLot(lot: LotAdmin) {
    if (!window.confirm(`Supprimer le lot « ${lot.nom} » ?`)) return;
    if (verrouAction.current) return;
    verrouAction.current = `lot:delete:${lot.id}`;
    try { await supprimerLotAdmin(lot.id); setLotsAdmin((anciens) => anciens.filter((item) => item.id !== lot.id)); setConfirmation("Lot supprimé."); }
    catch (exception) { setErreur(exception instanceof ErreurApi ? exception.message : "Suppression du lot impossible."); }
    finally { verrouAction.current = null; }
  }

  async function changerStatutUtilisateur(utilisateur: UtilisateurAdmin) {
    if (verrouAction.current) return;
    verrouAction.current = `user:${utilisateur.id}`;
    try {
      const modifie = await modifierStatutUtilisateurAdmin(utilisateur.id, !utilisateur.actif);
      setUtilisateursAdmin((anciens) => anciens.map((item) => item.id === modifie.id ? { ...item, actif: modifie.actif } : item)); setConfirmation(modifie.actif ? "Utilisateur réactivé." : "Utilisateur désactivé.");
    } catch (exception) { setErreur(exception instanceof ErreurApi ? exception.message : "Modification du statut impossible."); }
    finally { verrouAction.current = null; }
  }

  async function soumettreSponsor(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!nomSponsor.trim() || verrouAction.current) return;
    verrouAction.current = "sponsor";
    try {
      await creerSponsor(nomSponsor.trim(), logoSponsor.trim() || undefined);
      setSponsors(await listerSponsors());
      setNomSponsor("");
      setLogoSponsor("");
    } catch (exception) {
      setErreur(exception instanceof ErreurApi ? exception.message : "Création impossible.");
    } finally { verrouAction.current = null; }
  }

  async function soumettreAnnonce(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (verrouAction.current) return;
    verrouAction.current = "annonce";
    setErreur(null);
    try {
      await creerAnnonce(titreAnnonce.trim(), texteAnnonce.trim());
      setAnnonces(await listerAnnonces());
      setTitreAnnonce("");
      setTexteAnnonce("");
      setConfirmation("Annonce créée.");
    } catch (exception) {
      setErreur(exception instanceof ErreurApi ? exception.message : "Création impossible.");
    } finally { verrouAction.current = null; }
  }

  async function enregistrerAnnonce(annonce: AnnonceAdmin) {
    if (verrouAction.current) return;
    verrouAction.current = `annonce:${annonce.id}`;
    try {
      const modifiee = await modifierAnnonce(annonce.id, { titre: annonce.titre, texte: annonce.texte });
      setAnnonces((anciennes) => anciennes.map((item) => item.id === modifiee.id ? modifiee : item));
      setAnnonceEnEdition(null);
      setConfirmation("Annonce mise à jour.");
    } catch (exception) { setErreur(exception instanceof ErreurApi ? exception.message : "Mise à jour impossible."); } finally { verrouAction.current = null; }
  }

  async function archiver(annonce: AnnonceAdmin) {
    if (!window.confirm("Archiver cette annonce ?")) return;
    if (verrouAction.current) return;
    verrouAction.current = `archive:${annonce.id}`;
    try {
      const archivee = await archiverAnnonce(annonce.id);
      setAnnonces((anciennes) => anciennes.map((item) => item.id === archivee.id ? archivee : item));
      setConfirmation("Annonce archivée.");
    } catch (exception) { setErreur(exception instanceof ErreurApi ? exception.message : "Archivage impossible."); } finally { verrouAction.current = null; }
  }

  async function afficherHistoriqueAnnonce(annonce: AnnonceAdmin) {
    try {
      const historique = await historiqueAnnonce(annonce.id);
      setHistoriquesAnnonces((anciens) => ({ ...anciens, [annonce.id]: historique }));
    } catch (exception) { setErreur(exception instanceof ErreurApi ? exception.message : "Impossible de charger l’historique."); }
  }

  async function restaurerAnnonceDepuisHistorique(annonce: AnnonceAdmin, eventId: string) {
    try {
      const restauree = await restaurerAnnonce(annonce.id, eventId);
      setAnnonces((anciennes) => anciennes.map((item) => item.id === restauree.id ? restauree : item));
      setConfirmation("Version de l’annonce restaurée.");
      await afficherHistoriqueAnnonce(restauree);
    } catch (exception) { setErreur(exception instanceof ErreurApi ? exception.message : "Restauration impossible."); }
  }

  async function enregistrerTirage(tirage: TirageAdmin) {
    if (verrouAction.current) return;
    verrouAction.current = `tirage:${tirage.id}`;
    try {
      const modifie = await modifierTirage(tirage.id, { titre: tirage.titre, description: tirage.description, lots: tirage.lots });
      setTirages((anciens) => anciens.map((item) => item.id === modifie.id ? modifie : item));
      setTirageEnEdition(null);
      setConfirmation("Tirage mis à jour.");
    } catch (exception) { setErreur(exception instanceof ErreurApi ? exception.message : "Mise à jour impossible."); } finally { verrouAction.current = null; }
  }

  async function afficherHistoriqueTirage(tirage: TirageAdmin) {
    try {
      const historique = await historiqueTirage(tirage.id);
      setHistoriquesTirages((anciens) => ({ ...anciens, [tirage.id]: historique }));
    } catch (exception) {
      setErreur(exception instanceof ErreurApi ? exception.message : "Impossible de charger l’historique du tirage.");
    }
  }

  async function executerTirageAdmin(tirage: TirageAdmin) {
    if (tirageEnExecution) return;
    if (!graineExploitant.trim() || !entropiePublique.trim()) {
      setErreur("La graine exploitant et l’entropie publique sont obligatoires.");
      return;
    }
    if (!window.confirm(`Exécuter définitivement le tirage « ${tirage.titre} » ?`)) return;
    setTirageEnExecution(tirage.id);
    setErreur(null);
    try {
      const resultat = await executerTirage(tirage.id, graineExploitant.trim(), entropiePublique.trim());
      setTirages((anciens) => anciens.map((item) => item.id === tirage.id ? { ...item, statut: "TIRE" } : item));
      setTirageEnExecution(null);
      setGraineExploitant("");
      setEntropiePublique("");
      setConfirmation(`Tirage exécuté. Empreinte : ${resultat.resultHash ?? "publiée dans l’historique"}.`);
    } catch (exception) {
      setErreur(exception instanceof ErreurApi ? exception.message : "Exécution du tirage impossible.");
    } finally {
      setTirageEnExecution(null);
    }
  }

  async function soumettreTirage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (verrouAction.current) return;
    verrouAction.current = "tirage:create";
    setErreur(null);
    try {
      await creerTirage({
        titre: titreTirage.trim(),
        description: descriptionTirage.trim(),
        dateOuverture: new Date().toISOString(),
        dateTirage: new Date(dateTirage).toISOString(),
        engagementGraine: engagementGraine.trim(),
        lots: [{ nom: nomLot.trim(), valeurEstimee: valeurLot.trim(), quantite: 1, fournisseur: fournisseurLot.trim() }],
      });
      setTirages(await listerTiragesAdmin());
      setTitreTirage("");
      setDescriptionTirage("");
      setDateTirage("");
      setNomLot("");
      setValeurLot("");
      setFournisseurLot("");
      setEngagementGraine("");
      setConfirmation("Tirage créé.");
    } catch (exception) {
      setErreur(exception instanceof ErreurApi ? exception.message : "Création impossible.");
    } finally { verrouAction.current = null; }
  }

  async function changerRecompense(stream: Stream, estPartenaire: boolean, bonusPointsHeure: number) {
    if (verrouAction.current) return;
    verrouAction.current = `stream:${stream.id}`;
    setErreur(null);
    try {
      await configurerRecompenseStream(stream.id, estPartenaire, bonusPointsHeure);
      setStreams((anciens) => anciens.map((item) => item.id === stream.id ? { ...item, estPartenaire, bonusPointsHeure } : item));
      setConfirmation("Récompense du stream mise à jour.");
    } catch (exception) {
      setErreur(exception instanceof ErreurApi ? exception.message : "Mise à jour impossible.");
    } finally { verrouAction.current = null; }
  }

  async function changerStatut(id: string, statut: StatutSignalement) {
    if (verrouAction.current) return;
    verrouAction.current = `fraud:${id}`;
    try {
      await modifierSignalement(id, statut);
      setSignalements((anciens) => anciens.map((item) => (item.id === id ? { ...item, statut } : item)));
      setConfirmation("Signalement mis à jour.");
    } catch (exception) {
      setErreur(exception instanceof ErreurApi ? exception.message : "Mise à jour impossible.");
    } finally { verrouAction.current = null; }
  }

  if (!profil && !erreur) {
    return <p className="text-sm text-foreground-muted" role="status">Chargement du back-office…</p>;
  }
  if (!profil && erreur) {
    return <div className="skuup-admin-alert skuup-admin-alert-error" role="alert"><p>{erreur}</p><button className="skuup-button skuup-button-outline mt-3" type="button" onClick={() => setCleChargement((cle) => cle + 1)}>Réessayer</button></div>;
  }

  const recherche = rechercheAdmin.trim().toLocaleLowerCase();
  const annoncesFiltrees = annonces.filter((annonce) => {
    const correspondRecherche = !recherche || `${annonce.titre} ${annonce.texte} ${annonce.id}`.toLocaleLowerCase().includes(recherche);
    const correspondStatut = filtreAnnonces === "TOUTES" || (filtreAnnonces === "ACTIVES" ? annonce.actif : !annonce.actif);
    return correspondRecherche && correspondStatut;
  });
  const tiragesFiltres = tirages.filter((tirage) => {
    const correspondRecherche = !recherche || `${tirage.titre} ${tirage.description} ${tirage.id}`.toLocaleLowerCase().includes(recherche);
    const correspondStatut = filtreTirages === "TOUS" || tirage.statut === filtreTirages;
    return correspondRecherche && correspondStatut;
  });
  const annoncesVisibles = annoncesFiltrees.slice((pageAnnonces - 1) * taillePage, pageAnnonces * taillePage);
  const tiragesVisibles = tiragesFiltres.slice((pageTirages - 1) * taillePage, pageTirages * taillePage);
  const nombrePagesAnnonces = Math.max(1, Math.ceil(annoncesFiltrees.length / taillePage));
  const nombrePagesTirages = Math.max(1, Math.ceil(tiragesFiltres.length / taillePage));
  const serviceOpérationnel = !erreur;
  const lotsDisponibles = tirages.reduce((total, tirage) => total + tirage.lots.reduce((sousTotal, lot) => sousTotal + lot.quantite, 0), 0);
  const ticketsDistribués = tirages.reduce((total, tirage) => total + tirage._count.tickets, 0);
  const utilisateursConcernés = Array.from(new Map(signalements.map((signalement) => [signalement.user.id, signalement.user])).values());
  const lotsSynthese = tirages.flatMap((tirage) => tirage.lots.map((lot) => ({ ...lot, tirageTitre: tirage.titre, tirageStatut: tirage.statut })));
  const prochainsTirages = tirages.filter((tirage) => tirage.statut === "OUVERT").slice(0, 3);

  const contenu = (
    <>
        {erreur && <p role="alert" className="skuup-admin-alert skuup-admin-alert-error">{erreur}</p>}
        {confirmation && <p role="status" className="skuup-admin-alert skuup-admin-alert-success">{confirmation}</p>}

        <section className="skuup-admin-cockpit" aria-labelledby="admin-cockpit-title">
          <div className="skuup-admin-cockpit-heading">
            <div><p className="skuup-admin-section-kicker">Priorités maintenant</p><h1 id="admin-cockpit-title" className="skuup-admin-cockpit-title">Le cockpit opérationnel</h1><p className="skuup-admin-cockpit-subtitle">Un aperçu court des signaux qui demandent une décision.</p></div>
            <span className="skuup-premium-dashboard-status"><span aria-hidden="true" /> {serviceOpérationnel ? "Service opérationnel" : "Service partiellement indisponible"}</span>
          </div>
          <div className="skuup-admin-kpi-grid">
            <a className="skuup-admin-kpi" aria-label="Signalements ouverts" href="#moderation"><span>Signalements ouverts</span><strong>{signalements.filter((item) => item.statut === "OUVERTE").length}</strong><small>À examiner</small></a>
            <a className="skuup-admin-kpi" aria-label="Tirages ouverts" href="#raffles"><span>Tirages ouverts</span><strong>{tirages.filter((item) => item.statut === "OUVERT").length}</strong><small>En cours</small></a>
            <a className="skuup-admin-kpi" aria-label="Annonces actives" href="#announcements"><span>Annonces actives</span><strong>{annonces.filter((item) => item.actif).length}</strong><small>Visibles viewer</small></a>
            <a className="skuup-admin-kpi" aria-label="Streams partenaires" href="#streams"><span>Streams partenaires</span><strong>{streams.filter((item) => item.estPartenaire).length}</strong><small>Bonus actifs</small></a>
            <a className="skuup-admin-kpi" aria-label="Lots disponibles" href="#raffles"><span>Lots disponibles</span><strong>{lotsDisponibles}</strong><small>À attribuer</small></a>
            <a className="skuup-admin-kpi" aria-label="Tickets distribués" href="#raffles"><span>Tickets distribués</span><strong>{ticketsDistribués}</strong><small>Participation totale</small></a>
          </div>
          <div className="skuup-admin-priority">
            <div><span className="skuup-admin-priority-dot" aria-hidden="true" /><div><strong>Prochaine action recommandée</strong><p>{signalements.some((item) => item.statut === "OUVERTE") ? "Examiner les signalements ouverts avant la prochaine publication." : "Aucune alerte bloquante. Vérifier les prochains tirages et annonces."}</p></div></div>
            <a className="skuup-button skuup-button-outline" href="#moderation">Ouvrir la modération</a>
          </div>
        </section>

        <section className="skuup-admin-overview-grid" aria-label="Synthèse opérationnelle">
          <article className="skuup-admin-card" aria-labelledby="admin-activity-title">
            <p className="skuup-admin-section-kicker">Surveillance</p>
            <h2 id="admin-activity-title" className="text-xl font-bold text-foreground">Activité récente</h2>
            <ol className="skuup-admin-activity-list mt-4">
              {journalAudit.slice(0, 4).map((event) => <li key={event.id}><strong>{event.action}</strong><span>{event.entityType} · {new Date(event.createdAt).toLocaleString("fr-FR")}</span></li>)}
              {journalAudit.length === 0 && <li className="text-sm text-foreground-muted">Aucune activité éditoriale disponible.</li>}
            </ol>
          </article>
          <article className="skuup-admin-card" aria-labelledby="admin-draws-title">
            <p className="skuup-admin-section-kicker">Planification</p>
            <h2 id="admin-draws-title" className="text-xl font-bold text-foreground">Prochains tirages</h2>
            <ul className="skuup-admin-compact-list mt-4">
              {prochainsTirages.map((tirage) => <li key={tirage.id}><strong>{tirage.titre}</strong><span>{new Date(tirage.dateTirage).toLocaleString("fr-FR")} · {tirage.lots.length} lot(s)</span></li>)}
              {prochainsTirages.length === 0 && <li className="text-sm text-foreground-muted">Aucun tirage ouvert.</li>}
            </ul>
          </article>
        </section>

        <p className="skuup-admin-section-kicker">Pilotage et modération</p>
        <section className="skuup-admin-card grid gap-3 md:grid-cols-4" aria-label="Filtres du back-office">
          <label className="skuup-admin-field md:col-span-1">Rechercher<input className="skuup-admin-input" value={rechercheAdmin} onChange={(event) => setRechercheAdmin(event.target.value)} placeholder="Titre, contenu ou identifiant" /></label>
          <label className="skuup-admin-field">Annonces<select className="skuup-admin-input" value={filtreAnnonces} onChange={(event) => setFiltreAnnonces(event.target.value as typeof filtreAnnonces)}><option value="TOUTES">Toutes</option><option value="ACTIVES">Actives</option><option value="ARCHIVEES">Archivées</option></select></label>
          <label className="skuup-admin-field">Tirages<select className="skuup-admin-input" value={filtreTirages} onChange={(event) => setFiltreTirages(event.target.value as typeof filtreTirages)}><option value="TOUS">Tous</option><option value="OUVERT">Ouverts</option><option value="TIRE">Tirés</option><option value="ANNULE">Annulés</option></select></label>
          <div className="flex items-end"><button className="skuup-button skuup-button-outline w-full" type="button" onClick={reinitialiserFiltres}>Réinitialiser les filtres</button></div>
        </section>

        <section id="moderation" className="grid gap-6 md:grid-cols-2">
          <article id="fraud" className="skuup-admin-card">
            <h2 className="text-xl font-bold text-foreground">Nouveau sponsor</h2>
            <form className="mt-4 grid gap-3" onSubmit={soumettreSponsor}>
              <label className="skuup-admin-field">Nom<input className="skuup-admin-input" value={nomSponsor} onChange={(event) => setNomSponsor(event.target.value)} required maxLength={160} /></label>
              <label className="skuup-admin-field">Logo HTTPS<input className="skuup-admin-input" value={logoSponsor} onChange={(event) => setLogoSponsor(event.target.value)} type="url" /></label>
              <button className="skuup-button skuup-admin-button" type="submit">Ajouter le sponsor</button>
            </form>
            <ul className="mt-6 grid gap-2" aria-label="Sponsors">
              {sponsors.length === 0 && <li className="skuup-admin-list-item text-sm text-foreground-muted">Aucun sponsor enregistré.</li>}
              {sponsors.map((sponsor) => <li className="skuup-admin-list-item flex justify-between gap-3" key={sponsor.id}><span>{sponsor.nom}</span><span className="text-foreground-muted">{sponsor._count.lots} lot(s)</span></li>)}
            </ul>
          </article>

          <article className="skuup-admin-card">
            <h2 className="text-xl font-bold text-foreground">Signalements anti-fraude</h2>
            <ul className="mt-4 grid gap-3" aria-label="Signalements">
              {signalements.length === 0 && <li className="text-foreground-muted">Aucun signalement.</li>}
              {signalements.map((signalement) => <li className="skuup-admin-list-item grid gap-2" key={signalement.id}><div><strong>{signalement.user.pseudo}</strong><span className="ml-2 text-foreground-muted">{signalement.type}</span></div><p className="text-sm text-foreground-muted">{signalement.details}</p><label className="skuup-admin-field">Statut du signalement<select aria-label={`Statut du signalement de ${signalement.user.pseudo}`} className="skuup-admin-input" value={signalement.statut} onChange={(event) => void changerStatut(signalement.id, event.target.value as StatutSignalement)}>{statuts.map((statut) => <option key={statut}>{statut}</option>)}</select></label></li>)}
            </ul>
          </article>

          <article id="users" className="skuup-admin-card">
            <p className="skuup-admin-section-kicker">Utilisateurs</p>
            <h2 className="text-xl font-bold text-foreground">Utilisateurs concernés</h2>
            <p className="mt-2 text-sm text-foreground-muted">Identités visibles uniquement lorsqu’elles sont liées à un signalement chargé par l’API admin.</p>
            <ul className="mt-4 grid gap-3" aria-label="Utilisateurs concernés par les signalements">
              {utilisateursConcernés.map((utilisateur) => <li className="skuup-admin-list-item grid gap-1" key={utilisateur.id}><strong>{utilisateur.pseudo}</strong><span className="text-sm text-foreground-muted">{utilisateur.email}</span><span className="text-xs text-foreground-muted">ID : {utilisateur.id}</span></li>)}
              {utilisateursConcernés.length === 0 && <li className="text-sm text-foreground-muted">Aucun utilisateur concerné.</li>}
            </ul>
          </article>

          <article id="users-global" className="skuup-admin-card md:col-span-2" aria-labelledby="users-global-title">
            <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="skuup-admin-section-kicker">Accès et sécurité</p><h2 id="users-global-title" className="text-xl font-bold text-foreground">Utilisateurs</h2><p className="mt-1 text-sm text-foreground-muted">Liste globale issue de l’API admin. Les actions de statut invalident les sessions côté serveur.</p></div><button className="skuup-button skuup-button-outline px-3 py-1 text-xs" type="button" onClick={() => void rechargerUtilisateurs()} disabled={chargementUtilisateurs}>Actualiser</button></div>
            <label className="skuup-admin-field mt-4">Rechercher un utilisateur<input className="skuup-admin-input" value={rechercheUtilisateurs} onChange={(event) => setRechercheUtilisateurs(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") void rechargerUtilisateurs(); }} placeholder="Pseudo ou email" /></label>
            {chargementUtilisateurs && <p className="mt-4 text-sm text-foreground-muted" role="status">Chargement des utilisateurs…</p>}
            {erreurUtilisateurs && <div className="skuup-admin-alert skuup-admin-alert-error mt-4" role="alert"><p>{erreurUtilisateurs}</p><button className="skuup-button skuup-button-outline mt-3 px-3 py-1 text-xs" type="button" onClick={() => void rechargerUtilisateurs()}>Réessayer</button></div>}
            {!chargementUtilisateurs && !erreurUtilisateurs && <ul className="mt-4 grid gap-3" aria-label="Utilisateurs administrables">{utilisateursAdmin.length === 0 && <li className="text-sm text-foreground-muted">Aucun utilisateur trouvé.</li>}{utilisateursAdmin.map((utilisateur) => <li className="skuup-admin-list-item flex flex-wrap items-center justify-between gap-3" key={utilisateur.id}><div><strong>{utilisateur.pseudo}</strong><p className="text-sm text-foreground-muted">{utilisateur.email} · {utilisateur.role} · {utilisateur.soldePoints} points · {utilisateur._count.watchSessions} session(s)</p></div><span className="skuup-admin-status-chip">{utilisateur.actif ? "ACTIF" : "DÉSACTIVÉ"}</span><button className="skuup-button skuup-button-outline px-3 py-1 text-xs" type="button" onClick={() => void changerStatutUtilisateur(utilisateur)}>{utilisateur.actif ? "Désactiver" : "Réactiver"}</button></li>)}</ul>}
          </article>
        </section>

        <p className="skuup-admin-section-kicker">Contenus éditoriaux</p>
        <div id="content"><GestionContenu /></div>

        <p className="skuup-admin-section-kicker">Communication et tirages</p>
        <section id="announcements" className="grid gap-6 lg:grid-cols-3">
          <article className="skuup-admin-card">
            <h2 className="text-xl font-bold text-foreground">Nouvelle annonce</h2>
            <form className="mt-4 grid gap-3" onSubmit={soumettreAnnonce}>
              <label className="skuup-admin-field">Titre<input className="skuup-admin-input" value={titreAnnonce} onChange={(event) => setTitreAnnonce(event.target.value)} required maxLength={160} /></label>
              <label className="skuup-admin-field">Message<textarea className="skuup-admin-input min-h-28" value={texteAnnonce} onChange={(event) => setTexteAnnonce(event.target.value)} required maxLength={2000} /></label>
              <button className="skuup-button skuup-admin-button" type="submit">Publier</button>
            </form>
            <ul className="mt-6 grid gap-3" aria-label="Annonces administrables">
              {annonces.length === 0 && <li className="text-sm text-foreground-muted">Aucune annonce enregistrée.</li>}
              {annoncesVisibles.map((annonce) => <li key={annonce.id} className="skuup-admin-list-item grid gap-2">
                {annonceEnEdition === annonce.id ? <>
                  <input aria-label={`Titre de ${annonce.id}`} className="skuup-admin-input" value={annonce.titre} onChange={(event) => setAnnonces((items) => items.map((item) => item.id === annonce.id ? { ...item, titre: event.target.value } : item))} />
                  <textarea aria-label={`Message de ${annonce.id}`} className="skuup-admin-input" value={annonce.texte} onChange={(event) => setAnnonces((items) => items.map((item) => item.id === annonce.id ? { ...item, texte: event.target.value } : item))} />
                  <button className="skuup-button skuup-button-outline px-3 py-1 text-xs" type="button" onClick={() => void enregistrerAnnonce(annonce)}>Enregistrer</button>
                </> : <>
                  <strong>{annonce.titre}</strong><p className="text-sm text-foreground-muted">{annonce.texte}</p>
                  <span className="flex gap-2"><button className="skuup-button skuup-button-outline px-3 py-1 text-xs" type="button" onClick={() => setAnnonceEnEdition(annonce.id)}>Modifier</button><button className="skuup-button skuup-button-outline px-3 py-1 text-xs" type="button" onClick={() => void archiver(annonce)}>Archiver</button><button className="skuup-button skuup-button-outline px-3 py-1 text-xs" type="button" onClick={() => void afficherHistoriqueAnnonce(annonce)}>Historique</button></span>
                  {historiquesAnnonces[annonce.id] && <ul className="grid gap-1 border-l border-white/10 pl-3 text-xs" aria-label={`Historique de ${annonce.titre}`}>{historiquesAnnonces[annonce.id].map((evenement) => <li key={evenement.id} className="grid gap-1"><div className="flex flex-wrap items-center justify-between gap-2"><span>{evenement.action} · {new Date(evenement.createdAt).toLocaleString("fr-FR")}</span>{Boolean((evenement.metadata as { previous?: unknown }).previous) && <button className="skuup-button skuup-button-outline px-2 py-1 text-xs" type="button" onClick={() => void restaurerAnnonceDepuisHistorique(annonce, evenement.id)}>Restaurer</button>}</div>{afficherDiffAnnonce(evenement.metadata)}</li>)}</ul>}
                </>}
              </li>)}
              {annoncesFiltrees.length > taillePage && <li className="flex items-center justify-between gap-3 text-sm"><button className="skuup-button skuup-button-outline px-3 py-1 text-xs" type="button" disabled={pageAnnonces === 1} onClick={() => setPageAnnonces((page) => Math.max(1, page - 1))}>Précédent</button><span aria-live="polite">Page {pageAnnonces} sur {nombrePagesAnnonces}</span><button className="skuup-button skuup-button-outline px-3 py-1 text-xs" type="button" disabled={pageAnnonces === nombrePagesAnnonces} onClick={() => setPageAnnonces((page) => Math.min(nombrePagesAnnonces, page + 1))}>Suivant</button></li>}
            </ul>
          </article>

          <article id="raffles" className="skuup-admin-card lg:col-span-2">
            <h2 className="text-xl font-bold text-foreground">Nouveau tirage</h2>
            <form className="mt-4 grid gap-3 md:grid-cols-2" onSubmit={soumettreTirage}>
              <label className="skuup-admin-field">Titre<input className="skuup-admin-input" value={titreTirage} onChange={(event) => setTitreTirage(event.target.value)} required /></label>
              <label className="skuup-admin-field">Date du tirage<input className="skuup-admin-input" type="datetime-local" value={dateTirage} onChange={(event) => setDateTirage(event.target.value)} required /></label>
              <label className="skuup-admin-field md:col-span-2">Description<textarea className="skuup-admin-input" value={descriptionTirage} onChange={(event) => setDescriptionTirage(event.target.value)} required /></label>
              <label className="skuup-admin-field">Lot<input className="skuup-admin-input" value={nomLot} onChange={(event) => setNomLot(event.target.value)} required /></label>
              <label className="skuup-admin-field">Valeur estimée<input className="skuup-admin-input" value={valeurLot} onChange={(event) => setValeurLot(event.target.value)} required /></label>
              <label className="skuup-admin-field">Fournisseur<input className="skuup-admin-input" value={fournisseurLot} onChange={(event) => setFournisseurLot(event.target.value)} required /></label>
              <label className="skuup-admin-field">Engagement SHA-256<input className="skuup-admin-input font-mono text-xs" value={engagementGraine} onChange={(event) => setEngagementGraine(event.target.value)} minLength={64} maxLength={64} required /></label>
              <button className="skuup-button skuup-admin-button md:col-span-2" type="submit">Créer le tirage</button>
            </form>
            <ul className="mt-6 grid gap-2" aria-label="Tirages administrables">
              {tirages.length === 0 && <li className="text-sm text-foreground-muted">Aucun tirage enregistré.</li>}
              {tiragesVisibles.map((tirage) => <li key={tirage.id} className="skuup-admin-list-item grid gap-2">{tirageEnEdition === tirage.id ? <><input aria-label={`Titre du tirage ${tirage.id}`} className="skuup-admin-input" value={tirage.titre} onChange={(event) => setTirages((anciens) => anciens.map((item) => item.id === tirage.id ? { ...item, titre: event.target.value } : item))} /><textarea aria-label={`Description du tirage ${tirage.id}`} className="skuup-admin-input" value={tirage.description} onChange={(event) => setTirages((anciens) => anciens.map((item) => item.id === tirage.id ? { ...item, description: event.target.value } : item))} /><ul className="grid gap-2" aria-label={`Lots du tirage ${tirage.titre}`}>{tirage.lots.map((lot, index) => <li key={lot.id} className="grid gap-2 md:grid-cols-4"><input aria-label={`Nom du lot ${index + 1}`} className="skuup-admin-input" value={lot.nom} onChange={(event) => setTirages((anciens) => anciens.map((item) => item.id === tirage.id ? { ...item, lots: item.lots.map((current, lotIndex) => lotIndex === index ? { ...current, nom: event.target.value } : current) } : item))} /><input aria-label={`Valeur du lot ${index + 1}`} className="skuup-admin-input" value={lot.valeurEstimee} onChange={(event) => setTirages((anciens) => anciens.map((item) => item.id === tirage.id ? { ...item, lots: item.lots.map((current, lotIndex) => lotIndex === index ? { ...current, valeurEstimee: event.target.value } : current) } : item))} /><input aria-label={`Quantité du lot ${index + 1}`} className="skuup-admin-input" type="number" min={1} value={lot.quantite} onChange={(event) => setTirages((anciens) => anciens.map((item) => item.id === tirage.id ? { ...item, lots: item.lots.map((current, lotIndex) => lotIndex === index ? { ...current, quantite: Number(event.target.value) } : current) } : item))} /><input aria-label={`Fournisseur du lot ${index + 1}`} className="skuup-admin-input" value={lot.fournisseur} onChange={(event) => setTirages((anciens) => anciens.map((item) => item.id === tirage.id ? { ...item, lots: item.lots.map((current, lotIndex) => lotIndex === index ? { ...current, fournisseur: event.target.value } : current) } : item))} /></li>)}</ul><button className="skuup-button skuup-button-outline px-3 py-1 text-xs" type="button" onClick={() => void enregistrerTirage(tirage)}>Enregistrer</button></> : <><div className="flex flex-wrap items-center justify-between gap-3"><span><strong>{tirage.titre}</strong><span className="ml-2 text-foreground-muted">{tirage.statut} · {tirage._count.tickets} ticket(s) · {tirage._count.winners} gagnant(s)</span></span><span className="flex items-center gap-2 text-xs text-foreground-muted">{tirage.audits.length} audit(s){tirage.statut === "OUVERT" && <button className="skuup-button skuup-button-outline px-3 py-1 text-xs" type="button" onClick={() => setTirageEnEdition(tirage.id)}>Modifier</button>}<button className="skuup-button skuup-button-outline px-3 py-1 text-xs" type="button" onClick={() => void afficherHistoriqueTirage(tirage)}>Historique</button></span></div>{tirage.statut === "OUVERT" && <div className="grid gap-2 rounded-xl border border-amber-300/20 bg-amber-300/5 p-3"><button className="skuup-button skuup-button-outline w-fit px-3 py-1 text-xs" type="button" onClick={() => setTiragePrepare(tiragePrepare === tirage.id ? null : tirage.id)}>{tiragePrepare === tirage.id ? "Annuler l’exécution" : "Préparer l’exécution"}</button>{tiragePrepare === tirage.id && <><label className="skuup-admin-field">Graine exploitant<input className="skuup-admin-input font-mono text-xs" value={graineExploitant} onChange={(event) => setGraineExploitant(event.target.value)} /></label><label className="skuup-admin-field">Entropie publique<input className="skuup-admin-input" value={entropiePublique} onChange={(event) => setEntropiePublique(event.target.value)} /></label><button className="skuup-button skuup-admin-button w-fit px-3 py-1 text-xs" type="button" disabled={tirageEnExecution === tirage.id} aria-busy={tirageEnExecution === tirage.id} onClick={() => void executerTirageAdmin(tirage)}>{tirageEnExecution === tirage.id ? "Exécution…" : "Exécuter définitivement"}</button></>}</div>}{historiquesTirages[tirage.id] && <ul className="grid gap-1 border-l border-white/10 pl-3 text-xs" aria-label={`Historique de ${tirage.titre}`}>{historiquesTirages[tirage.id].map((audit) => <li key={audit.id}>{new Date(audit.executedAt).toLocaleString("fr-FR")} · {audit.resultHash}</li>)}</ul>}</>}</li>)}
              {tiragesFiltres.length > taillePage && <li className="flex items-center justify-between gap-3 text-sm"><button className="skuup-button skuup-button-outline px-3 py-1 text-xs" type="button" disabled={pageTirages === 1} onClick={() => setPageTirages((page) => Math.max(1, page - 1))}>Précédent</button><span aria-live="polite">Page {pageTirages} sur {nombrePagesTirages}</span><button className="skuup-button skuup-button-outline px-3 py-1 text-xs" type="button" disabled={pageTirages === nombrePagesTirages} onClick={() => setPageTirages((page) => Math.min(nombrePagesTirages, page + 1))}>Suivant</button></li>}
            </ul>
          </article>
        </section>

        <section id="lots-synthese" className="skuup-admin-card" aria-labelledby="lots-title">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div><p className="skuup-admin-section-kicker">Inventaire</p><h2 id="lots-title" className="text-xl font-bold text-foreground">Lots disponibles</h2><p className="mt-1 text-sm text-foreground-muted">Vue consolidée des lots déclarés dans les tirages.</p></div>
            <span className="skuup-admin-audit-count">{lotsSynthese.length} lot(s)</span>
          </div>
          <div className="skuup-admin-lot-grid mt-5">
            {lotsSynthese.map((lot) => <article className="skuup-admin-lot-card" key={lot.id} aria-label={`Lot ${lot.nom}`}><div className="flex items-start justify-between gap-3"><h3 className="font-semibold text-foreground">{lot.nom}</h3><span className="skuup-admin-status-chip">{lot.tirageStatut}</span></div><p className="mt-2 text-sm text-foreground-muted">{lot.tirageTitre}</p><dl className="mt-4 grid grid-cols-2 gap-2 text-xs"><div><dt>Quantité</dt><dd>{lot.quantite}</dd></div><div><dt>Valeur estimée</dt><dd>{lot.valeurEstimee}</dd></div><div className="col-span-2"><dt>Fournisseur</dt><dd>{lot.fournisseur || "Non renseigné"}</dd></div></dl></article>)}
            {lotsSynthese.length === 0 && <p className="text-sm text-foreground-muted">Aucun lot déclaré.</p>}
          </div>
        </section>

        <section id="lots" className="skuup-admin-card" aria-labelledby="lots-admin-title">
          <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="skuup-admin-section-kicker">Catalogue contrôlé</p><h2 id="lots-admin-title" className="text-xl font-bold text-foreground">Gestion des lots</h2><p className="mt-1 text-sm text-foreground-muted">Les lots ne sont créables et modifiables que sur un tirage ouvert. Les lots gagnants sont verrouillés par l’API.</p></div><button className="skuup-button skuup-button-outline px-3 py-1 text-xs" type="button" onClick={() => void rechargerLots()} disabled={chargementLots}>Actualiser</button></div>
          <form className="mt-5 grid gap-3 md:grid-cols-5" onSubmit={soumettreLot}><label className="skuup-admin-field">Tirage ouvert<select className="skuup-admin-input" value={nouveauLot.raffleId} onChange={(event) => setNouveauLot((lot) => ({ ...lot, raffleId: event.target.value }))} required><option value="">Sélectionner</option>{tirages.filter((tirage) => tirage.statut === "OUVERT").map((tirage) => <option value={tirage.id} key={tirage.id}>{tirage.titre}</option>)}</select></label><label className="skuup-admin-field">Nom<input className="skuup-admin-input" value={nouveauLot.nom} onChange={(event) => setNouveauLot((lot) => ({ ...lot, nom: event.target.value }))} required maxLength={160} /></label><label className="skuup-admin-field">Valeur estimée<input className="skuup-admin-input" value={nouveauLot.valeurEstimee} onChange={(event) => setNouveauLot((lot) => ({ ...lot, valeurEstimee: event.target.value }))} required /></label><label className="skuup-admin-field">Quantité<input className="skuup-admin-input" type="number" min={1} value={nouveauLot.quantite} onChange={(event) => setNouveauLot((lot) => ({ ...lot, quantite: Number(event.target.value) }))} required /></label><label className="skuup-admin-field">Fournisseur<input className="skuup-admin-input" value={nouveauLot.fournisseur} onChange={(event) => setNouveauLot((lot) => ({ ...lot, fournisseur: event.target.value }))} required maxLength={160} /></label><button className="skuup-button skuup-admin-button md:col-span-5" type="submit" disabled={tirages.every((tirage) => tirage.statut !== "OUVERT")}>Créer le lot</button></form>
          {chargementLots && <p className="mt-4 text-sm text-foreground-muted" role="status">Chargement des lots…</p>}
          {erreurLots && <div className="skuup-admin-alert skuup-admin-alert-error mt-4" role="alert"><p>{erreurLots}</p><button className="skuup-button skuup-button-outline mt-3 px-3 py-1 text-xs" type="button" onClick={() => void rechargerLots()}>Réessayer</button></div>}
          {!chargementLots && !erreurLots && <ul className="mt-5 grid gap-3" aria-label="Lots administrables">{lotsAdmin.length === 0 && <li className="text-sm text-foreground-muted">Aucun lot dans le catalogue.</li>}{lotsAdmin.map((lot) => <li className="skuup-admin-list-item grid gap-3" key={lot.id}>{lotEnEdition === lot.id ? <div className="grid gap-2 md:grid-cols-4"><input aria-label={`Nom du lot ${lot.id}`} className="skuup-admin-input" value={lot.nom} onChange={(event) => setLotsAdmin((items) => items.map((item) => item.id === lot.id ? { ...item, nom: event.target.value } : item))} /><input aria-label={`Valeur du lot ${lot.id}`} className="skuup-admin-input" value={lot.valeurEstimee} onChange={(event) => setLotsAdmin((items) => items.map((item) => item.id === lot.id ? { ...item, valeurEstimee: event.target.value } : item))} /><input aria-label={`Quantité du lot ${lot.id}`} className="skuup-admin-input" type="number" min={1} value={lot.quantite} onChange={(event) => setLotsAdmin((items) => items.map((item) => item.id === lot.id ? { ...item, quantite: Number(event.target.value) } : item))} /><input aria-label={`Fournisseur du lot ${lot.id}`} className="skuup-admin-input" value={lot.fournisseur} onChange={(event) => setLotsAdmin((items) => items.map((item) => item.id === lot.id ? { ...item, fournisseur: event.target.value } : item))} /><span className="flex gap-2 md:col-span-4"><button className="skuup-button skuup-button-outline px-3 py-1 text-xs" type="button" onClick={() => void enregistrerLot(lot)}>Enregistrer</button><button className="skuup-button skuup-button-outline px-3 py-1 text-xs" type="button" onClick={() => setLotEnEdition(null)}>Annuler</button></span></div> : <div className="flex flex-wrap items-center justify-between gap-3"><div><strong>{lot.nom}</strong><p className="text-sm text-foreground-muted">{lot.raffle.titre} · {lot.quantite} · {lot.valeurEstimee} · {lot.fournisseur}</p></div><span className="flex gap-2"><button className="skuup-button skuup-button-outline px-3 py-1 text-xs" type="button" disabled={lot.raffle.statut !== "OUVERT" || lot._count.winners > 0} onClick={() => setLotEnEdition(lot.id)}>Modifier</button><button className="skuup-button skuup-button-outline px-3 py-1 text-xs" type="button" disabled={lot.raffle.statut !== "OUVERT" || lot._count.winners > 0} onClick={() => void supprimerLot(lot)}>Supprimer</button></span></div>}</li>)}</ul>}
        </section>

        <section id="audit" className="skuup-admin-card skuup-admin-audit-panel" aria-labelledby="audit-title">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div><p className="skuup-admin-section-kicker">Traçabilité</p><h2 id="audit-title" className="text-xl font-bold text-foreground">Journal d’audit</h2><p className="mt-1 text-sm text-foreground-muted">Les dernières actions éditoriales vérifiables.</p></div>
            <span className="skuup-admin-audit-count">{journalAudit.length} événement(s)</span>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-3" aria-label="Filtres du journal d’audit">
            <label className="skuup-admin-field">Type d’entité<select className="skuup-admin-input" value={filtreAuditType} onChange={(event) => setFiltreAuditType(event.target.value)}><option value="">Toutes les entités</option><option value="ManagedContent">Contenus</option><option value="Announcement">Annonces</option><option value="RaffleLot">Lots</option><option value="Raffle">Tirages</option><option value="User">Utilisateurs</option><option value="FraudFlag">Signalements</option></select></label>
            <label className="skuup-admin-field">Action<input className="skuup-admin-input" value={filtreAuditAction} onChange={(event) => setFiltreAuditAction(event.target.value)} placeholder="Ex. CONTENT_PUBLISHED" /></label>
            <p className="self-end text-sm text-foreground-muted">Journal filtré côté serveur</p>
          </div>
          <ol className="skuup-admin-audit-list mt-5" aria-label="Événements du journal d’audit">
            {journalAudit.slice(0, 8).map((event) => <li key={event.id}><span className="skuup-admin-audit-dot" aria-hidden="true" /><div><strong>{event.action}</strong><span>{event.entityType} · {event.entityId} · acteur {event.actorId}</span></div><time dateTime={event.createdAt}>{new Date(event.createdAt).toLocaleString("fr-FR")}</time></li>)}
            {journalAudit.length === 0 && <li className="text-sm text-foreground-muted">Aucun événement d’audit disponible.</li>}
          </ol>
        </section>

        <p className="skuup-admin-section-kicker">Configuration des streams</p>
        <section id="streams" className="skuup-admin-card">
          <h2 className="text-xl font-bold text-foreground">Bonus des streams partenaires</h2>
          <ul className="mt-4 grid gap-3">
            {streams.length === 0 && <li className="text-sm text-foreground-muted">Aucun stream configuré pour le moment.</li>}
            {streams.map((stream) => (
              <li key={stream.id} className="skuup-admin-list-item flex flex-wrap items-center justify-between gap-3">
                <div><strong>{stream.nomAffiche}</strong><p className="text-sm text-foreground-muted">{stream.plateforme}</p></div>
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={Boolean(stream.estPartenaire)} onChange={(event) => void changerRecompense(stream, event.target.checked, event.target.checked ? (stream.bonusPointsHeure ?? 0) : 0)} /> Partenaire</label>
                <label className="flex items-center gap-2 text-sm">Bonus/heure<input className="skuup-admin-input w-24" type="number" min={0} max={1000} value={stream.bonusPointsHeure ?? 0} onChange={(event) => void changerRecompense(stream, Boolean(stream.estPartenaire), Number(event.target.value))} /></label>
              </li>
            ))}
          </ul>
        </section>
    </>
  );

  return (
    <div className="skuup-premium-dashboard-shell skuup-premium-admin-shell">
      <aside className="skuup-premium-dashboard-nav" aria-label="Panneau d’administration">
        <Link href="/" className="skuup-premium-dashboard-brand" aria-label="Accueil Skkup"><Image src="/branding/skkup-wordmark-transparent.png" alt="Skkup" width={150} height={64} priority /></Link>
        <p className="skuup-kicker">Administration</p>
        <NavigationAdmin />
        <Link className="skuup-premium-dashboard-back inline-flex items-center gap-2" href="/dashboard"><SkkupIcon name="arrowBack" size={16} /> Retour viewer</Link>
      </aside>
      <main className="skuup-premium-dashboard-content">
        <div className="skuup-premium-dashboard-toolbar" id="overview">
          <div><p className="skuup-kicker">Cockpit opérationnel</p><p className="skuup-premium-dashboard-greeting">Piloter Skkup avec clarté</p></div>
          <span className="skuup-premium-dashboard-status"><span aria-hidden="true" /> Administration active</span>
        </div>
        <div className="skuup-dashboard-page">{contenu}</div>
      </main>
    </div>
  );
}

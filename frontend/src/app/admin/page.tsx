"use client";

import Image from "next/image";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ErreurApi } from "@/lib/api";
import {
  creerSponsor,
  creerAnnonce,
  archiverAnnonce,
  historiqueAnnonce,
  listerTiragesAdmin,
  modifierTirage,
  creerTirage,
  configurerRecompenseStream,
  listerSignalements,
  listerSponsors,
  listerAnnonces,
  modifierAnnonce,
  modifierSignalement,
  type SignalementAdmin,
  type SponsorAdmin,
  type StatutSignalement,
  type AnnonceAdmin,
  type TirageAdmin,
} from "@/lib/admin";
import { recupererProfil, type Profil } from "@/lib/dashboard";
import { listerStreams, type Stream } from "@/lib/streams";
import { GestionContenu } from "@/components/admin/GestionContenu";

const statuts: StatutSignalement[] = ["OUVERTE", "EXAMINEE", "IGNOREE"];

interface PageAdministrationProps {
  embedded?: boolean;
}

export default function PageAdministration({ embedded = false }: PageAdministrationProps) {
  const router = useRouter();
  const [profil, setProfil] = useState<Profil | null>(null);
  const [sponsors, setSponsors] = useState<SponsorAdmin[]>([]);
  const [signalements, setSignalements] = useState<SignalementAdmin[]>([]);
  const [streams, setStreams] = useState<Stream[]>([]);
  const [annonces, setAnnonces] = useState<AnnonceAdmin[]>([]);
  const [annonceEnEdition, setAnnonceEnEdition] = useState<string | null>(null);
  const [historiquesAnnonces, setHistoriquesAnnonces] = useState<Record<string, Array<{ id: string; action: string; createdAt: string }>>>({});
  const [tirages, setTirages] = useState<TirageAdmin[]>([]);
  const [tirageEnEdition, setTirageEnEdition] = useState<string | null>(null);
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

  useEffect(() => {
    let annule = false;

    async function chargerAdministration() {
      try {
        const profilRecu = await recupererProfil();
        if (profilRecu.role !== "ADMIN") {
          router.replace("/dashboard");
          return;
        }

        const [sponsorsRecus, signalementsRecus, streamsRecus, annoncesRecues, tiragesRecus] =
          await Promise.all([
            listerSponsors(),
            listerSignalements(),
            listerStreams(),
            listerAnnonces(),
            listerTiragesAdmin(),
          ]);

        if (annule) return;
        setProfil(profilRecu);
        setSponsors(sponsorsRecus);
        setSignalements(signalementsRecus);
        setStreams(streamsRecus);
        setAnnonces(annoncesRecues);
        setTirages(tiragesRecus);
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
  }, [router]);

  async function soumettreSponsor(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!nomSponsor.trim()) return;
    try {
      const sponsor = await creerSponsor(nomSponsor.trim(), logoSponsor.trim() || undefined);
      setSponsors((anciens) => [...anciens, sponsor]);
      setNomSponsor("");
      setLogoSponsor("");
    } catch (exception) {
      setErreur(exception instanceof ErreurApi ? exception.message : "Création impossible.");
    }
  }

  async function soumettreAnnonce(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErreur(null);
    try {
      await creerAnnonce(titreAnnonce.trim(), texteAnnonce.trim());
      setAnnonces(await listerAnnonces());
      setTitreAnnonce("");
      setTexteAnnonce("");
      setConfirmation("Annonce créée.");
    } catch (exception) {
      setErreur(exception instanceof ErreurApi ? exception.message : "Création impossible.");
    }
  }

  async function enregistrerAnnonce(annonce: AnnonceAdmin) {
    try {
      const modifiee = await modifierAnnonce(annonce.id, { titre: annonce.titre, texte: annonce.texte });
      setAnnonces((anciennes) => anciennes.map((item) => item.id === modifiee.id ? modifiee : item));
      setAnnonceEnEdition(null);
      setConfirmation("Annonce mise à jour.");
    } catch (exception) { setErreur(exception instanceof ErreurApi ? exception.message : "Mise à jour impossible."); }
  }

  async function archiver(annonce: AnnonceAdmin) {
    if (!window.confirm("Archiver cette annonce ?")) return;
    try {
      const archivee = await archiverAnnonce(annonce.id);
      setAnnonces((anciennes) => anciennes.map((item) => item.id === archivee.id ? archivee : item));
      setConfirmation("Annonce archivée.");
    } catch (exception) { setErreur(exception instanceof ErreurApi ? exception.message : "Archivage impossible."); }
  }

  async function afficherHistoriqueAnnonce(annonce: AnnonceAdmin) {
    try {
      const historique = await historiqueAnnonce(annonce.id);
      setHistoriquesAnnonces((anciens) => ({ ...anciens, [annonce.id]: historique }));
    } catch (exception) { setErreur(exception instanceof ErreurApi ? exception.message : "Impossible de charger l’historique."); }
  }

  async function enregistrerTirage(tirage: TirageAdmin) {
    try {
      const modifie = await modifierTirage(tirage.id, { titre: tirage.titre, description: tirage.description });
      setTirages((anciens) => anciens.map((item) => item.id === modifie.id ? modifie : item));
      setTirageEnEdition(null);
      setConfirmation("Tirage mis à jour.");
    } catch (exception) { setErreur(exception instanceof ErreurApi ? exception.message : "Mise à jour impossible."); }
  }

  async function soumettreTirage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
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
    }
  }

  async function changerRecompense(stream: Stream, estPartenaire: boolean, bonusPointsHeure: number) {
    setErreur(null);
    try {
      await configurerRecompenseStream(stream.id, estPartenaire, bonusPointsHeure);
      setStreams((anciens) => anciens.map((item) => item.id === stream.id ? { ...item, estPartenaire, bonusPointsHeure } : item));
      setConfirmation("Récompense du stream mise à jour.");
    } catch (exception) {
      setErreur(exception instanceof ErreurApi ? exception.message : "Mise à jour impossible.");
    }
  }

  async function changerStatut(id: string, statut: StatutSignalement) {
    try {
      const modifie = await modifierSignalement(id, statut);
      setSignalements((anciens) => anciens.map((item) => (item.id === id ? modifie : item)));
    } catch (exception) {
      setErreur(exception instanceof ErreurApi ? exception.message : "Mise à jour impossible.");
    }
  }

  if (!profil && !erreur) {
    if (embedded) {
      return <p className="text-sm text-foreground-muted" role="status">Chargement du back-office…</p>;
    }
    return (
      <main className="skuup-shell skuup-app-shell min-h-screen w-full" aria-busy="true">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 pb-16 pt-10">
          <p className="text-sm text-foreground-muted">Chargement du back-office…</p>
        </div>
      </main>
    );
  }

  const contenu = (
    <>
        <header className="skuup-dashboard-hero">
          <div>
            <p className="skuup-kicker">Administration</p>
            <h1 className="mt-2 text-4xl font-extrabold text-white sm:text-5xl">
              Back-office <span className="skuup-gradient-text">Skkup</span>
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-white/65">
              Gère les sponsors, les annonces, les tirages et les signalements depuis un espace centralisé.
            </p>
          </div>
          <div className="skuup-dashboard-orb" aria-hidden="true"><Image src="/branding/skkup-s-favicon.png" alt="" width={720} height={720} className="skuup-dashboard-orb-logo" priority /></div>
        </header>

        {erreur && <p role="alert" className="skuup-admin-alert skuup-admin-alert-error">{erreur}</p>}
        {confirmation && <p role="status" className="skuup-admin-alert skuup-admin-alert-success">{confirmation}</p>}

        <section className="grid gap-6 md:grid-cols-2">
          <article className="skuup-admin-card">
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
              {signalements.map((signalement) => <li className="skuup-admin-list-item grid gap-2" key={signalement.id}><div><strong>{signalement.user.pseudo}</strong><span className="ml-2 text-foreground-muted">{signalement.type}</span></div><p className="text-sm text-foreground-muted">{signalement.details}</p><select className="skuup-admin-input" value={signalement.statut} onChange={(event) => void changerStatut(signalement.id, event.target.value as StatutSignalement)}>{statuts.map((statut) => <option key={statut}>{statut}</option>)}</select></li>)}
            </ul>
          </article>
        </section>

        <GestionContenu />

        <section className="grid gap-6 lg:grid-cols-3">
          <article className="skuup-admin-card">
            <h2 className="text-xl font-bold text-foreground">Nouvelle annonce</h2>
            <form className="mt-4 grid gap-3" onSubmit={soumettreAnnonce}>
              <label className="skuup-admin-field">Titre<input className="skuup-admin-input" value={titreAnnonce} onChange={(event) => setTitreAnnonce(event.target.value)} required maxLength={160} /></label>
              <label className="skuup-admin-field">Message<textarea className="skuup-admin-input min-h-28" value={texteAnnonce} onChange={(event) => setTexteAnnonce(event.target.value)} required maxLength={2000} /></label>
              <button className="skuup-button skuup-admin-button" type="submit">Publier</button>
            </form>
            <ul className="mt-6 grid gap-3" aria-label="Annonces administrables">
              {annonces.length === 0 && <li className="text-sm text-foreground-muted">Aucune annonce enregistrée.</li>}
              {annonces.map((annonce) => <li key={annonce.id} className="skuup-admin-list-item grid gap-2">
                {annonceEnEdition === annonce.id ? <>
                  <input aria-label={`Titre de ${annonce.id}`} className="skuup-admin-input" value={annonce.titre} onChange={(event) => setAnnonces((items) => items.map((item) => item.id === annonce.id ? { ...item, titre: event.target.value } : item))} />
                  <textarea aria-label={`Message de ${annonce.id}`} className="skuup-admin-input" value={annonce.texte} onChange={(event) => setAnnonces((items) => items.map((item) => item.id === annonce.id ? { ...item, texte: event.target.value } : item))} />
                  <button className="skuup-button skuup-button-outline px-3 py-1 text-xs" type="button" onClick={() => void enregistrerAnnonce(annonce)}>Enregistrer</button>
                </> : <>
                  <strong>{annonce.titre}</strong><p className="text-sm text-foreground-muted">{annonce.texte}</p>
                  <span className="flex gap-2"><button className="skuup-button skuup-button-outline px-3 py-1 text-xs" type="button" onClick={() => setAnnonceEnEdition(annonce.id)}>Modifier</button><button className="skuup-button skuup-button-outline px-3 py-1 text-xs" type="button" onClick={() => void archiver(annonce)}>Archiver</button><button className="skuup-button skuup-button-outline px-3 py-1 text-xs" type="button" onClick={() => void afficherHistoriqueAnnonce(annonce)}>Historique</button></span>
                  {historiquesAnnonces[annonce.id] && <ul className="grid gap-1 border-l border-white/10 pl-3 text-xs" aria-label={`Historique de ${annonce.titre}`}>{historiquesAnnonces[annonce.id].map((evenement) => <li key={evenement.id}>{evenement.action} · {new Date(evenement.createdAt).toLocaleString("fr-FR")}</li>)}</ul>}
                </>}
              </li>)}
            </ul>
          </article>

          <article className="skuup-admin-card lg:col-span-2">
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
              {tirages.map((tirage) => <li key={tirage.id} className="skuup-admin-list-item grid gap-2">{tirageEnEdition === tirage.id ? <><input aria-label={`Titre du tirage ${tirage.id}`} className="skuup-admin-input" value={tirage.titre} onChange={(event) => setTirages((anciens) => anciens.map((item) => item.id === tirage.id ? { ...item, titre: event.target.value } : item))} /><textarea aria-label={`Description du tirage ${tirage.id}`} className="skuup-admin-input" value={tirage.description} onChange={(event) => setTirages((anciens) => anciens.map((item) => item.id === tirage.id ? { ...item, description: event.target.value } : item))} /><button className="skuup-button skuup-button-outline px-3 py-1 text-xs" type="button" onClick={() => void enregistrerTirage(tirage)}>Enregistrer</button></> : <div className="flex flex-wrap items-center justify-between gap-3"><span><strong>{tirage.titre}</strong><span className="ml-2 text-foreground-muted">{tirage.statut} · {tirage._count.tickets} ticket(s) · {tirage._count.winners} gagnant(s)</span></span><span className="flex items-center gap-2 text-xs text-foreground-muted">{tirage.audits.length} audit(s){tirage.statut === "OUVERT" && <button className="skuup-button skuup-button-outline px-3 py-1 text-xs" type="button" onClick={() => setTirageEnEdition(tirage.id)}>Modifier</button>}</span></div>}</li>)}
            </ul>
          </article>
        </section>

        <section className="skuup-admin-card">
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

  if (embedded) {
    return <div className="skuup-dashboard-page">{contenu}</div>;
  }

  return (
    <main className="skuup-shell skuup-app-shell min-h-screen w-full">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 pb-16 pt-10">{contenu}</div>
    </main>
  );
}

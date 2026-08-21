"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ErreurApi } from "@/lib/api";
import {
  creerSponsor,
  creerAnnonce,
  creerTirage,
  configurerRecompenseStream,
  listerSignalements,
  listerSponsors,
  modifierSignalement,
  type SignalementAdmin,
  type SponsorAdmin,
  type StatutSignalement,
} from "@/lib/admin";
import { recupererProfil, type Profil } from "@/lib/dashboard";
import { listerStreams, type Stream } from "@/lib/streams";

const statuts: StatutSignalement[] = ["OUVERTE", "EXAMINEE", "IGNOREE"];

export default function PageAdministration() {
  const router = useRouter();
  const [profil, setProfil] = useState<Profil | null>(null);
  const [sponsors, setSponsors] = useState<SponsorAdmin[]>([]);
  const [signalements, setSignalements] = useState<SignalementAdmin[]>([]);
  const [streams, setStreams] = useState<Stream[]>([]);
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
    Promise.all([recupererProfil(), listerSponsors(), listerSignalements(), listerStreams()])
      .then(([profilRecu, sponsorsRecus, signalementsRecus, streamsRecus]) => {
        if (profilRecu.role !== "ADMIN") {
          router.replace("/dashboard");
          return;
        }
        setProfil(profilRecu);
        setSponsors(sponsorsRecus);
        setSignalements(signalementsRecus);
        setStreams(streamsRecus);
      })
      .catch((exception: unknown) => {
        if (exception instanceof ErreurApi && exception.statut === 401) {
          router.replace("/connexion");
          return;
        }
        setErreur(
          exception instanceof ErreurApi
            ? exception.message
            : "Impossible de charger le back-office.",
        );
      });
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
      setTitreAnnonce("");
      setTexteAnnonce("");
      setConfirmation("Annonce créée.");
    } catch (exception) {
      setErreur(exception instanceof ErreurApi ? exception.message : "Création impossible.");
    }
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
    return <main className="p-6" aria-busy="true">Chargement du back-office…</main>;
  }

  return (
    <main className="skuup-app-shell mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-8 p-6">
      <header>
        <p className="text-sm uppercase tracking-[0.2em] text-accent-cyan">Administration</p>
        <h1 className="mt-2 text-4xl font-extrabold text-foreground">Back-office Skkup</h1>
        <p className="mt-2 text-foreground-muted">Gère les sponsors et traite les signalements anti-fraude.</p>
      </header>

      {erreur && <p role="alert" className="rounded-xl border border-red-400/50 p-4 text-red-200">{erreur}</p>}
      {confirmation && <p role="status" className="rounded-xl border border-green-400/50 p-4 text-green-200">{confirmation}</p>}

      <section className="grid gap-6 md:grid-cols-2">
        <article className="rounded-2xl border border-accent-violet/30 bg-surface p-6">
          <h2 className="text-xl font-bold text-foreground">Nouveau sponsor</h2>
          <form className="mt-4 grid gap-3" onSubmit={soumettreSponsor}>
            <label className="grid gap-1 text-sm text-foreground-muted">Nom<input className="rounded-lg bg-background p-3 text-foreground" value={nomSponsor} onChange={(event) => setNomSponsor(event.target.value)} required maxLength={160} /></label>
            <label className="grid gap-1 text-sm text-foreground-muted">Logo HTTPS<input className="rounded-lg bg-background p-3 text-foreground" value={logoSponsor} onChange={(event) => setLogoSponsor(event.target.value)} type="url" /></label>
            <button className="rounded-full bg-accent-violet px-4 py-3 font-bold text-background" type="submit">Ajouter le sponsor</button>
          </form>
          <ul className="mt-6 grid gap-2" aria-label="Sponsors">
            {sponsors.map((sponsor) => <li className="flex justify-between rounded-lg bg-background/60 p-3" key={sponsor.id}><span>{sponsor.nom}</span><span className="text-foreground-muted">{sponsor._count.lots} lot(s)</span></li>)}
          </ul>
        </article>

        <article className="rounded-2xl border border-accent-violet/30 bg-surface p-6">
          <h2 className="text-xl font-bold text-foreground">Signalements anti-fraude</h2>
          <ul className="mt-4 grid gap-3" aria-label="Signalements">
            {signalements.length === 0 && <li className="text-foreground-muted">Aucun signalement.</li>}
            {signalements.map((signalement) => <li className="grid gap-2 rounded-lg bg-background/60 p-3" key={signalement.id}><div><strong>{signalement.user.pseudo}</strong><span className="ml-2 text-foreground-muted">{signalement.type}</span></div><p className="text-sm text-foreground-muted">{signalement.details}</p><select className="rounded-lg bg-background p-2 text-foreground" value={signalement.statut} onChange={(event) => void changerStatut(signalement.id, event.target.value as StatutSignalement)}>{statuts.map((statut) => <option key={statut}>{statut}</option>)}</select></li>)}
          </ul>
        </article>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <article className="rounded-2xl border border-accent-violet/30 bg-surface p-6">
          <h2 className="text-xl font-bold text-foreground">Nouvelle annonce</h2>
          <form className="mt-4 grid gap-3" onSubmit={soumettreAnnonce}>
            <label className="grid gap-1 text-sm text-foreground-muted">Titre<input className="rounded-lg bg-background p-3 text-foreground" value={titreAnnonce} onChange={(event) => setTitreAnnonce(event.target.value)} required maxLength={160} /></label>
            <label className="grid gap-1 text-sm text-foreground-muted">Message<textarea className="min-h-28 rounded-lg bg-background p-3 text-foreground" value={texteAnnonce} onChange={(event) => setTexteAnnonce(event.target.value)} required maxLength={2000} /></label>
            <button className="rounded-full bg-accent-violet px-4 py-3 font-bold text-background" type="submit">Publier</button>
          </form>
        </article>

        <article className="rounded-2xl border border-accent-violet/30 bg-surface p-6 lg:col-span-2">
          <h2 className="text-xl font-bold text-foreground">Nouveau tirage</h2>
          <form className="mt-4 grid gap-3 md:grid-cols-2" onSubmit={soumettreTirage}>
            <label className="grid gap-1 text-sm text-foreground-muted">Titre<input className="rounded-lg bg-background p-3 text-foreground" value={titreTirage} onChange={(event) => setTitreTirage(event.target.value)} required /></label>
            <label className="grid gap-1 text-sm text-foreground-muted">Date du tirage<input className="rounded-lg bg-background p-3 text-foreground" type="datetime-local" value={dateTirage} onChange={(event) => setDateTirage(event.target.value)} required /></label>
            <label className="grid gap-1 text-sm text-foreground-muted md:col-span-2">Description<textarea className="rounded-lg bg-background p-3 text-foreground" value={descriptionTirage} onChange={(event) => setDescriptionTirage(event.target.value)} required /></label>
            <label className="grid gap-1 text-sm text-foreground-muted">Lot<input className="rounded-lg bg-background p-3 text-foreground" value={nomLot} onChange={(event) => setNomLot(event.target.value)} required /></label>
            <label className="grid gap-1 text-sm text-foreground-muted">Valeur estimée<input className="rounded-lg bg-background p-3 text-foreground" value={valeurLot} onChange={(event) => setValeurLot(event.target.value)} required /></label>
            <label className="grid gap-1 text-sm text-foreground-muted">Fournisseur<input className="rounded-lg bg-background p-3 text-foreground" value={fournisseurLot} onChange={(event) => setFournisseurLot(event.target.value)} required /></label>
            <label className="grid gap-1 text-sm text-foreground-muted">Engagement SHA-256<input className="rounded-lg bg-background p-3 font-mono text-xs text-foreground" value={engagementGraine} onChange={(event) => setEngagementGraine(event.target.value)} minLength={64} maxLength={64} required /></label>
            <button className="rounded-full bg-accent-violet px-4 py-3 font-bold text-background md:col-span-2" type="submit">Créer le tirage</button>
          </form>
        </article>
      </section>

      <section className="rounded-2xl border border-accent-violet/30 bg-surface p-6">
        <h2 className="text-xl font-bold text-foreground">Bonus des streams partenaires</h2>
        <ul className="mt-4 grid gap-3">
          {streams.map((stream) => (
            <li key={stream.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-background/60 p-3">
              <div><strong>{stream.nomAffiche}</strong><p className="text-sm text-foreground-muted">{stream.plateforme}</p></div>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={Boolean(stream.estPartenaire)} onChange={(event) => void changerRecompense(stream, event.target.checked, event.target.checked ? (stream.bonusPointsHeure ?? 0) : 0)} /> Partenaire</label>
              <label className="flex items-center gap-2 text-sm">Bonus/heure<input className="w-24 rounded-lg bg-background p-2" type="number" min={0} max={1000} value={stream.bonusPointsHeure ?? 0} onChange={(event) => void changerRecompense(stream, Boolean(stream.estPartenaire), Number(event.target.value))} /></label>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}

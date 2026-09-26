"use client";

import Image from "next/image";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ErreurApi, messageErreurInterface } from "@/lib/api";
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
import { useLanguage } from "@/components/i18n/LanguageProvider";

const statuts: StatutSignalement[] = ["OUVERTE", "EXAMINEE", "IGNOREE"];

interface PageAdministrationProps {
  embedded?: boolean;
}

export default function PageAdministration({ embedded = false }: PageAdministrationProps) {
  const router = useRouter();
  const { langue } = useLanguage();
  const anglais = langue === "en";
  const c = anglais ? {
    loading: "Loading administration…", title: "Administration", heading: "Skkup back office", intro: "Manage sponsors, announcements, draws and reports from one central space.", sponsor: "New sponsor", reports: "Anti-fraud reports", announcement: "New announcement", draw: "New draw", bonuses: "Partner stream bonuses", add: "Add sponsor", publish: "Publish", create: "Create draw", emptySponsors: "No sponsor registered.", emptyReports: "No report.", emptyStreams: "No stream configured yet.", updated: "Reward updated.", created: "Created.", impossible: "Unable to create.", update: "Unable to update.", name: "Name", logo: "HTTPS logo", titleLabel: "Title", message: "Message", date: "Draw date", description: "Description", prize: "Prize", value: "Estimated value", supplier: "Supplier", commitment: "SHA-256 commitment", partner: "Partner", perHour: "Bonus/hour", sponsors: "Sponsors", reportsLabel: "Reports", sponsorsAria: "Sponsors", reportsAria: "Reports", partnerLabel: "Partner", pieces: "item(s)", announcementCreated: "Announcement created.", drawCreated: "Draw created.", impossibleUpdate: "Unable to update."
  } : {
    loading: "Chargement du back-office…", title: "Administration", heading: "Back-office Skkup", intro: "Gère les sponsors, les annonces, les tirages et les signalements depuis un espace centralisé.", sponsor: "Nouveau sponsor", reports: "Signalements anti-fraude", announcement: "Nouvelle annonce", draw: "Nouveau tirage", bonuses: "Bonus des streams partenaires", add: "Ajouter le sponsor", publish: "Publier", create: "Créer le tirage", emptySponsors: "Aucun sponsor enregistré.", emptyReports: "Aucun signalement.", emptyStreams: "Aucun stream configuré pour le moment.", updated: "Récompense mise à jour.", created: "Créé.", impossible: "Création impossible.", update: "Mise à jour impossible.", name: "Nom", logo: "Logo HTTPS", titleLabel: "Titre", message: "Message", date: "Date du tirage", description: "Description", prize: "Lot", value: "Valeur estimée", supplier: "Fournisseur", commitment: "Engagement SHA-256", partner: "Partenaire", perHour: "Bonus/heure", sponsors: "Sponsors", reportsLabel: "Signalements", sponsorsAria: "Sponsors", reportsAria: "Signalements", partnerLabel: "Partenaire", pieces: "lot(s)", announcementCreated: "Annonce créée.", drawCreated: "Tirage créé.", impossibleUpdate: "Mise à jour impossible."
  };
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
    let annule = false;

    async function chargerAdministration() {
      try {
        const profilRecu = await recupererProfil();
        if (profilRecu.role !== "ADMIN") {
          router.replace("/dashboard");
          return;
        }

        const [sponsorsRecus, signalementsRecus, streamsRecus] =
          await Promise.all([
            listerSponsors(),
            listerSignalements(),
            listerStreams(),
          ]);

        if (annule) return;
        setProfil(profilRecu);
        setSponsors(sponsorsRecus);
        setSignalements(signalementsRecus);
        setStreams(streamsRecus);
      } catch (exception: unknown) {
        if (annule) return;
        if (exception instanceof ErreurApi && exception.statut === 401) {
          router.replace("/connexion");
          return;
        }
        setErreur(messageErreurInterface(exception, langue, c.loading));
      }
    }

    void chargerAdministration();
    return () => {
      annule = true;
    };
  }, [c.loading, langue, router]);

  async function soumettreSponsor(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!nomSponsor.trim()) return;
    try {
      const sponsor = await creerSponsor(nomSponsor.trim(), logoSponsor.trim() || undefined);
      setSponsors((anciens) => [...anciens, sponsor]);
      setNomSponsor("");
      setLogoSponsor("");
    } catch (exception) {
      setErreur(messageErreurInterface(exception, langue, c.impossible));
    }
  }

  async function soumettreAnnonce(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErreur(null);
    try {
      await creerAnnonce(titreAnnonce.trim(), texteAnnonce.trim());
      setTitreAnnonce("");
      setTexteAnnonce("");
      setConfirmation(c.announcementCreated);
    } catch (exception) {
      setErreur(messageErreurInterface(exception, langue, c.impossible));
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
      setConfirmation(c.drawCreated);
    } catch (exception) {
      setErreur(messageErreurInterface(exception, langue, c.impossible));
    }
  }

  async function changerRecompense(stream: Stream, estPartenaire: boolean, bonusPointsHeure: number) {
    setErreur(null);
    try {
      await configurerRecompenseStream(stream.id, estPartenaire, bonusPointsHeure);
      setStreams((anciens) => anciens.map((item) => item.id === stream.id ? { ...item, estPartenaire, bonusPointsHeure } : item));
      setConfirmation(c.updated);
    } catch (exception) {
      setErreur(messageErreurInterface(exception, langue, c.update));
    }
  }

  async function changerStatut(id: string, statut: StatutSignalement) {
    try {
      const modifie = await modifierSignalement(id, statut);
      setSignalements((anciens) => anciens.map((item) => (item.id === id ? modifie : item)));
    } catch (exception) {
      setErreur(messageErreurInterface(exception, langue, c.update));
    }
  }

  if (!profil && !erreur) {
    if (embedded) {
      return <p className="text-sm text-foreground-muted" role="status">{c.loading}</p>;
    }
    return (
      <main className="skuup-app-shell min-h-screen w-full" aria-busy="true">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 pb-16 pt-10">
          <p className="text-sm text-foreground-muted">{c.loading}</p>
        </div>
      </main>
    );
  }

  const contenu = (
    <>
        <header className="skuup-dashboard-hero">
          <div>
            <p className="skuup-kicker">{c.title}</p>
            <h1 className="mt-2 text-4xl font-extrabold text-white sm:text-5xl">
              {c.heading}
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-white/65">
              {c.intro}
            </p>
          </div>
          <div className="skuup-dashboard-orb" aria-hidden="true"><Image src="/branding/skkup-s-favicon.png" alt="" width={720} height={720} className="skuup-dashboard-orb-logo" priority /></div>
        </header>

        {erreur && <p role="alert" className="skuup-admin-alert skuup-admin-alert-error">{erreur}</p>}
        {confirmation && <p role="status" className="skuup-admin-alert skuup-admin-alert-success">{confirmation}</p>}

        <section className="grid gap-6 md:grid-cols-2">
          <article className="skuup-admin-card">
            <h2 className="text-xl font-bold text-foreground">{c.sponsor}</h2>
            <form className="mt-4 grid gap-3" onSubmit={soumettreSponsor}>
              <label className="skuup-admin-field">{c.name}<input className="skuup-admin-input" value={nomSponsor} onChange={(event) => setNomSponsor(event.target.value)} required maxLength={160} /></label>
              <label className="skuup-admin-field">{c.logo}<input className="skuup-admin-input" value={logoSponsor} onChange={(event) => setLogoSponsor(event.target.value)} type="url" /></label>
              <button className="skuup-button skuup-admin-button" type="submit">{c.add}</button>
            </form>
            <ul className="mt-6 grid gap-2" aria-label={c.sponsorsAria}>
              {sponsors.length === 0 && <li className="skuup-admin-list-item text-sm text-foreground-muted">{c.emptySponsors}</li>}
              {sponsors.map((sponsor) => <li className="skuup-admin-list-item flex justify-between gap-3" key={sponsor.id}><span>{sponsor.nom}</span><span className="text-foreground-muted">{sponsor._count.lots} {c.pieces}</span></li>)}
            </ul>
          </article>

          <article className="skuup-admin-card">
            <h2 className="text-xl font-bold text-foreground">{c.reports}</h2>
            <ul className="mt-4 grid gap-3" aria-label={c.reportsAria}>
              {signalements.length === 0 && <li className="text-foreground-muted">{c.emptyReports}</li>}
              {signalements.map((signalement) => <li className="skuup-admin-list-item grid gap-2" key={signalement.id}><div><strong>{signalement.user.pseudo}</strong><span className="ml-2 text-foreground-muted">{signalement.type}</span></div><p className="text-sm text-foreground-muted">{signalement.details}</p><select className="skuup-admin-input" value={signalement.statut} onChange={(event) => void changerStatut(signalement.id, event.target.value as StatutSignalement)}>{statuts.map((statut) => <option key={statut}>{statut}</option>)}</select></li>)}
            </ul>
          </article>
        </section>

        <section className="grid gap-6 lg:grid-cols-3">
          <article className="skuup-admin-card">
            <h2 className="text-xl font-bold text-foreground">{c.announcement}</h2>
            <form className="mt-4 grid gap-3" onSubmit={soumettreAnnonce}>
              <label className="skuup-admin-field">{c.titleLabel}<input className="skuup-admin-input" value={titreAnnonce} onChange={(event) => setTitreAnnonce(event.target.value)} required maxLength={160} /></label>
              <label className="skuup-admin-field">{c.message}<textarea className="skuup-admin-input min-h-28" value={texteAnnonce} onChange={(event) => setTexteAnnonce(event.target.value)} required maxLength={2000} /></label>
              <button className="skuup-button skuup-admin-button" type="submit">{c.publish}</button>
            </form>
          </article>

          <article className="skuup-admin-card lg:col-span-2">
            <h2 className="text-xl font-bold text-foreground">{c.draw}</h2>
            <form className="mt-4 grid gap-3 md:grid-cols-2" onSubmit={soumettreTirage}>
              <label className="skuup-admin-field">{c.titleLabel}<input className="skuup-admin-input" value={titreTirage} onChange={(event) => setTitreTirage(event.target.value)} required /></label>
              <label className="skuup-admin-field">{c.date}<input className="skuup-admin-input" type="datetime-local" value={dateTirage} onChange={(event) => setDateTirage(event.target.value)} required /></label>
              <label className="skuup-admin-field md:col-span-2">{c.description}<textarea className="skuup-admin-input" value={descriptionTirage} onChange={(event) => setDescriptionTirage(event.target.value)} required /></label>
              <label className="skuup-admin-field">{c.prize}<input className="skuup-admin-input" value={nomLot} onChange={(event) => setNomLot(event.target.value)} required /></label>
              <label className="skuup-admin-field">{c.value}<input className="skuup-admin-input" value={valeurLot} onChange={(event) => setValeurLot(event.target.value)} required /></label>
              <label className="skuup-admin-field">{c.supplier}<input className="skuup-admin-input" value={fournisseurLot} onChange={(event) => setFournisseurLot(event.target.value)} required /></label>
              <label className="skuup-admin-field">{c.commitment}<input className="skuup-admin-input font-mono text-xs" value={engagementGraine} onChange={(event) => setEngagementGraine(event.target.value)} minLength={64} maxLength={64} required /></label>
              <button className="skuup-button skuup-admin-button md:col-span-2" type="submit">{c.create}</button>
            </form>
          </article>
        </section>

        <section className="skuup-admin-card">
          <h2 className="text-xl font-bold text-foreground">{c.bonuses}</h2>
          <ul className="mt-4 grid gap-3">
            {streams.length === 0 && <li className="text-sm text-foreground-muted">{c.emptyStreams}</li>}
            {streams.map((stream) => (
              <li key={stream.id} className="skuup-admin-list-item flex flex-wrap items-center justify-between gap-3">
                <div><strong>{stream.nomAffiche}</strong><p className="text-sm text-foreground-muted">{stream.plateforme}</p></div>
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={Boolean(stream.estPartenaire)} onChange={(event) => void changerRecompense(stream, event.target.checked, event.target.checked ? (stream.bonusPointsHeure ?? 0) : 0)} /> {c.partnerLabel}</label>
                <label className="flex items-center gap-2 text-sm">{c.perHour}<input className="skuup-admin-input w-24" type="number" min={0} max={1000} value={stream.bonusPointsHeure ?? 0} onChange={(event) => void changerRecompense(stream, Boolean(stream.estPartenaire), Number(event.target.value))} /></label>
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
    <main className="skuup-app-shell min-h-screen w-full">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 pb-16 pt-10">{contenu}</div>
    </main>
  );
}

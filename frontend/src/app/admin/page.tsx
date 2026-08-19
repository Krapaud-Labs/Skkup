"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ErreurApi } from "@/lib/api";
import {
  creerSponsor,
  listerSignalements,
  listerSponsors,
  modifierSignalement,
  type SignalementAdmin,
  type SponsorAdmin,
  type StatutSignalement,
} from "@/lib/admin";
import { recupererProfil, type Profil } from "@/lib/dashboard";

const statuts: StatutSignalement[] = ["OUVERTE", "EXAMINEE", "IGNOREE"];

export default function PageAdministration() {
  const router = useRouter();
  const [profil, setProfil] = useState<Profil | null>(null);
  const [sponsors, setSponsors] = useState<SponsorAdmin[]>([]);
  const [signalements, setSignalements] = useState<SignalementAdmin[]>([]);
  const [nomSponsor, setNomSponsor] = useState("");
  const [logoSponsor, setLogoSponsor] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([recupererProfil(), listerSponsors(), listerSignalements()])
      .then(([profilRecu, sponsorsRecus, signalementsRecus]) => {
        if (profilRecu.role !== "ADMIN") {
          router.replace("/dashboard");
          return;
        }
        setProfil(profilRecu);
        setSponsors(sponsorsRecus);
        setSignalements(signalementsRecus);
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
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-8 p-6">
      <header>
        <p className="text-sm uppercase tracking-[0.2em] text-accent-cyan">Administration</p>
        <h1 className="mt-2 text-4xl font-extrabold text-foreground">Back-office Viewer Rewards</h1>
        <p className="mt-2 text-foreground-muted">Gère les sponsors et traite les signalements anti-fraude.</p>
      </header>

      {erreur && <p role="alert" className="rounded-xl border border-red-400/50 p-4 text-red-200">{erreur}</p>}

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
    </main>
  );
}

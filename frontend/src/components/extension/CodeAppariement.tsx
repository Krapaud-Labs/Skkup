"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { BoutonCTA } from "@/components/ui/BoutonCTA";
import { CarteGlow } from "@/components/ui/CarteGlow";
import { ErreurApi } from "@/lib/api";
import {
  genererCodeAppariement,
  listerAppareilsApparies,
  revoquerAppareil,
  type AppareilApparie,
  type CodeAppariement as Code,
} from "@/lib/extension";
import { SkkupIcon } from "@/components/ui/SkkupIcon";

/**
 * Génération du code à recopier dans l'extension.
 *
 * Le code ne vit que 5 minutes et n'est jamais réaffichable : il n'est
 * donc ni mémorisé ailleurs que dans l'état de ce composant, ni
 * réutilisé après un rechargement de page. Le compte à rebours affiché
 * n'est qu'un confort : c'est le serveur qui refuse un code périmé.
 */

// ─── Compte à rebours ────────────────────────────────────────────────────────

function secondesRestantes(expireAt: string): number {
  return Math.max(0, Math.ceil((Date.parse(expireAt) - Date.now()) / 1000));
}

function formaterDuree(secondes: number): string {
  const minutes = Math.floor(secondes / 60);
  const reste = secondes % 60;
  return `${minutes}:${String(reste).padStart(2, "0")}`;
}

function libelleStatut(statut: AppareilApparie["statut"]): string {
  return statut === "ACTIF" ? "actif" : statut === "EXPIRE" ? "expiré" : "révoqué";
}

// ─── Composant ───────────────────────────────────────────────────────────────

export function CodeAppariement() {
  const router = useRouter();

  const [code, setCode] = useState<Code | null>(null);
  const [restant, setRestant] = useState(0);
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);
  const [appareils, setAppareils] = useState<AppareilApparie[]>([]);
  const [chargementAppareils, setChargementAppareils] = useState(true);
  const [erreurAppareils, setErreurAppareils] = useState<string | null>(null);
  const [appareilEnCours, setAppareilEnCours] = useState<string | null>(null);

  // Le code affiché sert de cible au focus après génération, pour que la
  // lecture d'écran annonce le code sans que l'usager ait à le chercher.
  const zoneCode = useRef<HTMLParagraphElement | null>(null);

  useEffect(() => {
    if (code === null) {
      return;
    }
    // Le compte à rebours est amorcé à la réception du code : seul son
    // rafraîchissement seconde par seconde relève de cet effet.
    const minuterie = window.setInterval(() => {
      setRestant(secondesRestantes(code.expireAt));
    }, 1000);
    return () => window.clearInterval(minuterie);
  }, [code]);

  useEffect(() => {
    let actif = true;
    listerAppareilsApparies()
      .then((resultat) => { if (actif) setAppareils(resultat.appareils); })
      .catch((exception: unknown) => {
        if (!actif) return;
        if (exception instanceof ErreurApi && exception.statut === 401) {
          router.push("/connexion");
          return;
        }
        setErreurAppareils(exception instanceof ErreurApi ? exception.message : "Impossible de charger les appareils associés.");
      })
      .finally(() => { if (actif) setChargementAppareils(false); });
    return () => { actif = false; };
  }, [router]);

  const revoquer = async (appareil: AppareilApparie) => {
    setAppareilEnCours(appareil.id);
    setErreurAppareils(null);
    try {
      await revoquerAppareil(appareil.id);
      setAppareils((anciens) => anciens.filter((item) => item.id !== appareil.id));
    } catch (exception: unknown) {
      if (exception instanceof ErreurApi && exception.statut === 401) { router.push("/connexion"); return; }
      setErreurAppareils(exception instanceof ErreurApi ? exception.message : "Impossible de révoquer cet appareil.");
    } finally { setAppareilEnCours(null); }
  };

  const generer = useCallback(() => {
    setEnCours(true);
    setErreur(null);
    genererCodeAppariement()
      .then((resultat) => {
        setCode(resultat);
        setRestant(secondesRestantes(resultat.expireAt));
        zoneCode.current?.focus();
      })
      .catch((exception: unknown) => {
        // Le backend est seul juge de l'accès : une 401 signifie que la
        // session est absente ou expirée.
        if (exception instanceof ErreurApi && exception.statut === 401) {
          router.push("/connexion");
          return;
        }
        setErreur(
          exception instanceof ErreurApi
            ? exception.message
            : "Impossible de générer un code pour le moment.",
        );
      })
      .finally(() => setEnCours(false));
  }, [router]);

  const expire = code !== null && restant === 0;

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(20rem,.8fr)]">
      <CarteGlow className="flex flex-col gap-4">
      <h2 className="text-xl font-bold text-foreground">
        Associer l&apos;extension à ton compte
      </h2>
      <p className="text-sm text-foreground-muted">
        Génère un code, puis recopie-le dans l&apos;extension installée sur ton
        navigateur. Il reste valable 5 minutes et ne sert qu&apos;une fois.
      </p>

      {code !== null && (
        <div className="rounded-2xl border border-accent-violet-light/40 bg-background/60 p-4 text-center">
          <p
            ref={zoneCode}
            tabIndex={-1}
            className="font-mono text-2xl font-bold tracking-[0.25em] text-foreground"
          >
            {code.code}
          </p>
          <p className="mt-2 text-xs text-foreground-muted" aria-live="polite">
            {expire
              ? "Code expiré, génère-en un nouveau."
              : `Valable encore ${formaterDuree(restant)}`}
          </p>
        </div>
      )}

      {erreur !== null && (
        <p
          role="alert"
          className="rounded-2xl border border-red-400/50 bg-red-500/10 px-4 py-3 text-sm text-red-200"
        >
          {erreur}
        </p>
      )}

      <BoutonCTA type="button" onClick={generer} disabled={enCours} className="w-full sm:w-auto">
        {enCours
          ? "Génération…"
          : code === null
            ? "Générer un code"
            : "Générer un nouveau code"}
      </BoutonCTA>

      <p className="text-xs text-foreground-muted">
        Générer un nouveau code annule le précédent. Un compte peut associer
        5 appareils au maximum.
      </p>
      </CarteGlow>

      <CarteGlow className="flex flex-col gap-4">
        <div className="flex items-start gap-3"><SkkupIcon name="devices" size={24} className="text-accent-cyan" /><div><h2 className="text-xl font-bold text-foreground">Appareils associés</h2><p className="text-sm text-foreground-muted">Les appareils sont identifiés uniquement par leur date d&apos;association.</p></div></div>
        {chargementAppareils && <p className="text-sm text-foreground-muted" role="status">Chargement des appareils…</p>}
        {erreurAppareils !== null && <p role="alert" className="rounded-2xl border border-red-400/50 bg-red-500/10 px-4 py-3 text-sm text-red-200">{erreurAppareils}</p>}
        {!chargementAppareils && erreurAppareils === null && appareils.length === 0 && <p className="rounded-2xl border border-dashed border-accent-violet-light/40 px-4 py-5 text-sm text-foreground-muted">Aucun appareil associé.</p>}
        <ul className="grid gap-3" aria-label="Liste des appareils associés">
          {appareils.map((appareil) => {
            const actif = appareil.statut === "ACTIF";
            return <li key={appareil.id} className="flex items-center justify-between gap-3 rounded-2xl border border-accent-violet-light/20 bg-background/50 p-3">
              <div className="flex min-w-0 items-center gap-3"><span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${actif ? "bg-emerald-500/15 text-emerald-300" : "bg-foreground/10 text-foreground-muted"}`}><SkkupIcon name="devices" size={18} /></span><div className="min-w-0"><p className="font-semibold text-foreground">Appareil associé</p><p className="text-xs text-foreground-muted">Depuis le {new Date(appareil.pairedAt).toLocaleDateString("fr-FR")} · {libelleStatut(appareil.statut)}</p></div></div>
              {actif && <BoutonCTA type="button" variante="secondaire" className="shrink-0 px-3 py-2 text-xs" onClick={() => revoquer(appareil)} disabled={appareilEnCours === appareil.id}>{appareilEnCours === appareil.id ? "Révocation…" : "Révoquer"}</BoutonCTA>}
            </li>;
          })}
        </ul>
      </CarteGlow>
    </div>
  );
}

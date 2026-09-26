"use client";

import { useCallback, useRef, useState, useSyncExternalStore } from "react";
import { useSessionVisionnage } from "@/hooks/useSessionVisionnage";
import { useLanguage } from "@/components/i18n/LanguageProvider";
import type { EtatLecteur } from "@/lib/lecteur-youtube";
import { libellesPlateforme, type Stream } from "@/lib/streams";
import { LecteurYouTube } from "./LecteurYouTube";

/**
 * Lecteur embarqué du site : associe un lecteur de plateforme à une
 * session de visionnage comptabilisée par le backend.
 *
 * V1.0 : seule l'intégration YouTube est branchée (voir
 * docs/02-architecture.md, « Mécanisme de repli »). Twitch et Facebook
 * viendront s'ajouter ici sans toucher à l'orchestration des heartbeats,
 * qui ne dépend que d'un booléen « en lecture » et d'une position.
 */

interface LecteurEmbarqueProps {
  stream: Stream;
}

function souscrireVisibilite(notifier: () => void) {
  document.addEventListener("visibilitychange", notifier);
  return () => document.removeEventListener("visibilitychange", notifier);
}

function pageVisible() {
  return document.visibilityState === "visible";
}

export function LecteurEmbarque({ stream }: LecteurEmbarqueProps) {
  const { langue } = useLanguage();
  const [lectureActive, setLectureActive] = useState(false);
  const estPageVisible = useSyncExternalStore(
    souscrireVisibilite,
    pageVisible,
    () => true,
  );
  const enLecture = lectureActive && estPageVisible;

  // La position change en continu : la stocker dans une ref évite un
  // rendu par rapport du lecteur, elle n'est lue qu'à l'envoi d'un
  // heartbeat.
  const positionRef = useRef(0);

  const surEtatLecteur = useCallback((etat: EtatLecteur) => {
    positionRef.current = etat.positionSecondes;
    setLectureActive(etat.enLecture);
  }, []);

  const lirePosition = useCallback(() => positionRef.current, []);

  const { etat, messageErreur, pointsCredites } = useSessionVisionnage({
    plateforme: stream.plateforme,
    identifiantChaine: stream.identifiantChaine,
    enLecture,
    lirePosition,
    langue,
  });

  return (
    <section className="flex w-full flex-col gap-4">
      <header className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-2xl font-extrabold text-foreground">
          {stream.nomAffiche}
        </h2>
        <span className="text-sm text-foreground-muted">
          {libellesPlateforme[stream.plateforme]}
        </span>
      </header>

      {stream.plateforme === "YOUTUBE" ? (
        <LecteurYouTube
          identifiantChaine={stream.identifiantChaine}
          titre={stream.nomAffiche}
          onEtat={surEtatLecteur}
        />
      ) : (
        <p className="rounded-carte bg-background-elevated p-6 text-sm text-foreground-muted">
          Le lecteur {libellesPlateforme[stream.plateforme]} arrive
          prochainement. En attendant, l&apos;extension navigateur
          comptabilise ton visionnage sur cette plateforme.
        </p>
      )}

      <EtatVisionnage
        etat={etat}
        enLecture={enLecture}
        messageErreur={messageErreur}
        pointsCredites={pointsCredites}
      />
    </section>
  );
}

// ─── Retour visuel sur la session ────────────────────────────────────────────

interface EtatVisionnageProps {
  etat: ReturnType<typeof useSessionVisionnage>["etat"];
  enLecture: boolean;
  messageErreur: string | null;
  pointsCredites: number;
}

function EtatVisionnage({
  etat,
  enLecture,
  messageErreur,
  pointsCredites,
}: EtatVisionnageProps) {
  if (etat === "erreur") {
    return (
      <p
        role="alert"
        className="rounded-2xl border border-red-400/50 bg-red-500/10 px-4 py-3 text-sm text-red-200"
      >
        {messageErreur}
      </p>
    );
  }

  const messages: Record<Exclude<typeof etat, "erreur">, string> = {
    inactive: "Lance la lecture pour commencer à cumuler des points.",
    ouverture: "Démarrage du suivi de ton visionnage...",
    active: enLecture
      ? "Visionnage comptabilisé, tes points arrivent."
      : "Lecture en pause : le compteur est suspendu.",
  };

  return (
    <p
      // Une région live annonce le changement d'état aux lecteurs
      // d'écran, qui ne perçoivent pas l'état visuel du lecteur.
      aria-live="polite"
      className="flex flex-wrap items-center gap-3 text-sm text-foreground-muted"
    >
      <span
        aria-hidden="true"
        className={`inline-block h-2.5 w-2.5 rounded-full transition-colors ${
          etat === "active" && enLecture
            ? "bg-accent-cta-alt shadow-glow"
            : "bg-foreground-muted/50"
        }`}
      />
      {messages[etat]}
      {pointsCredites > 0 && (
        <span className="font-semibold text-accent-cta">
          +{pointsCredites} points sur cette session
        </span>
      )}
    </p>
  );
}

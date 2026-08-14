"use client";

import { useEffect, useState } from "react";
import { LecteurEmbarque } from "@/components/lecteur/LecteurEmbarque";
import { CarteGlow } from "@/components/ui/CarteGlow";
import { ErreurApi } from "@/lib/api";
import { libellesPlateforme, listerStreams, type Stream } from "@/lib/streams";

/**
 * Catalogue des streams et lecteur associé.
 *
 * Le chargement se fait côté navigateur : GET /streams est public, mais
 * l'API est appelée directement depuis le client (NEXT_PUBLIC_API_URL),
 * comme le reste du frontend. Page volontairement minimale, la vitrine
 * et le tableau de bord viewer font l'objet de lots séparés.
 */

export function ListeStreams() {
  const [streams, setStreams] = useState<Stream[] | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [streamActifId, setStreamActifId] = useState<string | null>(null);

  useEffect(() => {
    let annule = false;

    listerStreams()
      .then((resultat) => {
        if (annule) {
          return;
        }
        setStreams(resultat);
        setStreamActifId(resultat[0]?.id ?? null);
      })
      .catch((exception: unknown) => {
        if (!annule) {
          setErreur(
            exception instanceof ErreurApi
              ? exception.message
              : "Impossible de charger les streams pour le moment.",
          );
        }
      });

    return () => {
      annule = true;
    };
  }, []);

  if (erreur) {
    return (
      <p
        role="alert"
        className="rounded-2xl border border-red-400/50 bg-red-500/10 px-4 py-3 text-sm text-red-200"
      >
        {erreur}
      </p>
    );
  }

  if (streams === null) {
    return (
      <p role="status" aria-live="polite" className="text-sm text-foreground-muted">
        Chargement des streams...
      </p>
    );
  }

  if (streams.length === 0) {
    return (
      <CarteGlow className="w-full">
        <p className="text-sm text-foreground-muted">
          Aucun stream disponible pour l&apos;instant. Reviens bientôt, de
          nouvelles chaînes partenaires arrivent.
        </p>
      </CarteGlow>
    );
  }

  const streamActif = streams.find((s) => s.id === streamActifId) ?? streams[0];

  return (
    <div className="flex w-full flex-col gap-8 lg:flex-row lg:items-start">
      <CarteGlow className="w-full lg:order-2 lg:max-w-xs">
        <h2 className="text-lg font-bold text-foreground">Chaînes partenaires</h2>
        <ul className="mt-4 flex flex-col gap-2">
          {streams.map((stream) => {
            const actif = stream.id === streamActif.id;
            return (
              <li key={stream.id}>
                <button
                  type="button"
                  aria-current={actif ? "true" : undefined}
                  onClick={() => setStreamActifId(stream.id)}
                  className={`w-full rounded-2xl px-4 py-3 text-left transition-shadow duration-300 ${
                    actif
                      ? "bg-accent-violet/30 shadow-glow"
                      : "bg-background hover:shadow-glow"
                  }`}
                >
                  <span className="block font-semibold text-foreground">
                    {stream.nomAffiche}
                  </span>
                  <span className="block text-xs text-foreground-muted">
                    {libellesPlateforme[stream.plateforme]}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </CarteGlow>

      <div className="w-full lg:order-1 lg:flex-1">
        {/* La clé force le remontage du lecteur au changement de stream :
            la session de visionnage en cours est ainsi close proprement. */}
        <LecteurEmbarque key={streamActif.id} stream={streamActif} />
      </div>
    </div>
  );
}

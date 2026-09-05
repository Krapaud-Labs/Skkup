"use client";

import { useEffect, useState, type FormEvent } from "react";
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
  const [plateformeLibre, setPlateformeLibre] = useState<Stream["plateforme"]>("YOUTUBE");
  const [identifiantLibre, setIdentifiantLibre] = useState("");
  const [nomLibre, setNomLibre] = useState("");

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
          de nouveaux streams arrivent bientôt.
        </p>
      </CarteGlow>
    );
  }

  const streamActif = streams.find((s) => s.id === streamActifId) ?? streams[0];

  function ajouterStreamLibre(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const identifiant = identifiantLibre.trim();
    if (!identifiant) return;
    const streamLibre: Stream = {
      id: `libre-${plateformeLibre}-${identifiant}`,
      plateforme: plateformeLibre,
      identifiantChaine: identifiant,
      nomAffiche: nomLibre.trim() || `Stream ${libellesPlateforme[plateformeLibre]}`,
    };
    setStreams((actuels) => [...(actuels ?? []), streamLibre]);
    setStreamActifId(streamLibre.id);
    setIdentifiantLibre("");
    setNomLibre("");
  }

  return (
    <div className="flex w-full flex-col gap-8 lg:flex-row lg:items-start">
      <CarteGlow className="w-full">
        <h2 className="text-lg font-bold text-foreground">Regarder un stream libre</h2>
        <p className="mt-1 text-sm text-foreground-muted">
          Ajoute une chaîne de ton choix. Les streams valides donnent le barème de base ; le bonus partenaire est optionnel.
        </p>
        <form className="mt-4 grid gap-3 sm:grid-cols-[9rem_1fr_1fr_auto]" onSubmit={ajouterStreamLibre}>
          <label className="sr-only" htmlFor="plateforme-libre">Plateforme</label>
          <select id="plateforme-libre" value={plateformeLibre} onChange={(event) => setPlateformeLibre(event.target.value as Stream["plateforme"])} className="rounded-2xl border border-accent-violet-light/40 bg-background px-3 py-3 text-sm text-foreground">
            <option value="YOUTUBE">YouTube</option>
            <option value="TWITCH">Twitch</option>
            <option value="FACEBOOK">Facebook</option>
          </select>
          <label className="sr-only" htmlFor="identifiant-libre">Identifiant de chaîne</label>
          <input id="identifiant-libre" value={identifiantLibre} onChange={(event) => setIdentifiantLibre(event.target.value)} placeholder="Identifiant de chaîne" required className="rounded-2xl border border-accent-violet-light/40 bg-background px-3 py-3 text-sm text-foreground placeholder:text-foreground-muted/60" />
          <label className="sr-only" htmlFor="nom-libre">Nom affiché</label>
          <input id="nom-libre" value={nomLibre} onChange={(event) => setNomLibre(event.target.value)} placeholder="Nom affiché (optionnel)" className="rounded-2xl border border-accent-violet-light/40 bg-background px-3 py-3 text-sm text-foreground placeholder:text-foreground-muted/60" />
          <button type="submit" className="skuup-button whitespace-nowrap">Regarder</button>
        </form>
      </CarteGlow>
      <CarteGlow className="w-full lg:order-2 lg:max-w-xs">
        <h2 className="text-lg font-bold text-foreground">Streams disponibles</h2>
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
        <CarteGlow>
          <h2 className="text-xl font-bold text-foreground">Regarde ce stream avec l&apos;extension</h2>
          <p className="mt-2 text-sm text-foreground-muted">
            Ouvre le direct sur Twitch, YouTube ou Facebook, puis laisse l&apos;extension Skkup suivre ton visionnage.
          </p>
        </CarteGlow>
      </div>
    </div>
  );
}

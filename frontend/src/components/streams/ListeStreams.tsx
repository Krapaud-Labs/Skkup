"use client";

import { useEffect, useState } from "react";
import { CarteGlow } from "@/components/ui/CarteGlow";
import { ErreurApi } from "@/lib/api";
import { libellesPlateforme, listerStreams, type Stream } from "@/lib/streams";
import { SkkupIcon } from "@/components/ui/SkkupIcon";
import { traductions, useLanguage } from "@/components/i18n/LanguageProvider";

/**
 * Catalogue des chaînes proposées par Skkup.
 *
 * Le visionnage reste libre sur la plateforme choisie. L'extension observe
 * ensuite l'onglet Twitch, YouTube ou Facebook Live de l'utilisateur : aucun
 * lecteur n'est embarqué dans la vitrine et aucun stream n'est imposé.
 */
export function ListeStreams() {
  const { langue } = useLanguage();
  const t = traductions[langue].content;
  const [streams, setStreams] = useState<Stream[] | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    let annule = false;

    listerStreams()
      .then((resultat) => {
        if (!annule) {
          setStreams(resultat);
        }
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
        {t.loadingStreams}
      </p>
    );
  }

  return (
    <div className="flex w-full flex-col gap-6">
      <CarteGlow>
        <p className="skuup-kicker">{t.freeViewing}</p>
        <h2 className="mt-1 text-2xl font-bold text-foreground">
          Regarde ce que tu veux
        </h2>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-foreground-muted">
          {t.streamDescription}
        </p>
        <a href="/extension" className="skuup-button skuup-button-outline mt-5 inline-flex">
          {t.installExtension}
        </a>
      </CarteGlow>

      {streams.length === 0 ? (
        <CarteGlow>
          <p className="text-sm text-foreground-muted">
            {t.emptyStreams}
          </p>
        </CarteGlow>
      ) : (
        <section aria-labelledby="streams-catalogue-title">
          <div className="mb-4">
            <p className="skuup-kicker">{t.selection}</p>
            <h2 id="streams-catalogue-title" className="mt-1 text-xl font-bold text-foreground">
              {t.proposedChannels}
            </h2>
          </div>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {streams.map((stream) => (
              <li key={stream.id}>
                <CarteGlow className="flex h-full flex-col justify-between">
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-[.16em] text-accent-violet-light">
                      {libellesPlateforme[stream.plateforme]}
                    </span>
                    <h3 className="mt-2 text-lg font-bold text-foreground">
                      {stream.nomAffiche}
                    </h3>
                  </div>
                  <a
                    href={urlStreamExterne(stream)}
                    target="_blank"
                    rel="noreferrer"
                    className="skuup-button skuup-button-outline mt-5 inline-flex w-fit"
                  >
                    {t.openStream}
                    <SkkupIcon name="arrow" size={17} />
                  </a>
                </CarteGlow>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

/** URL publique de la chaîne, sans exécuter de contenu tiers dans Skkup. */
export function urlStreamExterne(stream: Stream): string {
  const identifiant = encodeURIComponent(stream.identifiantChaine);
  switch (stream.plateforme) {
    case "TWITCH":
      return "https://www.twitch.tv/" + identifiant;
    case "FACEBOOK":
      return "https://www.facebook.com/" + identifiant;
    case "YOUTUBE":
      return "https://www.youtube.com/channel/" + identifiant;
  }
}

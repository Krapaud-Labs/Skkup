"use client";

import { useEffect, useMemo, useState } from "react";
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
  const [recherche, setRecherche] = useState("");
  const [plateforme, setPlateforme] = useState<"TOUTES" | Stream["plateforme"]>("TOUTES");
  const [tentative, setTentative] = useState(0);

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
              : t.streamLoadError,
          );
        }
      });

    return () => {
      annule = true;
    };
  }, [t.streamLoadError, tentative]);

  const streamsFiltres = useMemo(() => {
    const terme = recherche.trim().toLocaleLowerCase();
    return (streams ?? []).filter((stream) => {
      const correspondPlateforme = plateforme === "TOUTES" || stream.plateforme === plateforme;
      const correspondRecherche = !terme || stream.nomAffiche.toLocaleLowerCase().includes(terme);
      return correspondPlateforme && correspondRecherche;
    });
  }, [plateforme, recherche, streams]);

  if (erreur) {
    return <div className="skuup-viewer-error"><p role="alert">{erreur}</p><button type="button" className="skuup-button skuup-button-outline" onClick={() => { setErreur(null); setTentative((value) => value + 1); }}>{langue === "en" ? "Retry" : "Réessayer"}</button></div>;
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
          {t.watchWhatYouWant}
        </h2>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-foreground-muted">
          {t.streamDescription}
        </p>
        <a href="/dashboard/extension" className="skuup-button skuup-button-outline mt-5 inline-flex">
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
          <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
            <div><p className="skuup-kicker">{t.selection}</p><h2 id="streams-catalogue-title" className="mt-1 text-xl font-bold text-foreground">{t.proposedChannels}</h2></div>
            <span className="skuup-dashboard-count" aria-label={`${streamsFiltres.length} chaîne(s)`}>{streamsFiltres.length}</span>
          </div>
          <div className="skuup-viewer-stream-filters" role="search" aria-label={langue === "en" ? "Filter streams" : "Filtrer les streams"}>
            <label><span>{langue === "en" ? "Search" : "Rechercher"}</span><input value={recherche} onChange={(event) => setRecherche(event.target.value)} placeholder={langue === "en" ? "Channel name" : "Nom de chaîne"} /></label>
            <label><span>{langue === "en" ? "Platform" : "Plateforme"}</span><select value={plateforme} onChange={(event) => setPlateforme(event.target.value as typeof plateforme)}><option value="TOUTES">{langue === "en" ? "All platforms" : "Toutes"}</option><option value="TWITCH">Twitch</option><option value="YOUTUBE">YouTube</option><option value="FACEBOOK">Facebook Live</option></select></label>
          </div>
          {streamsFiltres.length === 0 ? <CarteGlow><p className="text-sm text-foreground-muted">{langue === "en" ? "No channel matches these filters." : "Aucune chaîne ne correspond à ces filtres."}</p></CarteGlow> : <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {streamsFiltres.map((stream) => (
              <li key={stream.id}>
                <CarteGlow className="flex h-full flex-col justify-between">
                  <div>
                    <span className="skuup-stream-platform-badge"><SkkupIcon name="play" size={15} />
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
          </ul>}
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

"use client";

import { useEffect, useMemo, useState } from "react";
import { CarteGlow } from "@/components/ui/CarteGlow";
import { ErreurApi } from "@/lib/api";
import { listerStreams, type Stream } from "@/lib/streams";
import { SkkupIcon } from "@/components/ui/SkkupIcon";
import { traductions, useLanguage } from "@/components/i18n/LanguageProvider";
import { PlateformeBadge } from "./PlateformeBadge";

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
  const [plateforme, setPlateforme] = useState<"ALL" | Stream["plateforme"]>("ALL");
  const [favoris, setFavoris] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try { return JSON.parse(window.localStorage.getItem("skkup-viewer-favorites") ?? "[]") as string[]; } catch { return []; }
  });
  const [page, setPage] = useState(1);
  const pageSize = 6;

  const filtre = useMemo(() => (streams ?? []).filter((stream) => {
    const texte = `${stream.nomAffiche} ${stream.identifiantChaine}`.toLowerCase();
    return (plateforme === "ALL" || stream.plateforme === plateforme) && texte.includes(recherche.toLowerCase());
  }), [streams, recherche, plateforme]);
  const visibles = filtre.slice((page - 1) * pageSize, page * pageSize);
  const totalPages = Math.max(1, Math.ceil(filtre.length / pageSize));
  const basculerFavori = (id: string) => setFavoris((courants) => { const suivants = courants.includes(id) ? courants.filter((item) => item !== id) : [...courants, id]; try { window.localStorage?.setItem("skkup-viewer-favorites", JSON.stringify(suivants)); } catch { /* stockage local indisponible : le favori reste actif pour la session */ } return suivants; });

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
  }, [t.streamLoadError]);

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
          <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
            <p className="skuup-kicker">{t.selection}</p>
            <h2 id="streams-catalogue-title" className="mt-1 text-xl font-bold text-foreground">
              {t.proposedChannels}
            </h2>
            </div>
            <div className="flex flex-wrap gap-2" role="search">
              <label className="sr-only" htmlFor="stream-search">Rechercher un stream</label>
              <input id="stream-search" value={recherche} onChange={(event) => { setRecherche(event.target.value); setPage(1); }} placeholder="Rechercher" className="skuup-input h-10 w-44" />
              <select aria-label="Filtrer par plateforme" value={plateforme} onChange={(event) => { setPlateforme(event.target.value as typeof plateforme); setPage(1); }} className="skuup-input h-10 w-36"><option value="ALL">Toutes</option><option value="TWITCH">Twitch</option><option value="YOUTUBE">YouTube</option><option value="FACEBOOK">Facebook</option></select>
            </div>
          </div>
          {visibles.length === 0 ? <CarteGlow><p className="text-sm text-foreground-muted">Aucun stream ne correspond à ces filtres.</p></CarteGlow> : <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {visibles.map((stream) => (
              <li key={stream.id}>
                <CarteGlow className="flex h-full flex-col justify-between">
                  <div>
                    <PlateformeBadge plateforme={stream.plateforme} />
                    <h3 className="mt-2 text-lg font-bold text-foreground">
                      {stream.nomAffiche}
                    </h3>
                    <p className="mt-2 text-sm text-foreground-muted">{stream.estPartenaire ? "Partenaire Skkup" : "Chaîne recommandée"}{stream.bonusPointsHeure ? ` · +${stream.bonusPointsHeure} pts/h` : ""}</p>
                  </div>
                  <div className="mt-5 flex items-center justify-between gap-2"><button type="button" aria-label={`${favoris.includes(stream.id) ? "Retirer des" : "Ajouter aux"} favoris : ${stream.nomAffiche}`} onClick={() => basculerFavori(stream.id)} className="skuup-button skuup-button-outline">{favoris.includes(stream.id) ? "★" : "☆"}</button><a
                    href={urlStreamExterne(stream)}
                    target="_blank"
                    rel="noreferrer"
                    className="skuup-button skuup-button-outline mt-5 inline-flex w-fit"
                  >
                    {t.openStream}
                    <SkkupIcon name="arrow" size={17} />
                  </a></div>
                </CarteGlow>
              </li>
            ))}
          </ul>}
          {filtre.length > pageSize && <nav aria-label="Pagination des streams" className="skuup-viewer-pagination"><button type="button" className="skuup-button skuup-button-outline" disabled={page === 1} onClick={() => setPage((value) => value - 1)}>Précédente</button><span>{page} / {totalPages}</span><button type="button" className="skuup-button skuup-button-outline" disabled={page === totalPages} onClick={() => setPage((value) => value + 1)}>Suivante</button></nav>}
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

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
  const [plateforme, setPlateforme] = useState<"ALL" | Stream["plateforme"]>("ALL");
  const [favoris, setFavoris] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const stored = window.localStorage.getItem("skkup.stream-favorites");
      return stored ? JSON.parse(stored) as string[] : [];
    } catch {
      return [];
    }
  });
  const [page, setPage] = useState(1);
  const parPage = 6;

  const streamsFiltres = useMemo(() => {
    if (!streams) return [];
    const terme = recherche.trim().toLocaleLowerCase();
    return streams
      .filter((stream) => plateforme === "ALL" || stream.plateforme === plateforme)
      .filter((stream) => !terme || `${stream.nomAffiche} ${stream.identifiantChaine}`.toLocaleLowerCase().includes(terme))
      .sort((a, b) => Number(favoris.includes(b.id)) - Number(favoris.includes(a.id)));
  }, [favoris, plateforme, recherche, streams]);

  const pages = Math.max(1, Math.ceil(streamsFiltres.length / parPage));
  const streamsVisibles = streamsFiltres.slice((page - 1) * parPage, page * parPage);

  function basculerFavori(id: string) {
    setFavoris((courants) => {
      const suivants = courants.includes(id) ? courants.filter((courant) => courant !== id) : [...courants, id];
      try { window.localStorage.setItem("skkup.stream-favorites", JSON.stringify(suivants)); } catch { /* stockage optionnel */ }
      return suivants;
    });
  }

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
      {streams.length === 0 ? (
        <section aria-labelledby="streams-catalogue-title" className="skuup-stream-empty-shell">
          <div className="mb-4"><p className="skuup-kicker">{t.selection}</p><h2 id="streams-catalogue-title" className="mt-1 text-xl font-bold text-foreground">{t.proposedChannels}</h2></div>
          <div className="skuup-stream-filter-bar"><label><span>Rechercher un streamer</span><input aria-label="Rechercher un streamer" value={recherche} onChange={(event) => setRecherche(event.target.value)} placeholder="Rechercher un streamer…" className="skuup-admin-input" /></label><label><span>Plateforme</span><select aria-label="Filtrer par plateforme" value={plateforme} onChange={(event) => setPlateforme(event.target.value as typeof plateforme)} className="skuup-admin-input"><option value="ALL">Toutes les plateformes</option><option value="TWITCH">Twitch</option><option value="YOUTUBE">YouTube</option><option value="FACEBOOK">Facebook Live</option></select></label></div>
          <CarteGlow className="skuup-stream-empty-state"><SkkupIcon name="streams" size={34} /><div><strong>{t.emptyStreams}</strong><p>Le catalogue affichera ici les chaînes publiées et leurs liens externes vérifiés.</p></div><a className="skuup-button skuup-button-outline" href="/dashboard/extension">Configurer l’extension</a></CarteGlow>
        </section>
      ) : (
        <section aria-labelledby="streams-catalogue-title">
          <div className="mb-4">
            <p className="skuup-kicker">{t.selection}</p>
            <h2 id="streams-catalogue-title" className="mt-1 text-xl font-bold text-foreground">
              {t.proposedChannels}
            </h2>
          </div>
          <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-border-subtle bg-background/40 p-4 sm:flex-row">
            <label className="flex min-w-0 flex-1 items-center gap-2 text-sm text-foreground-muted">
              <span className="sr-only">Rechercher un streamer</span>
              <input aria-label="Rechercher un streamer" value={recherche} onChange={(event) => { setRecherche(event.target.value); setPage(1); }} placeholder="Rechercher un streamer…" className="skuup-admin-input w-full" />
            </label>
            <label className="text-sm text-foreground-muted">
              <span className="sr-only">Filtrer par plateforme</span>
              <select aria-label="Filtrer par plateforme" value={plateforme} onChange={(event) => { setPlateforme(event.target.value as typeof plateforme); setPage(1); }} className="skuup-admin-input">
                <option value="ALL">Toutes les plateformes</option>
                <option value="TWITCH">Twitch</option>
                <option value="YOUTUBE">YouTube</option>
                <option value="FACEBOOK">Facebook Live</option>
              </select>
            </label>
          </div>
          {streamsVisibles.length === 0 ? <CarteGlow><p className="text-sm text-foreground-muted">Aucun streamer ne correspond à ces filtres.</p></CarteGlow> : <ul className="skuup-stream-catalogue grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {streamsVisibles.map((stream) => (
              <li key={stream.id}>
                <CarteGlow className="skuup-stream-card flex h-full flex-col justify-between">
                  <div className="relative">
                    <div className="skuup-stream-card-art" aria-hidden="true"><SkkupIcon name="streams" size={40} /><span>{stream.estPartenaire ? "PARTENAIRE" : "CATALOGUE"}</span></div>
                    <button type="button" aria-label={`${favoris.includes(stream.id) ? "Retirer des favoris" : "Ajouter aux favoris"} : ${stream.nomAffiche}`} onClick={() => basculerFavori(stream.id)} className="absolute right-0 top-0 text-xl text-foreground-muted hover:text-accent-violet-light">{favoris.includes(stream.id) ? "♥" : "♡"}</button>
                    <span className="skuup-stream-card-badge text-xs font-semibold uppercase tracking-[.16em] text-accent-violet-light">
                      {libellesPlateforme[stream.plateforme]}
                    </span>
                    <h3 className="mt-2 text-lg font-bold text-foreground">
                      {stream.nomAffiche}
                    </h3>
                    <div className="skuup-stream-card-meta"><span>{stream.estPartenaire ? "Partenaire vérifié" : "Chaîne publiée"}</span><span>+{stream.bonusPointsHeure ?? 0} pts/h</span></div>
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
          {pages > 1 && <nav aria-label="Pages des streams" className="mt-5 flex items-center justify-center gap-3"><button type="button" className="skuup-button skuup-button-outline" onClick={() => setPage((courante) => Math.max(1, courante - 1))} disabled={page === 1}>Précédente</button><span aria-live="polite" className="text-sm text-foreground-muted">{page} / {pages}</span><button type="button" className="skuup-button skuup-button-outline" onClick={() => setPage((courante) => Math.min(pages, courante + 1))} disabled={page === pages}>Suivante</button></nav>}
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

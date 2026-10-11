"use client";

import { useEffect, useMemo, useState } from "react";
import { CarteGlow } from "@/components/ui/CarteGlow";
import { ErreurApi } from "@/lib/api";
import { libellesPlateforme, listerStreams, miniatureStream, type Stream } from "@/lib/streams";
import { ouvrirSessionVisionnage } from "@/lib/watch-sessions";
import { SkkupIcon } from "@/components/ui/SkkupIcon";
import { traductions, useLanguage } from "@/components/i18n/LanguageProvider";

const streamCopy = {
  fr: {
    loadErrorTitle: "Catalogue indisponible", retry: "Réessayer", search: "Rechercher un streamer", searchPlaceholder: "Rechercher un streamer…", platform: "Plateforme", allPlatforms: "Toutes les plateformes", summary: "Résumé du catalogue", published: "Chaînes publiées", verified: "Partenaires vérifiés", platforms: "Plateformes", filterPlatform: "Filtrer par plateforme", filterCategory: "Filtrer par catégorie", filterLanguage: "Filtrer par langue", sort: "Trier les streams", favoritesFirst: "Favoris d’abord", nameAZ: "Nom A-Z", bonusDesc: "Bonus décroissant", partnersFirst: "Partenaires d’abord", contractNote: "Catégorie et langue indisponibles : ces champs ne font pas partie du contrat du catalogue.", results: (n: number) => n === 1 ? "résultat" : "résultats", noMatch: "Aucun streamer ne correspond à ces filtres.", addFavorite: "Ajouter aux favoris", removeFavorite: "Retirer des favoris", favoriteSeparator: " : ", verifiedPartner: "Partenaire vérifié", publishedChannel: "Chaîne publiée", channelId: "Identifiant de chaîne", pages: "Pages des streams", previous: "Précédente", next: "Suivante", open: "Ouvrir le direct", opening: "Ouverture…", authRequired: "Connecte-toi pour comptabiliser ton visionnage.", trackingUnavailable: "Le suivi du visionnage est temporairement indisponible.", emptyDescription: "Le catalogue affichera ici les chaînes publiées et leurs liens externes vérifiés.", configure: "Configurer l’extension", thumbnail: (name: string) => `Miniature de ${name}`, noThumbnail: (name: string) => `Aucune miniature disponible pour ${name}`, partnerBadge: "PARTENAIRE", catalogueBadge: "CATALOGUE",
  },
  en: {
    loadErrorTitle: "Catalogue unavailable", retry: "Retry", search: "Search for a streamer", searchPlaceholder: "Search for a streamer…", platform: "Platform", allPlatforms: "All platforms", summary: "Catalogue summary", published: "Published channels", verified: "Verified partners", platforms: "Platforms", filterPlatform: "Filter by platform", filterCategory: "Filter by category", filterLanguage: "Filter by language", sort: "Sort streams", favoritesFirst: "Favorites first", nameAZ: "Name A-Z", bonusDesc: "Highest bonus", partnersFirst: "Partners first", contractNote: "Category and language unavailable: these fields are not part of the catalogue contract.", results: (n: number) => n === 1 ? "result" : "results", noMatch: "No streamer matches these filters.", addFavorite: "Add to favorites", removeFavorite: "Remove from favorites", favoriteSeparator: " : ", verifiedPartner: "Verified partner", publishedChannel: "Published channel", channelId: "Channel ID", pages: "Stream pages", previous: "Previous", next: "Next", open: "Open stream", opening: "Opening…", authRequired: "Sign in to track your viewing.", trackingUnavailable: "Viewing tracking is temporarily unavailable.", emptyDescription: "Published channels and their verified external links will appear here.", configure: "Configure the extension", thumbnail: (name: string) => `Thumbnail of ${name}`, noThumbnail: (name: string) => `No thumbnail available for ${name}`, partnerBadge: "PARTNER", catalogueBadge: "CATALOGUE",
  },
} as const;

/**
 * Catalogue des chaînes proposées par Skkup.
 *
 * Le visionnage reste libre sur la plateforme choisie. L'extension observe
 * ensuite l'onglet Twitch, YouTube ou Kick de l'utilisateur : aucun
 * lecteur n'est embarqué dans la vitrine et aucun stream n'est imposé.
 */
export function ListeStreams() {
  const { langue } = useLanguage();
  const t = traductions[langue].content;
  const copy = streamCopy[langue];
  const [streams, setStreams] = useState<Stream[] | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [recherche, setRecherche] = useState("");
  const [plateforme, setPlateforme] = useState<"ALL" | Stream["plateforme"]>("ALL");
  const [tri, setTri] = useState<"FAVORITES" | "NAME" | "BONUS" | "PARTNERS">("FAVORITES");
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
  const [tentative, setTentative] = useState(0);
  const [ouvertureEnCours, setOuvertureEnCours] = useState<string | null>(null);
  const [erreursOuverture, setErreursOuverture] = useState<Record<string, string>>({});
  const parPage = 6;

  const streamsFiltres = useMemo(() => {
    if (!streams) return [];
    const terme = recherche.trim().toLocaleLowerCase();
    return [...streams
      .filter((stream) => plateforme === "ALL" || stream.plateforme === plateforme)
      .filter((stream) => !terme || `${stream.nomAffiche} ${stream.identifiantChaine}`.toLocaleLowerCase().includes(terme))
      .sort((a, b) => {
        if (tri === "NAME") return a.nomAffiche.localeCompare(b.nomAffiche, "fr");
        if (tri === "BONUS") return (b.bonusPointsHeure ?? 0) - (a.bonusPointsHeure ?? 0) || a.nomAffiche.localeCompare(b.nomAffiche, "fr");
        if (tri === "PARTNERS") return Number(b.estPartenaire) - Number(a.estPartenaire) || a.nomAffiche.localeCompare(b.nomAffiche, "fr");
        return Number(favoris.includes(b.id)) - Number(favoris.includes(a.id)) || a.nomAffiche.localeCompare(b.nomAffiche, "fr");
      })];
  }, [favoris, plateforme, recherche, streams, tri]);

  const pages = Math.max(1, Math.ceil(streamsFiltres.length / parPage));
  const streamsVisibles = streamsFiltres.slice((page - 1) * parPage, page * parPage);

  function basculerFavori(id: string) {
    setFavoris((courants) => {
      const suivants = courants.includes(id) ? courants.filter((courant) => courant !== id) : [...courants, id];
      try { window.localStorage.setItem("skkup.stream-favorites", JSON.stringify(suivants)); } catch { /* stockage optionnel */ }
      return suivants;
    });
  }

  async function ouvrirStream(stream: Stream) {
    setOuvertureEnCours(stream.id);
    setErreursOuverture((courantes) => ({ ...courantes, [stream.id]: "" }));
    try {
      await ouvrirSessionVisionnage(stream.plateforme, stream.identifiantChaine);
    } catch (exception: unknown) {
      // La session est une capacité authentifiée et optionnelle pour le lien
      // externe. On conserve l'ouverture du direct, mais on expose l'échec
      // pour ne pas prétendre que le visionnage est suivi.
      setErreursOuverture((courantes) => ({
        ...courantes,
        [stream.id]: exception instanceof ErreurApi && exception.statut === 401
          ? copy.authRequired
          : copy.trackingUnavailable,
      }));
    } finally {
      setOuvertureEnCours(null);
    }
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
  }, [t.streamLoadError, tentative]);

  if (erreur) {
    return <section className="skuup-viewer-error" aria-labelledby="streams-error-title">
      <SkkupIcon name="streams" size={28} aria-hidden="true" />
      <div><h2 id="streams-error-title">{copy.loadErrorTitle}</h2><p role="alert">{erreur}</p></div>
      <button type="button" className="skuup-button skuup-button-outline" onClick={() => { setErreur(null); setStreams(null); setTentative((value) => value + 1); }}>{copy.retry}</button>
    </section>;
  }

  if (streams === null) {
    return (
      <section className="skuup-viewer-loading" aria-label={t.loadingStreams} role="status"><span /><span /><span /></section>
    );
  }

  return (
    <div className="flex w-full flex-col gap-6">
      {streams.length === 0 ? (
        <section aria-labelledby="streams-catalogue-title" className="skuup-stream-empty-shell">
          <div className="mb-4"><p className="skuup-kicker">{t.selection}</p><h2 id="streams-catalogue-title" className="mt-1 text-xl font-bold text-foreground">{t.proposedChannels}</h2></div>
          <div className="skuup-stream-filter-bar"><label><span>{copy.search}</span><input aria-label={copy.search} value={recherche} onChange={(event) => setRecherche(event.target.value)} placeholder={copy.searchPlaceholder} className="skuup-admin-input" /></label><label><span>{copy.platform}</span><select aria-label={copy.filterPlatform} value={plateforme} onChange={(event) => setPlateforme(event.target.value as typeof plateforme)} className="skuup-admin-input"><option value="ALL">{copy.allPlatforms}</option>{(Object.keys(libellesPlateforme) as Stream["plateforme"][]).map((nom) => <option key={nom} value={nom}>{libellesPlateforme[nom]}</option>)}</select></label></div>
          <CarteGlow className="skuup-stream-empty-state"><SkkupIcon name="streams" size={34} /><div><strong>{t.emptyStreams}</strong><p>{copy.emptyDescription}</p></div><a className="skuup-button skuup-button-outline" href="/extension">{copy.configure}</a></CarteGlow>
        </section>
      ) : (
        <section aria-labelledby="streams-catalogue-title">
          <div className="mb-4">
            <p className="skuup-kicker">{t.selection}</p>
            <h2 id="streams-catalogue-title" className="mt-1 text-xl font-bold text-foreground">
              {t.proposedChannels}
            </h2>
          </div>
          <div className="skuup-secondary-stats" aria-label={copy.summary}>
            <div><span>{copy.published}</span><strong>{streams.length}</strong></div>
            <div><span>{copy.verified}</span><strong>{streams.filter((stream) => stream.estPartenaire).length}</strong></div>
            <div><span>{copy.platforms}</span><strong>{new Set(streams.map((stream) => stream.plateforme)).size}</strong></div>
          </div>
          <div className="skuup-stream-platform-tabs" role="group" aria-label={copy.filterPlatform}>
            <button type="button" aria-pressed={plateforme === "ALL"} className={plateforme === "ALL" ? "is-active" : ""} onClick={() => { setPlateforme("ALL"); setPage(1); }}>{copy.allPlatforms} <strong>{streams.length}</strong></button>
            {(Object.keys(libellesPlateforme) as Stream["plateforme"][]).map((nom) => {
              const count = streams.filter((stream) => stream.plateforme === nom).length;
              return <button key={nom} type="button" aria-pressed={plateforme === nom} className={plateforme === nom ? "is-active" : ""} onClick={() => { setPlateforme(nom); setPage(1); }}>{libellesPlateforme[nom]} <strong>{count}</strong></button>;
            })}
          </div>
          <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-border-subtle bg-background/40 p-4 sm:flex-row sm:flex-wrap">
            <label className="flex min-w-0 flex-1 items-center gap-2 text-sm text-foreground-muted">
              <span className="sr-only">{copy.search}</span>
              <input aria-label={copy.search} value={recherche} onChange={(event) => { setRecherche(event.target.value); setPage(1); }} placeholder={copy.searchPlaceholder} className="skuup-admin-input w-full" />
            </label>
            <label className="text-sm text-foreground-muted">
              <span className="sr-only">{copy.filterPlatform}</span>
              <select aria-label={copy.filterPlatform} value={plateforme} onChange={(event) => { setPlateforme(event.target.value as typeof plateforme); setPage(1); }} className="skuup-admin-input">
                <option value="ALL">{copy.allPlatforms}</option>
                {(Object.keys(libellesPlateforme) as Stream["plateforme"][]).map((nom) => (
                  <option key={nom} value={nom}>{libellesPlateforme[nom]}</option>
                ))}
              </select>
            </label>
            <label className="text-sm text-foreground-muted"><span className="sr-only">{copy.filterCategory}</span><select aria-label={copy.filterCategory} disabled className="skuup-admin-input"><option>{copy.filterCategory}</option></select></label>
            <label className="text-sm text-foreground-muted"><span className="sr-only">{copy.filterLanguage}</span><select aria-label={copy.filterLanguage} disabled className="skuup-admin-input"><option>{copy.filterLanguage}</option></select></label>
            <label className="text-sm text-foreground-muted"><span className="sr-only">{copy.sort}</span><select aria-label={copy.sort} value={tri} onChange={(event) => { setTri(event.target.value as typeof tri); setPage(1); }} className="skuup-admin-input"><option value="FAVORITES">{copy.favoritesFirst}</option><option value="NAME">{copy.nameAZ}</option><option value="BONUS">{copy.bonusDesc}</option><option value="PARTNERS">{copy.partnersFirst}</option></select></label>
            <p className="skuup-stream-contract-note" role="note">{copy.contractNote}</p>
          </div>
          <p className="sr-only" aria-live="polite">{streamsVisibles.length} {copy.results(streamsVisibles.length)}</p>
          {streamsVisibles.length === 0 ? <CarteGlow><p className="text-sm text-foreground-muted">{copy.noMatch}</p></CarteGlow> : <ul className="skuup-stream-catalogue grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {streamsVisibles.map((stream) => (
              <li key={stream.id}>
                <CarteGlow className="skuup-stream-card flex h-full flex-col justify-between">
                  <div className="relative">
                    <StreamThumbnail stream={stream} />
                    <button type="button" aria-label={`${favoris.includes(stream.id) ? copy.removeFavorite : copy.addFavorite}${copy.favoriteSeparator}${stream.nomAffiche}`} onClick={() => basculerFavori(stream.id)} className="skuup-stream-favorite absolute right-0 top-0 text-xl text-foreground-muted hover:text-accent-violet-light">{favoris.includes(stream.id) ? "♥" : "♡"}</button>
                    <span className="skuup-stream-card-badge text-xs font-semibold uppercase tracking-[.16em] text-accent-violet-light">
                      {libellesPlateforme[stream.plateforme]}
                    </span>
                    <h3 className="mt-2 text-lg font-bold text-foreground">
                      {stream.nomAffiche}
                    </h3>
                    <p className="skuup-stream-card-handle" aria-label={copy.channelId}>{stream.identifiantChaine}</p>
                    <div className="skuup-stream-card-meta"><span>{stream.estPartenaire ? copy.verifiedPartner : copy.publishedChannel}</span>{stream.bonusPointsHeure !== undefined && <span>+{stream.bonusPointsHeure} pts/h</span>}</div>
                  </div>
                  <div className="mt-5 flex flex-wrap items-center gap-3">
                  <a
                    href={urlStreamExterne(stream)}
                    target="_blank"
                    rel="noreferrer"
                    className="skuup-button skuup-button-outline inline-flex w-fit"
                    onClick={() => { void ouvrirStream(stream); }}
                  >
                    {ouvertureEnCours === stream.id ? copy.opening : t.openStream}
                    <SkkupIcon name="arrow" size={17} />
                  </a>
                  {erreursOuverture[stream.id] && <span role="status" className="w-full text-xs text-foreground-muted">{erreursOuverture[stream.id]}</span>}
                  </div>
                </CarteGlow>
              </li>
            ))}
          </ul>}
          {pages > 1 && <nav aria-label={copy.pages} className="mt-5 flex items-center justify-center gap-3"><button type="button" className="skuup-button skuup-button-outline" onClick={() => setPage((courante) => Math.max(1, courante - 1))} disabled={page === 1}>{copy.previous}</button><span aria-live="polite" className="text-sm text-foreground-muted">{page} / {pages}</span><button type="button" className="skuup-button skuup-button-outline" onClick={() => setPage((courante) => Math.min(pages, courante + 1))} disabled={page === pages}>{copy.next}</button></nav>}
        </section>
      )}
    </div>
  );
}

function StreamThumbnail({ stream }: { stream: Stream }) {
  const { langue } = useLanguage();
  const copy = streamCopy[langue];
  const [indisponible, setIndisponible] = useState(!miniatureStream(stream));
  const src = miniatureStream(stream);
  if (indisponible || !src) {
    return <div className="skuup-stream-card-art" role="img" aria-label={copy.noThumbnail(stream.nomAffiche)}><SkkupIcon name="streams" size={40} aria-hidden="true" /><span>{stream.estPartenaire ? copy.partnerBadge : copy.catalogueBadge}</span></div>;
  }
  return <div className="skuup-stream-card-art"><img src={src} alt={copy.thumbnail(stream.nomAffiche)} loading="lazy" onError={() => setIndisponible(true)} /><span>{stream.estPartenaire ? copy.partnerBadge : copy.catalogueBadge}</span></div>;
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

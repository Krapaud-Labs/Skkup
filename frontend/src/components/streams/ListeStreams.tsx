"use client";

/* Stream thumbnails are external provider URLs from the API contract. */
/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useState } from "react";
import { CarteGlow } from "@/components/ui/CarteGlow";
import { ErreurApi } from "@/lib/api";
import { libellesPlateforme, listerStreams, miniatureStream, type Stream } from "@/lib/streams";
import { SkkupIcon } from "@/components/ui/SkkupIcon";
import { traductions, useLanguage } from "@/components/i18n/LanguageProvider";
import { listerAppareilsApparies } from "@/lib/extension";

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
  const [tentative, setTentative] = useState(0);
  const [miniaturesIndisponibles, setMiniaturesIndisponibles] = useState<string[]>([]);
  const [appareils, setAppareils] = useState<"loading" | "error" | "empty" | "connected">("loading");
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

  function marquerMiniatureIndisponible(id: string) {
    setMiniaturesIndisponibles((courantes) => courantes.includes(id) ? courantes : [...courantes, id]);
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

  useEffect(() => {
    let annule = false;
    listerAppareilsApparies()
      .then(({ appareils: resultats }) => {
        if (!annule) setAppareils(resultats.some((appareil) => appareil.statut === "ACTIF") ? "connected" : "empty");
      })
      .catch(() => { if (!annule) setAppareils("error"); });
    return () => { annule = true; };
  }, []);

  if (erreur) {
    return <section className="skuup-viewer-error" aria-labelledby="streams-error-title">
      <SkkupIcon name="streams" size={28} aria-hidden="true" />
      <div><h2 id="streams-error-title">Catalogue indisponible</h2><p role="alert">{erreur}</p></div>
      <button type="button" className="skuup-button skuup-button-outline" onClick={() => { setErreur(null); setStreams(null); setTentative((value) => value + 1); }}>Réessayer</button>
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
          <div className="skuup-stream-filter-bar"><label><span>Rechercher un streamer</span><input aria-label="Rechercher un streamer" value={recherche} onChange={(event) => setRecherche(event.target.value)} placeholder="Rechercher un streamer…" className="skuup-admin-input" /></label><label><span>Plateforme</span><select aria-label="Filtrer par plateforme" value={plateforme} onChange={(event) => setPlateforme(event.target.value as typeof plateforme)} className="skuup-admin-input"><option value="ALL">Toutes les plateformes</option><option value="TWITCH">Twitch</option><option value="YOUTUBE">YouTube</option><option value="FACEBOOK">Facebook Live</option></select></label></div>
          <CarteGlow className="skuup-stream-empty-state"><SkkupIcon name="streams" size={34} /><div><strong>{t.emptyStreams}</strong><p>Le catalogue affichera ici les chaînes publiées et leurs liens externes vérifiés.</p></div><a className="skuup-button skuup-button-outline" href="/dashboard/extension">Configurer l’extension</a></CarteGlow>
        </section>
      ) : (
        <section aria-labelledby="streams-catalogue-title">
          <section className="skuup-stream-extension-banner" aria-live="polite" aria-labelledby="streams-extension-title">
            <span className="skuup-stream-extension-icon" aria-hidden="true"><SkkupIcon name="extension" size={22} /><span className={`skuup-stream-extension-indicator ${appareils === "connected" ? "is-connected" : ""}`} /></span>
            <div>
              <h2 id="streams-extension-title">Extension Skkup</h2>
              <p>{appareils === "loading" ? "Vérification de l’extension…" : appareils === "connected" ? "Extension connectée et prête à comptabiliser ton visionnage." : appareils === "empty" ? "Aucune extension associée à ce compte." : "État de l’extension indisponible."}</p>
            </div>
            <a className="skuup-button skuup-button-outline" href="/dashboard/extension">Gérer l’extension <span aria-hidden="true">›</span></a>
          </section>
          <div className="mb-4">
            <p className="skuup-kicker">{t.selection}</p>
            <h2 id="streams-catalogue-title" className="mt-1 text-xl font-bold text-foreground">
              {t.proposedChannels}
            </h2>
          </div>
          <div className="skuup-secondary-stats" aria-label="Résumé du catalogue">
            <div><span>Chaînes publiées</span><strong>{streams.length}</strong></div>
            <div><span>Partenaires vérifiés</span><strong>{streams.filter((stream) => stream.estPartenaire).length}</strong></div>
            <div><span>Plateformes</span><strong>{new Set(streams.map((stream) => stream.plateforme)).size}</strong></div>
          </div>
          <div className="skuup-stream-platform-tabs" role="tablist" aria-label="Filtrer par plateforme">
            <button type="button" role="tab" aria-selected={plateforme === "ALL"} className={plateforme === "ALL" ? "is-active" : ""} onClick={() => { setPlateforme("ALL"); setPage(1); }}>Toutes <span>{streams.length}</span></button>
            {(Object.keys(libellesPlateforme) as Stream["plateforme"][]).map((nom) => <button key={nom} type="button" role="tab" aria-selected={plateforme === nom} className={plateforme === nom ? "is-active" : ""} onClick={() => { setPlateforme(nom); setPage(1); }}>{libellesPlateforme[nom]} <span>{streams.filter((stream) => stream.plateforme === nom).length}</span></button>)}
          </div>
          <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-border-subtle bg-background/40 p-4 sm:flex-row">
            <label className="flex min-w-0 flex-1 items-center gap-2 text-sm text-foreground-muted">
              <span className="sr-only">Rechercher un streamer</span>
              <input aria-label="Rechercher un streamer" value={recherche} onChange={(event) => { setRecherche(event.target.value); setPage(1); }} placeholder="Rechercher un streamer…" className="skuup-admin-input w-full" />
            </label>
          </div>
          {streamsVisibles.length === 0 ? <CarteGlow><p className="text-sm text-foreground-muted">Aucun streamer ne correspond à ces filtres.</p></CarteGlow> : <ul className="skuup-stream-catalogue grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {streamsVisibles.map((stream) => (
              <li key={stream.id}>
                <CarteGlow className="skuup-stream-card flex h-full flex-col" role="article" aria-labelledby={`stream-title-${stream.id}`}>
                  <div className="relative">
                    {miniatureStream(stream) && !miniaturesIndisponibles.includes(stream.id) ? <div className="skuup-stream-card-art overflow-hidden"><img src={miniatureStream(stream) ?? undefined} alt={`Miniature de ${stream.nomAffiche}`} className="h-full w-full object-cover" loading="lazy" referrerPolicy="no-referrer" onError={() => marquerMiniatureIndisponible(stream.id)} /><span className="skuup-stream-card-status">{stream.estPartenaire ? "PARTENAIRE" : "CATALOGUE"}</span><span className="skuup-stream-card-platform">{libellesPlateforme[stream.plateforme]}</span></div> : <div className="skuup-stream-card-art skuup-stream-card-art-empty" aria-label={`Aucune miniature disponible pour ${stream.nomAffiche}`}><span className="skuup-stream-card-art-empty-label">Miniature indisponible</span><span className="skuup-stream-card-status">{stream.estPartenaire ? "PARTENAIRE" : "CATALOGUE"}</span><span className="skuup-stream-card-platform">{libellesPlateforme[stream.plateforme]}</span></div>}
                    <button type="button" aria-label={`${favoris.includes(stream.id) ? "Retirer des favoris" : "Ajouter aux favoris"} : ${stream.nomAffiche}`} aria-pressed={favoris.includes(stream.id)} onClick={() => basculerFavori(stream.id)} className="skuup-stream-card-favorite">{favoris.includes(stream.id) ? "♥" : "♡"}</button>
                  </div>
                  <div className="skuup-stream-card-body">
                    <div className="skuup-stream-card-heading">
                      <div className="min-w-0">
                        <h3 id={`stream-title-${stream.id}`}>{stream.nomAffiche}</h3>
                        <p className="skuup-stream-card-handle" title={stream.identifiantChaine}>{stream.identifiantChaine}</p>
                      </div>
                      <span className="skuup-stream-card-points"><SkkupIcon name="points" size={14} />{stream.bonusPointsHeure !== undefined ? `+${stream.bonusPointsHeure} pts/h` : "Points selon le règlement"}</span>
                    </div>
                    <div className="skuup-stream-card-meta"><span>{stream.estPartenaire ? "Partenaire vérifié" : "Chaîne publiée"}</span></div>
                    <a href={urlStreamExterne(stream)} target="_blank" rel="noreferrer" className="skuup-button skuup-button-outline skuup-stream-card-cta">
                      {t.openStream}
                      <SkkupIcon name="arrow" size={17} />
                    </a>
                  </div>
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

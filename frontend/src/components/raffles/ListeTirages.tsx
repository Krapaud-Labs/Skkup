"use client";

/* Raffle media is provided by the API and can be remote or absent. */
/* eslint-disable @next/next/no-img-element */

import { useCallback, useEffect, useState } from "react";
import { CarteGlow } from "@/components/ui/CarteGlow";
import { ErreurApi } from "@/lib/api";
import { inscrireTirage } from "@/lib/dashboard";
import { traductions, useLanguage } from "@/components/i18n/LanguageProvider";
import { SkkupIcon } from "@/components/ui/SkkupIcon";
import {
  listerTirages,
  recupererResultat,
  type ResultatTirage,
  type Tirage,
} from "@/lib/raffles";

function formaterDate(date: string, langue: "fr" | "en") {
  return new Intl.DateTimeFormat(langue === "fr" ? "fr-FR" : "en-US", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(new Date(date));
}

function tempsRestant(date: string, maintenant = Date.now()) {
  const secondes = Math.max(0, Math.floor((new Date(date).getTime() - maintenant) / 1000));
  const jours = Math.floor(secondes / 86400);
  const heures = Math.floor((secondes % 86400) / 3600);
  const minutes = Math.floor((secondes % 3600) / 60);
  return jours > 0 ? `${jours} j ${heures} h` : `${heures} h ${minutes} min`;
}

export function ListeTirages() {
  const { langue } = useLanguage();
  const t = traductions[langue].content;
  const [tirages, setTirages] = useState<Tirage[] | null>(null);
  const [resultats, setResultats] = useState<Record<string, ResultatTirage>>({});
  const [erreursResultats, setErreursResultats] = useState<Record<string, string>>({});
  const [chargementsResultats, setChargementsResultats] = useState<Record<string, boolean>>({});
  const [inscriptions, setInscriptions] = useState<Record<string, string>>({});
  const [chargementsInscriptions, setChargementsInscriptions] = useState<Record<string, boolean>>({});
  const [erreur, setErreur] = useState<string | null>(null);
  const [filtre, setFiltre] = useState<"TOUS" | "OUVERT" | "CLOTURE" | "TIRE">("TOUS");
  const [recherche, setRecherche] = useState("");
  const [selection, setSelection] = useState<string | null>(null);
  const [tentative, setTentative] = useState(0);
  const [maintenant, setMaintenant] = useState(() => Date.now());

  useEffect(() => {
    const intervalle = window.setInterval(() => setMaintenant(Date.now()), 60_000);
    return () => window.clearInterval(intervalle);
  }, []);

  const chargerResultat = useCallback(async (tirage: Tirage) => {
    setChargementsResultats((courants) => ({ ...courants, [tirage.id]: true }));
    setErreursResultats((courantes) => {
      const suivantes = { ...courantes };
      delete suivantes[tirage.id];
      return suivantes;
    });
    try {
      const resultat = await recupererResultat(tirage.id);
      setResultats((courants) => ({ ...courants, [tirage.id]: resultat }));
    } catch (exception) {
      setErreursResultats((courantes) => ({ ...courantes, [tirage.id]: exception instanceof ErreurApi ? exception.message : "Résultat temporairement indisponible." }));
    } finally {
      setChargementsResultats((courants) => ({ ...courants, [tirage.id]: false }));
    }
  }, []);

  const participer = useCallback(async (tirage: Tirage) => {
    setChargementsInscriptions((courants) => ({ ...courants, [tirage.id]: true }));
    try {
      const resultat = await inscrireTirage(tirage.id);
      setInscriptions((courantes) => ({ ...courantes, [tirage.id]: `ticket:${resultat.ticketId}` }));
    } catch (exception: unknown) {
      setInscriptions((courantes) => ({
        ...courantes,
        [tirage.id]: exception instanceof ErreurApi ? exception.message : "Participation indisponible pour le moment.",
      }));
    } finally {
      setChargementsInscriptions((courants) => ({ ...courants, [tirage.id]: false }));
    }
  }, []);

  useEffect(() => {
    let annule = false;

    listerTirages()
      .then(async (liste) => {
        if (annule) return;
        setTirages(liste);
        setSelection((courante) => courante && liste.some((item) => item.id === courante) ? courante : liste[0]?.id ?? null);
        const publies = liste.filter((tirage) => tirage.statut === "TIRE");
        await Promise.all(publies.map((tirage) => chargerResultat(tirage)));
      })
      .catch((exception: unknown) => {
        if (!annule) {
          setErreur(
            exception instanceof ErreurApi
              ? exception.message
              : "Impossible de charger les tirages pour le moment.",
          );
        }
      });

    return () => {
      annule = true;
    };
  }, [chargerResultat, tentative]);

  if (erreur) {
    return <section className="skuup-viewer-error" aria-labelledby="raffles-error-title"><SkkupIcon name="gift" size={28} /><div><h2 id="raffles-error-title">Tirages indisponibles</h2><p role="alert">{erreur}</p></div><button type="button" className="skuup-button skuup-button-outline" onClick={() => { setErreur(null); setTirages(null); setTentative((value) => value + 1); }}>Réessayer</button></section>;
  }
  if (tirages === null) {
    return <section className="skuup-raffles-workspace skuup-raffles-loading" aria-label={t.loading} aria-busy="true" role="status">
      <div className="skuup-raffles-toolbar skuup-loading-block"><div className="skuup-raffles-toolbar-row"><span className="skuup-loading-line skuup-loading-line-wide" /><span className="skuup-loading-line skuup-loading-line-tabs" /></div></div>
      <div className="skuup-raffles-master-detail"><div className="skuup-raffles-list skuup-loading-list"><span /><span /><span /></div><CarteGlow className="skuup-raffle-detail skuup-loading-detail"><span className="skuup-loading-line skuup-loading-line-short" /><span className="skuup-loading-line skuup-loading-line-title" /><span className="skuup-loading-line skuup-loading-line-body" /><span className="skuup-loading-line skuup-loading-line-body" /></CarteGlow></div>
    </section>;
  }
  if (tirages.length === 0) {
    return <section aria-label="Tirages disponibles" className="skuup-raffles-workspace skuup-raffles-empty-workspace"><div className="skuup-raffles-toolbar"><div className="skuup-raffles-toolbar-row"><label className="skuup-raffles-search">Rechercher<input aria-label="Rechercher un tirage" value={recherche} onChange={(event) => setRecherche(event.target.value)} placeholder="Rechercher un lot ou un tirage…" /></label><div role="tablist" aria-label="Statut des tirages" className="skuup-raffles-tabs">{([['TOUS', 'Tous'], ['OUVERT', t.open], ['CLOTURE', t.closed], ['TIRE', t.published]] as const).map(([value, label]) => <button key={value} type="button" role="tab" aria-selected={filtre === value} className={filtre === value ? "is-active" : ""} onClick={() => setFiltre(value)}>{label}<span>0</span></button>)}</div></div></div><CarteGlow className="skuup-raffles-empty"><SkkupIcon name="gift" size={34} /><div><strong>{t.noDraws}</strong><p>Les tirages publiés par Skkup apparaîtront ici avec leurs lots, dates et règles.</p></div><a className="skuup-button skuup-button-outline" href="/dashboard/reglement">Lire le règlement</a></CarteGlow></section>;
  }

  const terme = recherche.trim().toLocaleLowerCase();
  const visibles = tirages.filter((tirage) => (filtre === "TOUS" || tirage.statut === filtre) && (!terme || `${tirage.titre} ${tirage.description ?? ""}`.toLocaleLowerCase().includes(terme)));
  const selectionne = visibles.find((tirage) => tirage.id === selection) ?? visibles[0] ?? null;

  const libelleStatut = (statut: Tirage["statut"]) => statut === "OUVERT" ? t.open : statut === "CLOTURE" ? t.closed : t.published;

  return (
    <section aria-label="Tirages disponibles" className="skuup-raffles-workspace">
      <div className="skuup-raffles-toolbar">
        <div className="skuup-raffles-toolbar-row"><label className="skuup-raffles-search">Rechercher<input aria-label="Rechercher un tirage" value={recherche} onChange={(event) => setRecherche(event.target.value)} placeholder="Rechercher un lot ou un tirage…" /></label><div role="tablist" aria-label="Statut des tirages" className="skuup-raffles-tabs">
          {([["TOUS", "Tous"], ["OUVERT", t.open], ["CLOTURE", t.closed], ["TIRE", t.published]] as const).map(([value, label]) => (
            <button key={value} type="button" role="tab" aria-selected={filtre === value} className={filtre === value ? "is-active" : ""} onClick={() => setFiltre(value)}>{label}<span>{value === "TOUS" ? tirages.length : tirages.filter((item) => item.statut === value).length}</span></button>
          ))}
        </div></div>
      </div>
      <div className="skuup-raffles-master-detail">
        <div className="skuup-raffles-list" aria-label="Liste des tirages">
          {visibles.map((tirage) => (
            <button key={tirage.id} type="button" className={`skuup-raffle-list-item ${tirage.id === selectionne?.id ? "is-selected" : ""}`} onClick={() => setSelection(tirage.id)} aria-pressed={tirage.id === selectionne?.id}>
              <span className="skuup-raffle-card-media">
                {tirage.lots[0]?.imageUrl ? <img src={tirage.lots[0].imageUrl} alt="" /> : <SkkupIcon name="ticket" size={34} aria-hidden="true" />}
                <span className={`skuup-raffle-status skuup-raffle-status-${tirage.statut.toLowerCase()}`}>{libelleStatut(tirage.statut)}</span>
                <span
                  className="skuup-raffle-countdown"
                  role="status"
                  aria-live="polite"
                  aria-atomic="true"
                  aria-label={tirage.statut === "OUVERT" ? "Temps restant avant le tirage" : "Date du tirage"}
                >
                  <SkkupIcon name="timer" size={14} aria-hidden="true" />
                  {tirage.statut === "OUVERT" ? tempsRestant(tirage.dateTirage, maintenant) : formaterDate(tirage.dateTirage, langue)}
                </span>
              </span>
              <span className="skuup-raffle-card-body"><strong>{tirage.titre}</strong>{tirage.description && <span>{tirage.description}</span>}<span className="skuup-raffle-card-meta"><span>{tirage.lots.length} lot{tirage.lots.length > 1 ? "s" : ""}</span><span>{tirage.ticketsDistribues} ticket{tirage.ticketsDistribues > 1 ? "s" : ""} distribué{tirage.ticketsDistribues > 1 ? "s" : ""}</span></span>{tirage.lots.length > 0 && <span className="skuup-raffle-card-prize">{tirage.lots.slice(0, 2).map((lot) => lot.nom).join(" · ")}</span>}</span>
            </button>
          ))}
          {visibles.length === 0 && <p className="skuup-viewer-empty">Aucun tirage ne correspond à ce filtre.</p>}
        </div>
        {selectionne && <CarteGlow className="skuup-raffle-detail">
          <div className="skuup-raffle-detail-hero"><div className="skuup-raffle-art" aria-hidden="true">{selectionne.lots[0]?.imageUrl ? <img src={selectionne.lots[0].imageUrl} alt="" /> : <SkkupIcon name="ticket" size={36} />}</div><div><p className="skuup-kicker">{libelleStatut(selectionne.statut)}</p><h2>{selectionne.titre}</h2><p className="skuup-raffle-detail-date">Tirage prévu le {formaterDate(selectionne.dateTirage, langue)}</p></div></div>
          {selectionne.description && <p className="skuup-raffle-description">{selectionne.description}</p>}
          <div className="skuup-raffle-summary" aria-label="Résumé du tirage"><div><span className="skuup-raffle-summary-icon" aria-hidden="true"><SkkupIcon name="gift" size={18} /></span><strong>{selectionne.lots.length}</strong><small>lot{selectionne.lots.length > 1 ? "s" : ""} à gagner</small></div><div><span className="skuup-raffle-summary-icon" aria-hidden="true"><SkkupIcon name="ticket" size={18} /></span><strong>{selectionne.ticketsDistribues}</strong><small>ticket{selectionne.ticketsDistribues > 1 ? "s" : ""} distribué{selectionne.ticketsDistribues > 1 ? "s" : ""}</small></div>{selectionne.statut === "OUVERT" && <div role="status" aria-live="polite" aria-atomic="true" aria-label="Temps restant avant le tirage"><span className="skuup-raffle-summary-icon" aria-hidden="true"><SkkupIcon name="timer" size={18} /></span><strong>{tempsRestant(selectionne.dateTirage, maintenant)}</strong><small>avant le tirage</small></div>}</div>
          <dl className="skuup-raffle-meta"><div><dt>Ouverture</dt><dd>{formaterDate(selectionne.dateOuverture, langue)}</dd></div><div><dt>Tirage</dt><dd>{formaterDate(selectionne.dateTirage, langue)}</dd></div></dl>
          <div className="skuup-raffle-prizes"><h3>{t.prizes}</h3><ul>{selectionne.lots.map((lot) => <li key={lot.id}>{lot.imageUrl ? <img src={lot.imageUrl} alt={`Illustration du lot ${lot.nom}`} /> : <SkkupIcon name="gift" size={18} aria-hidden="true" />}<span><strong>{lot.quantite} × {lot.nom}</strong>{lot.fournisseur && <small>{lot.fournisseur}</small>}{lot.valeurEstimee !== null && <small>{lot.valeurEstimee.toLocaleString(langue === "fr" ? "fr-FR" : "en-US")} €</small>}</span></li>)}</ul>{selectionne.lots.length === 0 && <p className="skuup-viewer-empty">Aucun lot n’est publié pour ce tirage.</p>}</div>
          {selectionne.statut === "OUVERT" && <div className="skuup-raffle-action">{inscriptions[selectionne.id]?.startsWith("ticket:") ? <p role="status" className="skuup-viewer-status">Participation enregistrée. Ton ticket est prêt.</p> : inscriptions[selectionne.id] ? <p role="alert" className="skuup-viewer-error">{inscriptions[selectionne.id]}</p> : <button type="button" className="skuup-button skuup-button-primary" disabled={chargementsInscriptions[selectionne.id] === true} onClick={() => void participer(selectionne)}>{chargementsInscriptions[selectionne.id] ? "Participation…" : "Participer au tirage"}</button>}</div>}
          {selectionne.statut === "TIRE" && <div className="skuup-raffle-result"><h3>{t.winners}</h3>{chargementsResultats[selectionne.id] ? <p role="status">{t.loading}</p> : erreursResultats[selectionne.id] ? <div><p role="alert">{erreursResultats[selectionne.id]}</p><button className="skuup-button skuup-button-outline" type="button" onClick={() => void chargerResultat(selectionne)}>Réessayer</button></div> : !resultats[selectionne.id] ? <p role="status">{t.loading}</p> : resultats[selectionne.id].gagnants.length === 0 ? <p className="skuup-viewer-empty">{t.noWinners}</p> : <ul>{resultats[selectionne.id].gagnants.map((gagnant) => <li key={gagnant.ticketId}><strong>{gagnant.pseudo}</strong><span>{gagnant.lotNom}</span></li>)}</ul>}</div>}
        </CarteGlow>}
      </div>
    </section>
  );
}

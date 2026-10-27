"use client";

/* Raffle media is provided by the API and can be remote or absent. */
/* eslint-disable @next/next/no-img-element */

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { CarteGlow } from "@/components/ui/CarteGlow";
import { ErreurApi } from "@/lib/api";
import { inscrireTirage } from "@/lib/dashboard";
import { publierNotificationDashboard } from "@/lib/dashboard-notifications";
import { traductions, useLanguage } from "@/components/i18n/LanguageProvider";
import { SkkupIcon } from "@/components/ui/SkkupIcon";
import {
  listerTirages,
  recupererResultat,
  type ResultatTirage,
  type Tirage,
} from "@/lib/raffles";

function libelleDateInvalide(langue: "fr" | "en") {
  return langue === "fr" ? "Date indisponible" : "Date unavailable";
}

function formaterDate(date: string, langue: "fr" | "en") {
  const valeur = new Date(date);
  if (Number.isNaN(valeur.getTime())) return libelleDateInvalide(langue);
  return new Intl.DateTimeFormat(langue === "fr" ? "fr-FR" : "en-US", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(valeur);
}

function tempsRestant(date: string, langue: "fr" | "en", maintenant = Date.now()) {
  const valeur = new Date(date);
  if (Number.isNaN(valeur.getTime())) return libelleDateInvalide(langue);
  const secondes = Math.max(0, Math.floor((valeur.getTime() - maintenant) / 1000));
  const jours = Math.floor(secondes / 86400);
  const heures = Math.floor((secondes % 86400) / 3600);
  const minutes = Math.floor((secondes % 3600) / 60);
  return jours > 0 ? `${jours} j ${heures} h` : `${heures} h ${minutes} min`;
}

function normaliserTirages(payload: unknown): Tirage[] {
  if (!Array.isArray(payload)) throw new Error("Réponse des tirages invalide.");
  return payload.map((tirage) => {
    if (!tirage || typeof tirage !== "object") throw new Error("Réponse des tirages invalide.");
    const entree = tirage as Tirage;
    return { ...entree, lots: Array.isArray(entree.lots) ? entree.lots : [] };
  });
}

export function ListeTirages() {
  const router = useRouter();
  const pathname = usePathname();
  const estDashboard = pathname?.startsWith("/dashboard") ?? false;
  const { langue } = useLanguage();
  const t = traductions[langue].content;
  const traductionsCourantes = useRef(t);
  traductionsCourantes.current = t;
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
      setErreursResultats((courantes) => ({ ...courantes, [tirage.id]: exception instanceof ErreurApi ? exception.message : traductionsCourantes.current.resultUnavailable }));
    } finally {
      setChargementsResultats((courants) => ({ ...courants, [tirage.id]: false }));
    }
  }, []);

  const participer = useCallback(async (tirage: Tirage) => {
    setChargementsInscriptions((courants) => ({ ...courants, [tirage.id]: true }));
    try {
      const resultat = await inscrireTirage(tirage.id);
      setInscriptions((courantes) => ({ ...courantes, [tirage.id]: `ticket:${resultat.ticketId}` }));
      if (estDashboard) {
        publierNotificationDashboard(langue === "en" ? "Draw registration" : "Inscription au tirage", traductionsCourantes.current.participationRecorded);
      }
    } catch (exception: unknown) {
      if (exception instanceof ErreurApi && exception.statut === 401) {
        router.push("/connexion");
        return;
      }
      if (estDashboard && exception instanceof ErreurApi && exception.statut === 409) {
        setInscriptions((courantes) => ({ ...courantes, [tirage.id]: "already-registered" }));
        publierNotificationDashboard(langue === "en" ? "Draw registration" : "Inscription au tirage", langue === "en" ? "You are already registered for this draw." : "Tu es déjà inscrit à ce tirage.");
        return;
      }
      setInscriptions((courantes) => ({
        ...courantes,
        [tirage.id]: exception instanceof ErreurApi ? exception.message : traductionsCourantes.current.participationUnavailable,
      }));
    } finally {
      setChargementsInscriptions((courants) => ({ ...courants, [tirage.id]: false }));
    }
  }, [estDashboard, langue, router]);

  useEffect(() => {
    let annule = false;

    listerTirages()
      .then(async (payload) => {
        if (annule) return;
        const liste = normaliserTirages(payload);
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
              : traductionsCourantes.current.raffleLoadError,
          );
        }
      });

    return () => {
      annule = true;
    };
  }, [chargerResultat, tentative]);

  if (erreur) {
    return <section className="skuup-viewer-error" aria-labelledby="raffles-error-title"><SkkupIcon name="gift" size={28} /><div><h2 id="raffles-error-title">{t.raffleUnavailable}</h2><p role="alert">{erreur}</p></div><button type="button" className="skuup-button skuup-button-outline" onClick={() => { setErreur(null); setTirages(null); setTentative((value) => value + 1); }}>{t.retry}</button></section>;
  }
  if (tirages === null) {
    return <section className="skuup-raffles-workspace skuup-raffles-loading" aria-label={t.loading} aria-busy="true" role="status">
      <div className="skuup-raffles-toolbar skuup-loading-block"><div className="skuup-raffles-toolbar-row"><span className="skuup-loading-line skuup-loading-line-wide" /><span className="skuup-loading-line skuup-loading-line-tabs" /></div></div>
      <div className="skuup-raffles-master-detail"><div className="skuup-raffles-list skuup-loading-list"><span /><span /><span /></div><CarteGlow className="skuup-raffle-detail skuup-loading-detail"><span className="skuup-loading-line skuup-loading-line-short" /><span className="skuup-loading-line skuup-loading-line-title" /><span className="skuup-loading-line skuup-loading-line-body" /><span className="skuup-loading-line skuup-loading-line-body" /></CarteGlow></div>
    </section>;
  }
  if (tirages.length === 0) {
    return <section aria-label={t.availableRaffles} className="skuup-raffles-workspace skuup-raffles-empty-workspace"><div className="skuup-raffles-toolbar"><div className="skuup-raffles-toolbar-row"><label className="skuup-raffles-search">{t.searchLabel}<input aria-label={t.searchRaffle} value={recherche} onChange={(event) => setRecherche(event.target.value)} placeholder={`${t.searchRaffle}…`} /></label><div role="group" aria-label={t.raffleStatus} className="skuup-raffles-tabs">{([['TOUS', t.all], ['OUVERT', t.open], ['CLOTURE', t.closed], ['TIRE', t.published]] as const).map(([value, label]) => <button key={value} type="button" aria-pressed={filtre === value} className={filtre === value ? "is-active" : ""} onClick={() => setFiltre(value)}>{label}<span>0</span></button>)}</div></div></div><CarteGlow className="skuup-raffles-empty"><SkkupIcon name="gift" size={34} /><div><strong>{t.noDraws}</strong><p>{t.emptyRafflesDescription}</p></div><a className="skuup-button skuup-button-outline" href="/reglement">{t.readRules}</a></CarteGlow></section>;
  }

  const terme = recherche.trim().toLocaleLowerCase();
  const visibles = tirages.filter((tirage) => (filtre === "TOUS" || tirage.statut === filtre) && (!terme || `${tirage.titre} ${tirage.description ?? ""}`.toLocaleLowerCase().includes(terme)));
  const selectionne = visibles.find((tirage) => tirage.id === selection) ?? visibles[0] ?? null;

  const libelleStatut = (statut: Tirage["statut"]) => statut === "OUVERT" ? t.open : statut === "CLOTURE" ? t.closed : t.published;

  return (
    <section aria-label={t.availableRaffles} className="skuup-raffles-workspace">
      <div className="skuup-raffles-toolbar">
        <div className="skuup-raffles-toolbar-row"><label className="skuup-raffles-search">{t.searchLabel}<input aria-label={t.searchRaffle} value={recherche} onChange={(event) => setRecherche(event.target.value)} placeholder={`${t.searchRaffle}…`} /></label><div role="group" aria-label={t.raffleStatus} className="skuup-raffles-tabs">
          {([["TOUS", t.all], ["OUVERT", t.open], ["CLOTURE", t.closed], ["TIRE", t.published]] as const).map(([value, label]) => (
            <button key={value} type="button" aria-pressed={filtre === value} className={filtre === value ? "is-active" : ""} onClick={() => setFiltre(value)}>{label}<span>{value === "TOUS" ? tirages.length : tirages.filter((item) => item.statut === value).length}</span></button>
          ))}
        </div></div>
      </div>
      <div className="skuup-raffles-master-detail">
        <div className="skuup-raffles-list" aria-label={t.raffleList} aria-live="polite">
          <span className="skuup-sr-only">{visibles.length} {visibles.length === 1 ? t.result : t.results}</span>
          {visibles.map((tirage) => (
            <button key={tirage.id} type="button" className={`skuup-raffle-list-item ${tirage.id === selectionne?.id ? "is-selected" : ""}`} onClick={() => setSelection(tirage.id)} aria-pressed={tirage.id === selectionne?.id} aria-controls={`raffle-detail-${tirage.id}`}>
              <span className="skuup-raffle-card-media">
                {tirage.lots[0]?.imageUrl ? <img src={tirage.lots[0].imageUrl} alt="" /> : <SkkupIcon name="ticket" size={34} aria-hidden="true" />}
                <span className={`skuup-raffle-status skuup-raffle-status-${tirage.statut.toLowerCase()}`}>{libelleStatut(tirage.statut)}</span>
                <span
                  className="skuup-raffle-countdown"
                  role="status"
                  aria-live="polite"
                  aria-atomic="true"
                  aria-label={tirage.statut === "OUVERT" ? t.remainingTime : t.drawDate}
                >
                  <SkkupIcon name="timer" size={14} aria-hidden="true" />
                  {tirage.statut === "OUVERT" ? tempsRestant(tirage.dateTirage, langue, maintenant) : formaterDate(tirage.dateTirage, langue)}
                </span>
              </span>
              <span className="skuup-raffle-card-body"><strong>{tirage.titre}</strong>{tirage.description && <span>{tirage.description}</span>}<span className="skuup-raffle-card-meta"><span>{tirage.lots.length} {tirage.lots.length > 1 ? t.lots : t.lot}</span><span>{tirage.ticketsDistribues} {tirage.ticketsDistribues > 1 ? t.tickets : t.ticket} {t.ticketsDistributed}</span></span>{tirage.lots.length > 0 && <span className="skuup-raffle-card-prize">{tirage.lots.slice(0, 2).map((lot) => lot.nom).join(" · ")}</span>}</span>
            </button>
          ))}
          {visibles.length === 0 && <p className="skuup-viewer-empty">{t.noMatchingRaffles}</p>}
        </div>
        {selectionne && <CarteGlow id={`raffle-detail-${selectionne.id}`} className="skuup-raffle-detail" aria-labelledby={`raffle-detail-title-${selectionne.id}`} aria-live="polite">
          <div className="skuup-raffle-detail-hero"><div className="skuup-raffle-art" aria-hidden="true">{selectionne.lots[0]?.imageUrl ? <img src={selectionne.lots[0].imageUrl} alt="" /> : <SkkupIcon name="ticket" size={36} />}</div><div><p className="skuup-kicker">{libelleStatut(selectionne.statut)}</p><h2 id={`raffle-detail-title-${selectionne.id}`}>{selectionne.titre}</h2><p className="skuup-raffle-detail-date">{t.planned} {formaterDate(selectionne.dateTirage, langue)}</p></div></div>
          {selectionne.description && <p className="skuup-raffle-description">{selectionne.description}</p>}
          <div className="skuup-raffle-summary" aria-label={t.raffleList}><div><span className="skuup-raffle-summary-icon" aria-hidden="true"><SkkupIcon name="gift" size={18} /></span><strong>{selectionne.lots.length}</strong><small>{selectionne.lots.length > 1 ? t.lots : t.lot} {t.lotsToWin}</small></div><div><span className="skuup-raffle-summary-icon" aria-hidden="true"><SkkupIcon name="ticket" size={18} /></span><strong>{selectionne.ticketsDistribues}</strong><small>{selectionne.ticketsDistribues > 1 ? t.tickets : t.ticket} {t.ticketsDistributed}</small></div>{selectionne.statut === "OUVERT" && <div role="status" aria-live="polite" aria-atomic="true" aria-label={t.remainingTime}><span className="skuup-raffle-summary-icon" aria-hidden="true"><SkkupIcon name="timer" size={18} /></span><strong>{tempsRestant(selectionne.dateTirage, langue, maintenant)}</strong><small>{t.beforeDraw}</small></div>}</div>
          <dl className="skuup-raffle-meta"><div><dt>{t.opening}</dt><dd>{formaterDate(selectionne.dateOuverture, langue)}</dd></div><div><dt>{t.draw}</dt><dd>{formaterDate(selectionne.dateTirage, langue)}</dd></div></dl>
          <div className="skuup-raffle-prizes"><h3>{t.prizes}</h3><ul>{selectionne.lots.map((lot) => <li key={lot.id}>{lot.imageUrl ? <img src={lot.imageUrl} alt={t.prizeIllustration(lot.nom)} /> : <SkkupIcon name="gift" size={18} aria-hidden="true" />}<span><strong>{lot.quantite} × {lot.nom}</strong>{lot.fournisseur && <small>{lot.fournisseur}</small>}{lot.valeurEstimee !== null && <small>{lot.valeurEstimee.toLocaleString(langue === "fr" ? "fr-FR" : "en-US")} €</small>}</span></li>)}</ul>{selectionne.lots.length === 0 && <p className="skuup-viewer-empty">{t.noPublishedPrizes}</p>}</div>
          {selectionne.statut === "OUVERT" && <div className="skuup-raffle-action">{inscriptions[selectionne.id]?.startsWith("ticket:") ? estDashboard ? null : <p role="status" className="skuup-viewer-status">{t.participationRecorded}</p> : inscriptions[selectionne.id] === "already-registered" && estDashboard ? null : inscriptions[selectionne.id] ? <p role="alert" className="skuup-viewer-error">{inscriptions[selectionne.id]}</p> : <button type="button" className="skuup-button skuup-button-primary" disabled={chargementsInscriptions[selectionne.id] === true} onClick={() => void participer(selectionne)}>{chargementsInscriptions[selectionne.id] ? t.participating : t.participate}</button>}</div>}
          {selectionne.statut === "TIRE" && <div className="skuup-raffle-result"><h3>{t.winners}</h3>{chargementsResultats[selectionne.id] ? <p role="status">{t.loading}</p> : erreursResultats[selectionne.id] ? <div><p role="alert">{erreursResultats[selectionne.id]}</p><button className="skuup-button skuup-button-outline" type="button" onClick={() => void chargerResultat(selectionne)}>{t.retry}</button></div> : !resultats[selectionne.id] ? <p role="status">{t.loading}</p> : resultats[selectionne.id].gagnants.length === 0 ? <p className="skuup-viewer-empty">{t.noWinners}</p> : <ul>{resultats[selectionne.id].gagnants.map((gagnant) => <li key={gagnant.ticketId}><strong>{gagnant.pseudo}</strong><span>{gagnant.lotNom}</span></li>)}</ul>}</div>}
        </CarteGlow>}
      </div>
    </section>
  );
}

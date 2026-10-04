"use client";

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
  }, [chargerResultat]);

  if (erreur) {
    return <p role="alert" className="rounded-2xl border border-red-400/50 bg-red-500/10 p-4 text-red-200">{erreur}</p>;
  }
  if (tirages === null) {
    return <p role="status" aria-live="polite" className="text-foreground-muted">{t.loading}</p>;
  }
  if (tirages.length === 0) {
    return <CarteGlow className="skuup-raffles-empty"><p className="text-foreground-muted">{t.noDraws}</p></CarteGlow>;
  }

  const terme = recherche.trim().toLocaleLowerCase();
  const visibles = tirages.filter((tirage) => (filtre === "TOUS" || tirage.statut === filtre) && (!terme || `${tirage.titre} ${tirage.description ?? ""}`.toLocaleLowerCase().includes(terme)));
  const selectionne = visibles.find((tirage) => tirage.id === selection) ?? visibles[0] ?? null;

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
            <button key={tirage.id} type="button" className={`skuup-raffle-list-item ${tirage.id === selectionne?.id ? "is-selected" : ""}`} onClick={() => setSelection(tirage.id)}>
              <span className="skuup-kicker">{tirage.statut === "OUVERT" ? t.open : tirage.statut === "CLOTURE" ? t.closed : t.published}</span>
              <strong>{tirage.titre}</strong><span>{tirage.lots.length} lot{tirage.lots.length > 1 ? "s" : ""} · {tirage.ticketsDistribues} ticket{tirage.ticketsDistribues > 1 ? "s" : ""}</span>
            </button>
          ))}
          {visibles.length === 0 && <p className="skuup-viewer-empty">Aucun tirage ne correspond à ce filtre.</p>}
        </div>
        {selectionne && <CarteGlow className="skuup-raffle-detail">
          <div className="skuup-viewer-section-heading"><div><div className="skuup-raffle-art" aria-hidden="true"><SkkupIcon name="gift" size={30} /></div><p className="skuup-kicker">{selectionne.statut === "OUVERT" ? t.open : selectionne.statut === "CLOTURE" ? t.closed : t.published}</p><h2>{selectionne.titre}</h2></div><span className="skuup-badge">{selectionne.ticketsDistribues} tickets</span></div>
          {selectionne.description && <p className="skuup-raffle-description">{selectionne.description}</p>}
          <dl className="skuup-raffle-meta"><div><dt>Ouverture</dt><dd>{formaterDate(selectionne.dateOuverture, langue)}</dd></div><div><dt>Tirage</dt><dd>{formaterDate(selectionne.dateTirage, langue)}</dd></div></dl>
          <div className="skuup-raffle-prizes"><h3>{t.prizes}</h3><ul>{selectionne.lots.map((lot) => <li key={lot.id}><strong>{lot.quantite} × {lot.nom}</strong>{lot.valeurEstimee !== null && <span>{lot.valeurEstimee.toLocaleString(langue === "fr" ? "fr-FR" : "en-US")} €</span>}</li>)}</ul>{selectionne.lots.length === 0 && <p className="skuup-viewer-empty">Aucun lot n’est publié pour ce tirage.</p>}</div>
          {selectionne.statut === "OUVERT" && <div className="skuup-raffle-action">{inscriptions[selectionne.id]?.startsWith("ticket:") ? <p role="status" className="skuup-viewer-status">Participation enregistrée. Ton ticket est prêt.</p> : inscriptions[selectionne.id] ? <p role="alert" className="skuup-viewer-error">{inscriptions[selectionne.id]}</p> : <button type="button" className="skuup-button skuup-button-primary" disabled={chargementsInscriptions[selectionne.id] === true} onClick={() => void participer(selectionne)}>{chargementsInscriptions[selectionne.id] ? "Participation…" : "Participer au tirage"}</button>}</div>}
          {selectionne.statut === "TIRE" && <div className="skuup-raffle-result"><h3>{t.winners}</h3>{chargementsResultats[selectionne.id] ? <p role="status">{t.loading}</p> : erreursResultats[selectionne.id] ? <div><p role="alert">{erreursResultats[selectionne.id]}</p><button className="skuup-button skuup-button-outline" type="button" onClick={() => void chargerResultat(selectionne)}>Réessayer</button></div> : !resultats[selectionne.id] ? <p role="status">{t.loading}</p> : resultats[selectionne.id].gagnants.length === 0 ? <p className="skuup-viewer-empty">{t.noWinners}</p> : <ul>{resultats[selectionne.id].gagnants.map((gagnant) => <li key={gagnant.ticketId}><strong>{gagnant.pseudo}</strong><span>{gagnant.lotNom}</span></li>)}</ul>}</div>}
        </CarteGlow>}
      </div>
    </section>
  );
}

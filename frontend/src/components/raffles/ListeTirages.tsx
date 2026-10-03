"use client";

import { useCallback, useEffect, useState } from "react";
import { CarteGlow } from "@/components/ui/CarteGlow";
import { ErreurApi } from "@/lib/api";
import { inscrireTirage } from "@/lib/dashboard";
import { traductions, useLanguage } from "@/components/i18n/LanguageProvider";
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
    return <CarteGlow><p className="text-foreground-muted">{t.noDraws}</p></CarteGlow>;
  }

  return (
    <section aria-label="Historique des tirages" className="grid gap-5 md:grid-cols-2">
      {tirages.map((tirage) => (
        <CarteGlow key={tirage.id} className="flex h-full flex-col gap-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="skuup-kicker">{tirage.statut === "OUVERT" ? t.open : tirage.statut === "CLOTURE" ? t.closed : t.published}</p>
              <h2 className="mt-1 text-xl font-bold text-foreground">{tirage.titre}</h2>
            </div>
            <span className="skuup-badge">{tirage.ticketsDistribues} ticket{tirage.ticketsDistribues > 1 ? "s" : ""}</span>
          </div>
          {tirage.description && <p className="text-sm leading-6 text-foreground-muted">{tirage.description}</p>}
          <p className="text-sm text-foreground-muted">{t.planned} {formaterDate(tirage.dateTirage, langue)}</p>
          <div>
            <h3 className="font-semibold text-foreground">{t.prizes}</h3>
            <ul className="mt-2 space-y-1 text-sm text-foreground-muted">
              {tirage.lots.map((lot) => <li key={lot.id}>{lot.quantite} × {lot.nom}</li>)}
            </ul>
          </div>
          {tirage.statut === "OUVERT" && (
            <div className="mt-auto grid gap-2 rounded-2xl border border-accent-violet/30 bg-accent-violet/10 p-4">
              {inscriptions[tirage.id]?.startsWith("ticket:") ? (
                <p role="status" className="text-sm text-emerald-200">Participation enregistrée. Ton ticket est prêt.</p>
              ) : inscriptions[tirage.id] ? (
                <p role="alert" className="text-sm text-red-200">{inscriptions[tirage.id]}</p>
              ) : (
                <button
                  type="button"
                  className="skuup-button skuup-button-primary w-fit"
                  disabled={chargementsInscriptions[tirage.id] === true}
                  onClick={() => void participer(tirage)}
                >
                  {chargementsInscriptions[tirage.id] ? "Participation…" : "Participer au tirage"}
                </button>
              )}
            </div>
          )}
          {tirage.statut === "TIRE" && (
            <div className="mt-auto rounded-2xl border border-accent-violet/40 bg-accent-violet/10 p-4">
              <h3 className="font-semibold text-foreground">{t.winners}</h3>
              {chargementsResultats[tirage.id] ? (
                <p role="status" className="mt-2 text-sm text-foreground-muted">{t.loading}</p>
              ) : erreursResultats[tirage.id] ? (
                <div className="mt-2 grid gap-2">
                  <p role="alert" className="text-sm text-red-200">{erreursResultats[tirage.id]}</p>
                  <button className="skuup-button skuup-button-outline w-fit px-3 py-1 text-xs" type="button" onClick={() => void chargerResultat(tirage)}>Réessayer</button>
                </div>
              ) : !resultats[tirage.id] ? (
                <p role="status" className="mt-2 text-sm text-foreground-muted">{t.loading}</p>
              ) : resultats[tirage.id].gagnants.length === 0 ? (
                <p className="mt-2 text-sm text-foreground-muted">{t.noWinners}</p>
              ) : (
                <ul className="mt-2 space-y-2 text-sm">
                  {resultats[tirage.id].gagnants.map((gagnant) => (
                    <li key={gagnant.ticketId}><strong>{gagnant.pseudo}</strong> remporte {gagnant.lotNom}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </CarteGlow>
      ))}
    </section>
  );
}

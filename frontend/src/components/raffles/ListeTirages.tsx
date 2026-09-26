"use client";

import { useEffect, useState } from "react";
import { CarteGlow } from "@/components/ui/CarteGlow";
import { messageErreurInterface } from "@/lib/api";
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
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    let annule = false;

    listerTirages()
      .then(async (liste) => {
        if (annule) return;
        setTirages(liste);
        const publies = liste.filter((tirage) => tirage.statut === "TIRE");
        const reponses = await Promise.all(
          publies.map(async (tirage) => [tirage.id, await recupererResultat(tirage.id)] as const),
        );
        if (!annule) setResultats(Object.fromEntries(reponses));
      })
      .catch((exception: unknown) => {
        if (!annule) {
          setErreur(messageErreurInterface(
            exception,
            langue,
            langue === "en" ? "Unable to load draws right now." : "Impossible de charger les tirages pour le moment.",
          ));
        }
      });

    return () => {
      annule = true;
    };
  }, [langue]);

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
    <section aria-label={langue === "en" ? "Draw history" : "Historique des tirages"} className="grid gap-5 md:grid-cols-2">
      {tirages.map((tirage) => (
        <CarteGlow key={tirage.id} className="flex h-full flex-col gap-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="skuup-kicker">{tirage.statut === "OUVERT" ? t.open : tirage.statut === "CLOTURE" ? t.closed : t.published}</p>
              <h2 className="mt-1 text-xl font-bold text-foreground">{tirage.titre}</h2>
            </div>
            <span className="skuup-badge">{tirage.ticketsDistribues} {langue === "en" ? (tirage.ticketsDistribues > 1 ? "tickets" : "ticket") : `ticket${tirage.ticketsDistribues > 1 ? "s" : ""}`}</span>
          </div>
          {tirage.description && <p className="text-sm leading-6 text-foreground-muted">{tirage.description}</p>}
          <p className="text-sm text-foreground-muted">{t.planned} {formaterDate(tirage.dateTirage, langue)}</p>
          <div>
            <h3 className="font-semibold text-foreground">{t.prizes}</h3>
            <ul className="mt-2 space-y-1 text-sm text-foreground-muted">
              {tirage.lots.map((lot) => <li key={lot.id}>{lot.quantite} × {lot.nom}</li>)}
            </ul>
          </div>
          {tirage.statut === "TIRE" && (
            <div className="mt-auto rounded-2xl border border-accent-violet/40 bg-accent-violet/10 p-4">
              <h3 className="font-semibold text-foreground">{t.winners}</h3>
              {!resultats[tirage.id] ? (
                <p role="status" className="mt-2 text-sm text-foreground-muted">{t.loading}</p>
              ) : resultats[tirage.id].gagnants.length === 0 ? (
                <p className="mt-2 text-sm text-foreground-muted">{t.noWinners}</p>
              ) : (
                <ul className="mt-2 space-y-2 text-sm">
                  {resultats[tirage.id].gagnants.map((gagnant) => (
                    <li key={gagnant.ticketId}>
                      <strong>{gagnant.pseudo}</strong>{" "}
                      {langue === "en" ? "wins" : "remporte"} {gagnant.lotNom}
                    </li>
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

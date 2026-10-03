"use client";

import { useCallback, useEffect, useState } from "react";
import { CarteGlow } from "@/components/ui/CarteGlow";
import { SkkupIcon } from "@/components/ui/SkkupIcon";
import { ErreurApi } from "@/lib/api";
import {
  recupererCartesAGratter,
  recupererTicketsTirage,
  recupererTiragesPublics,
  type CarteAGratter,
  type TicketsTirage,
  type TiragePublic,
} from "@/lib/dashboard";
import { useLanguage } from "@/components/i18n/LanguageProvider";

export function CentreRecompenses() {
  const { langue } = useLanguage();
  const anglais = langue === "en";
  const [cartes, setCartes] = useState<CarteAGratter[] | null>(null);
  const [tickets, setTickets] = useState<TicketsTirage | null>(null);
  const [tirages, setTirages] = useState<TiragePublic[] | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [tentative, setTentative] = useState(0);

  const charger = useCallback(async () => {
    setErreur(null);
    try {
      const [cartesRecues, ticketsRecus, tiragesRecus] = await Promise.all([
        recupererCartesAGratter(),
        recupererTicketsTirage(1, 6),
        recupererTiragesPublics(),
      ]);
      setCartes(cartesRecues);
      setTickets(ticketsRecus);
      setTirages(tiragesRecus);
    } catch (exception: unknown) {
      setErreur(exception instanceof ErreurApi ? exception.message : (anglais ? "Rewards are temporarily unavailable." : "Les récompenses sont temporairement indisponibles."));
    }
  }, [anglais]);

  useEffect(() => { void charger(); }, [charger, tentative]);

  return (
    <div className="skuup-dashboard-page">
      <header className="skuup-dashboard-page-header">
        <p className="skuup-kicker">{anglais ? "Your rewards" : "Tes récompenses"}</p>
        <h1 className="skuup-dashboard-page-title">{anglais ? "Rewards centre" : "Centre des récompenses"}</h1>
        <p>{anglais ? "Open your available cards, follow your tickets and discover upcoming draws." : "Ouvre tes cartes disponibles, suis tes tickets et découvre les prochains tirages."}</p>
      </header>
      {erreur ? (
        <div role="alert" className="skuup-viewer-error"><p>{erreur}</p><button type="button" className="skuup-button skuup-button-outline mt-3" onClick={() => { setCartes(null); setTickets(null); setTirages(null); setTentative((value) => value + 1); }}>{anglais ? "Retry" : "Réessayer"}</button></div>
      ) : cartes === null || tickets === null || tirages === null ? (
        <p role="status" aria-live="polite" className="skuup-viewer-state">{anglais ? "Loading rewards…" : "Chargement des récompenses…"}</p>
      ) : (
        <div className="grid gap-5 lg:grid-cols-3">
          <CarteGlow className="skuup-viewer-section lg:col-span-2"><div className="flex items-center justify-between gap-3"><div><p className="skuup-kicker">{anglais ? "Available now" : "Disponibles maintenant"}</p><h2>{anglais ? "Scratch cards" : "Cartes à gratter"}</h2></div><SkkupIcon name="gift" size={28} /></div>{cartes.length === 0 ? <p className="skuup-viewer-empty mt-4">{anglais ? "No card is available yet. Keep watching to unlock one." : "Aucune carte disponible pour le moment. Continue à regarder pour en débloquer une."}</p> : <ul className="skuup-viewer-data-list mt-4">{cartes.map((carte) => <li key={carte.id}><div><strong>{anglais ? "Scratch card" : "Carte à gratter"}</strong><span>{new Date(carte.createdAt).toLocaleDateString(anglais ? "en-US" : "fr-FR")}</span></div><span className="skuup-badge">{anglais ? "Available" : "Disponible"}</span></li>)}</ul>}</CarteGlow>
          <CarteGlow className="skuup-viewer-section"><p className="skuup-kicker">{anglais ? "Participation" : "Participation"}</p><h2>{tickets.total} {anglais ? "tickets" : "tickets"}</h2><p className="mt-2 text-foreground-muted">{anglais ? "Tickets earned through validated activity." : "Tickets obtenus grâce à ton activité validée."}</p><a className="skuup-button skuup-button-outline mt-5 inline-flex" href="/dashboard/tirages">{anglais ? "View draws" : "Voir les tirages"}<SkkupIcon name="arrow" size={17} /></a></CarteGlow>
          <CarteGlow className="skuup-viewer-section lg:col-span-3"><p className="skuup-kicker">{anglais ? "Upcoming" : "À venir"}</p><h2>{anglais ? "Upcoming draws" : "Prochains tirages"}</h2>{tirages.filter((tirage) => tirage.statut === "OUVERT").length === 0 ? <p className="skuup-viewer-empty mt-4">{anglais ? "No draw is open right now." : "Aucun tirage n’est ouvert pour le moment."}</p> : <ul className="skuup-viewer-data-list mt-4">{tirages.filter((tirage) => tirage.statut === "OUVERT").slice(0, 3).map((tirage) => <li key={tirage.id}><div><strong>{tirage.titre}</strong><span>{tirage.lots.length} {anglais ? "prizes" : "lots"}</span></div><span className="skuup-badge">{anglais ? "Open" : "Ouvert"}</span></li>)}</ul>}</CarteGlow>
        </div>
      )}
    </div>
  );
}

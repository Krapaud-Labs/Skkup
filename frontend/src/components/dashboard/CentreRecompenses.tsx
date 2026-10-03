"use client";

import { useCallback, useEffect, useState } from "react";
import { CarteGlow } from "@/components/ui/CarteGlow";
import { SkkupIcon } from "@/components/ui/SkkupIcon";
import { ErreurApi } from "@/lib/api";
import {
  recupererCartesAGratter,
  recupererTicketsTirage,
  recupererTiragesPublics,
  gratterCarte,
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
  const [filtre, setFiltre] = useState<"TOUTES" | "DISPONIBLES" | "VERROUILLEES" | "UTILISEES">("TOUTES");
  const [carteEnCours, setCarteEnCours] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

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

  useEffect(() => {
    const timer = window.setTimeout(() => { void charger(); }, 0);
    return () => window.clearTimeout(timer);
  }, [charger, tentative]);

  async function gratter(id: string) {
    setCarteEnCours(id);
    setMessage(null);
    try {
      const resultat = await gratterCarte(id);
      setCartes((courantes) => courantes?.map((carte) => carte.id === id ? resultat.carte : carte) ?? courantes);
      setMessage(resultat.carte.gainMontant ? `${anglais ? "You won" : "Tu as gagné"} ${resultat.carte.gainMontant} ${anglais ? "points" : "points"}.` : (anglais ? "Card opened successfully." : "Carte ouverte avec succès."));
    } catch (exception: unknown) {
      setMessage(exception instanceof ErreurApi ? exception.message : (anglais ? "This card could not be opened." : "Cette carte ne peut pas être ouverte pour le moment."));
    } finally {
      setCarteEnCours(null);
    }
  }

  const correspondAuFiltre = (carte: CarteAGratter) => filtre === "TOUTES" || filtre === "UTILISEES" && carte.grattee || filtre === "VERROUILLEES" && !carte.grattee && carte.streakPalier > 0 || filtre === "DISPONIBLES" && !carte.grattee && carte.streakPalier === 0;
  const compter = (valeur: typeof filtre) => cartes?.filter((carte) => valeur === "TOUTES" || valeur === "UTILISEES" && carte.grattee || valeur === "VERROUILLEES" && !carte.grattee && carte.streakPalier > 0 || valeur === "DISPONIBLES" && !carte.grattee && carte.streakPalier === 0).length ?? 0;

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
        <div className="skuup-rewards-layout">
          <CarteGlow className="skuup-viewer-section"><div className="skuup-secondary-heading"><div><p className="skuup-kicker">{anglais ? "Turn points into rewards" : "Transforme tes points en récompenses"}</p><h2>{anglais ? "Scratch cards" : "Cartes à gratter"}</h2></div><SkkupIcon name="gift" size={30} /></div><div className="skuup-rewards-filters" role="tablist" aria-label={anglais ? "Reward filters" : "Filtres des récompenses"}>{([["TOUTES", anglais ? "All" : "Toutes"], ["DISPONIBLES", anglais ? "Available" : "Disponibles"], ["VERROUILLEES", anglais ? "Locked" : "Verrouillées"], ["UTILISEES", anglais ? "Used" : "Utilisées"]] as const).map(([value, label]) => <button key={value} type="button" role="tab" aria-selected={filtre === value} className={filtre === value ? "is-active" : ""} onClick={() => setFiltre(value)}>{label} <span>{compter(value)}</span></button>)}</div>{message && <p role="status" className="skuup-viewer-action-message">{message}</p>}<div className="skuup-rewards-grid">{cartes.filter(correspondAuFiltre).map((carte, index) => { const verrouillee = !carte.grattee && carte.streakPalier > 0 && index > 2; return <article className={`skuup-scratch-card ${carte.grattee ? "is-used" : verrouillee ? "is-locked" : ""}`} key={carte.id}><div className="skuup-scratch-art" aria-hidden="true"><SkkupIcon name={carte.grattee ? "check" : verrouillee ? "lock" : "gift"} size={42} /></div><h3>{carte.grattee ? (anglais ? "Reward claimed" : "Gain obtenu !") : verrouillee ? (anglais ? "Locked card" : "Carte verrouillée") : (anglais ? "Scratch card" : "Carte à gratter")}</h3><p>{carte.gainMontant ? `${carte.gainMontant} pts` : `${carte.streakPalier} ${anglais ? "day streak" : "jours de série"}`}</p>{carte.grattee ? <span className="skuup-badge">{anglais ? "Used" : "Utilisée"}</span> : verrouillee ? <span className="skuup-badge">{anglais ? "Soon available" : "Bientôt disponible"}</span> : <button type="button" className="skuup-button skuup-button-primary" disabled={carteEnCours === carte.id} onClick={() => void gratter(carte.id)}>{carteEnCours === carte.id ? (anglais ? "Opening…" : "Ouverture…") : (anglais ? "Scratch" : "Gratter")}</button>}</article>; })}</div>{cartes.length === 0 && <p className="skuup-viewer-empty">{anglais ? "No card is available yet. Keep watching to unlock one." : "Aucune carte disponible pour le moment. Continue à regarder pour en débloquer une."}</p>}</CarteGlow>
          <CarteGlow className="skuup-viewer-section"><p className="skuup-kicker">{anglais ? "Participation" : "Participation"}</p><h2>{tickets.total} {anglais ? "tickets" : "tickets"}</h2><p className="mt-2 text-foreground-muted">{anglais ? "Tickets earned through validated activity." : "Tickets obtenus grâce à ton activité validée."}</p><a className="skuup-button skuup-button-outline mt-5 inline-flex" href="/dashboard/tirages">{anglais ? "View draws" : "Voir les tirages"}<SkkupIcon name="arrow" size={17} /></a></CarteGlow>
          <CarteGlow className="skuup-viewer-section lg:col-span-3"><p className="skuup-kicker">{anglais ? "Upcoming" : "À venir"}</p><h2>{anglais ? "Upcoming draws" : "Prochains tirages"}</h2>{tirages.filter((tirage) => tirage.statut === "OUVERT").length === 0 ? <p className="skuup-viewer-empty mt-4">{anglais ? "No draw is open right now." : "Aucun tirage n’est ouvert pour le moment."}</p> : <ul className="skuup-viewer-data-list mt-4">{tirages.filter((tirage) => tirage.statut === "OUVERT").slice(0, 3).map((tirage) => <li key={tirage.id}><div><strong>{tirage.titre}</strong><span>{tirage.lots.length} {anglais ? "prizes" : "lots"}</span></div><span className="skuup-badge">{anglais ? "Open" : "Ouvert"}</span></li>)}</ul>}</CarteGlow>
        </div>
      )}
    </div>
  );
}

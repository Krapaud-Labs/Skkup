"use client";

import { useCallback, useEffect, useState } from "react";
import { BoutonCTA } from "@/components/ui/BoutonCTA";
import { ErreurApi } from "@/lib/api";
import {
  gratterCarte,
  libellesStatutTirage,
  recupererResumeRecompenses,
  recupererTiragesPublics,
  type CarteAGratter,
  type TiragePublic,
} from "@/lib/dashboard";
import { useLanguage } from "@/components/i18n/LanguageProvider";

type SectionState<T> = { value: T | null; error: string | null; loading: boolean };

/** Vue viewer des récompenses : elle ne présente que les données réellement renvoyées par les API. */
export function CentreRecompenses() {
  const { langue } = useLanguage();
  const anglais = langue === "en";
  const [resume, setResume] = useState<SectionState<{ cartes: CarteAGratter[]; tickets: import("@/lib/dashboard").TicketTirage[] }>>({ value: null, error: null, loading: true });
  const [tirages, setTirages] = useState<SectionState<TiragePublic[]>>({ value: null, error: null, loading: true });
  const [action, setAction] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const charger = useCallback(() => {
    setResume((etat) => ({ ...etat, loading: true, error: null }));
    recupererResumeRecompenses().then((value) => setResume({ value, error: null, loading: false })).catch((exception: unknown) => setResume({ value: null, loading: false, error: messageErreur(exception, anglais ? "Rewards are unavailable." : "Les récompenses sont indisponibles.") }));
    setTirages((etat) => ({ ...etat, loading: true, error: null }));
    recupererTiragesPublics().then((value) => setTirages({ value, error: null, loading: false })).catch((exception: unknown) => setTirages({ value: [], loading: false, error: messageErreur(exception, anglais ? "Draws are unavailable." : "Les tirages sont indisponibles.") }));
  }, [anglais]);

  useEffect(() => { queueMicrotask(charger); }, [charger]);

  async function ouvrirCarte(carte: CarteAGratter) {
    if (action) return;
    setAction(carte.id);
    setMessage(null);
    try {
      const resultat = await gratterCarte(carte.id);
      setResume((etat) => ({ ...etat, value: etat.value ? { ...etat.value, cartes: etat.value.cartes.filter((item) => item.id !== carte.id) } : etat.value }));
      setMessage(resultat.ticketCree
        ? (anglais ? "Card opened: a draw ticket was added." : "Carte ouverte : un ticket de tirage a été ajouté.")
        : (anglais ? "Card opened: +" + (resultat.carte.gainMontant ?? 0) + " points." : "Carte ouverte : +" + (resultat.carte.gainMontant ?? 0) + " points."));
    } catch (exception: unknown) {
      setMessage(messageErreur(exception, anglais ? "This card is temporarily unavailable." : "Cette carte est temporairement indisponible."));
    } finally {
      setAction(null);
    }
  }

  return (
    <div className="skuup-viewer-page">
      <header className="skuup-dashboard-page-header">
        <p className="skuup-kicker">{anglais ? "Your rewards" : "Tes récompenses"}</p>
        <h1 className="skuup-dashboard-page-title">{anglais ? "Use what you have earned" : "Utilise ce que tu as gagné"}</h1>
        <p>{anglais ? "Scratch cards, tickets and published draws are separated so every state stays understandable." : "Cartes à gratter, tickets et tirages publiés sont séparés pour garder chaque état compréhensible."}</p>
      </header>
      {message && <p className="skuup-viewer-status" role="status" aria-live="polite">{message}</p>}
      <section className="skuup-viewer-section" aria-labelledby="scratch-cards-title">
        <div className="skuup-viewer-section-heading"><div><p className="skuup-kicker">{anglais ? "Available now" : "Disponibles maintenant"}</p><h2 id="scratch-cards-title">{anglais ? "Scratch cards" : "Cartes à gratter"}</h2></div><span className="skuup-dashboard-count">{resume.value?.cartes.length ?? 0}</span></div>
        <EtatSection loading={resume.loading} error={resume.error} retry={charger} anglais={anglais} />
        {resume.value?.cartes.length === 0 && !resume.loading && !resume.error && <p className="skuup-viewer-empty">{anglais ? "No card is available. Keep watching and maintain your streak to unlock one." : "Aucune carte n’est disponible. Continue à regarder et garde ta série pour en débloquer une."}</p>}
        {resume.value && resume.value.cartes.length > 0 && <ul className="skuup-viewer-card-grid">{resume.value.cartes.map((carte) => <li key={carte.id} className="skuup-viewer-reward-card"><span className="skuup-viewer-reward-mark" aria-hidden="true">✦</span><strong>{anglais ? "Streak level " + carte.streakPalier + " days" : "Palier de " + carte.streakPalier + " jours"}</strong><BoutonCTA type="button" variante="secondaire" onClick={() => void ouvrirCarte(carte)} disabled={Boolean(action)}>{action === carte.id ? (anglais ? "Opening…" : "Ouverture…") : (anglais ? "Open card" : "Gratter la carte")}</BoutonCTA></li>)}</ul>}
      </section>
      <div className="skuup-viewer-split-grid">
        <section className="skuup-viewer-section" aria-labelledby="tickets-title"><div className="skuup-viewer-section-heading"><div><p className="skuup-kicker">{anglais ? "Your entries" : "Tes participations"}</p><h2 id="tickets-title">{anglais ? "Draw tickets" : "Tickets de tirage"}</h2></div></div><EtatSection loading={resume.loading} error={resume.error} retry={charger} anglais={anglais} />{resume.value?.tickets.length === 0 && !resume.loading && !resume.error && <p className="skuup-viewer-empty">{anglais ? "No ticket yet. Open a scratch card or keep watching." : "Aucun ticket pour l’instant. Ouvre une carte ou continue à regarder."}</p>}{resume.value && resume.value.tickets.length > 0 && <ul className="skuup-viewer-data-list">{resume.value.tickets.map((ticket) => <li key={ticket.ticketId}><div><strong>{ticket.raffleTitre}</strong><span>{new Date(ticket.obtenuLe).toLocaleDateString(anglais ? "en-US" : "fr-FR")}</span></div><span className="skuup-viewer-status-badge">{ticket.gagnant && ticket.lot ? (anglais ? "Winner: " : "Gagnant : ") + ticket.lot.nom : libellesStatutTirage[ticket.raffleStatut]}</span></li>)}</ul>}</section>
        <section className="skuup-viewer-section" aria-labelledby="draws-title"><div className="skuup-viewer-section-heading"><div><p className="skuup-kicker">{anglais ? "Public schedule" : "Calendrier public"}</p><h2 id="draws-title">{anglais ? "Published draws" : "Tirages publiés"}</h2></div></div><EtatSection loading={tirages.loading} error={tirages.error} retry={charger} anglais={anglais} />{tirages.value?.length === 0 && !tirages.loading && !tirages.error && <p className="skuup-viewer-empty">{anglais ? "No draw is published yet." : "Aucun tirage n’est publié pour le moment."}</p>}{tirages.value && tirages.value.length > 0 && <ul className="skuup-viewer-data-list">{tirages.value.map((tirage) => <li key={tirage.id}><div><strong>{tirage.titre}</strong><span>{libellesStatutTirage[tirage.statut]} · {new Date(tirage.dateTirage).toLocaleDateString(anglais ? "en-US" : "fr-FR")}</span></div><span>{tirage.lots.length} {anglais ? "prize(s)" : "lot(s)"}</span></li>)}</ul>}</section>
      </div>
    </div>
  );
}

function EtatSection({ loading, error, retry, anglais }: { loading: boolean; error: string | null; retry: () => void; anglais: boolean }) {
  if (loading) return <p className="skuup-viewer-state" role="status">{anglais ? "Loading…" : "Chargement…"}</p>;
  if (!error) return null;
  return <div className="skuup-viewer-error"><p role="alert">{error}</p><button type="button" className="skuup-button skuup-button-outline" onClick={retry}>{anglais ? "Retry" : "Réessayer"}</button></div>;
}

function messageErreur(exception: unknown, fallback: string) {
  return exception instanceof ErreurApi ? exception.message : fallback;
}

"use client";

import { useCallback, useEffect, useState } from "react";
import { CarteGlow } from "@/components/ui/CarteGlow";
import { BoutonCTA } from "@/components/ui/BoutonCTA";
import { ErreurApi } from "@/lib/api";
import { libellesTypeTransaction, recupererHistoriquePoints, type HistoriquePoints } from "@/lib/dashboard";
import { useLanguage } from "@/components/i18n/LanguageProvider";

const vide: HistoriquePoints = { transactions: [], page: 1, limit: 10, total: 0, totalPages: 1 };

export function HistoriquePointsViewer() {
  const { langue } = useLanguage();
  const anglais = langue === "en";
  const [historique, setHistorique] = useState<HistoriquePoints | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const charger = useCallback(async (pageDemandee: number) => {
    setErreur(null);
    try {
      setHistorique(await recupererHistoriquePoints(pageDemandee));
    } catch (exception: unknown) {
      setHistorique(vide);
      setErreur(exception instanceof ErreurApi ? exception.message : (anglais ? "History is unavailable." : "L’historique est indisponible."));
    }
  }, [anglais]);

  useEffect(() => { queueMicrotask(() => void charger(page)); }, [charger, page]);

  return (
    <div className="skuup-viewer-page">
      <header className="skuup-dashboard-page-header">
        <p className="skuup-kicker">{anglais ? "Your activity" : "Ton activité"}</p>
        <h1 className="skuup-dashboard-page-title">{anglais ? "Points history" : "Historique des points"}</h1>
        <p>{anglais ? "Review only the point movements confirmed by Skkup." : "Retrouve uniquement les mouvements de points confirmés par Skkup."}</p>
      </header>
      <CarteGlow className="skuup-viewer-section">
        {historique === null && <p role="status" className="skuup-viewer-state">{anglais ? "Loading history…" : "Chargement de l’historique…"}</p>}
        {erreur && <div className="skuup-viewer-error"><p role="alert">{erreur}</p><button type="button" className="skuup-button skuup-button-outline" onClick={() => void charger(page)}>{anglais ? "Retry" : "Réessayer"}</button></div>}
        {historique && !erreur && <div className="skuup-history-summary"><div><span>{anglais ? "Confirmed movements" : "Mouvements confirmés"}</span><strong>{historique.total}</strong></div><div><span>{anglais ? "Current page" : "Page affichée"}</span><strong>{historique.page} / {historique.totalPages}</strong></div></div>}
        {historique && !erreur && historique.transactions.length === 0 && <p className="skuup-viewer-empty">{anglais ? "No point movement has been recorded yet." : "Aucun mouvement de points n’est encore enregistré."}</p>}
        {historique && !erreur && historique.transactions.length > 0 && <div className="skuup-history-table-wrap"><table className="skuup-history-table"><thead><tr><th scope="col">{anglais ? "Type" : "Type"}</th><th scope="col">{anglais ? "Date" : "Date"}</th><th scope="col">{anglais ? "Amount" : "Montant"}</th></tr></thead><tbody>{historique.transactions.map((transaction) => <tr key={transaction.id}><th scope="row">{libellesTypeTransaction[transaction.type]}</th><td>{new Date(transaction.createdAt).toLocaleDateString(anglais ? "en-US" : "fr-FR")}</td><td className={transaction.montant >= 0 ? "skuup-viewer-positive" : "skuup-viewer-negative"}>{transaction.montant >= 0 ? "+" : ""}{transaction.montant} pts</td></tr>)}</tbody></table></div>}
        {historique && !erreur && historique.totalPages > 1 && <nav className="skuup-viewer-pagination" aria-label={anglais ? "History pages" : "Pages de l’historique"}><BoutonCTA type="button" variante="secondaire" onClick={() => setPage((courante) => Math.max(1, courante - 1))} disabled={page <= 1}>{anglais ? "Previous" : "Précédente"}</BoutonCTA><span>{page} / {historique.totalPages}</span><BoutonCTA type="button" variante="secondaire" onClick={() => setPage((courante) => Math.min(historique.totalPages, courante + 1))} disabled={page >= historique.totalPages}>{anglais ? "Next" : "Suivante"}</BoutonCTA></nav>}
      </CarteGlow>
    </div>
  );
}

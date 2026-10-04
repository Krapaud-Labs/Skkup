"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CarteGlow } from "@/components/ui/CarteGlow";
import { BoutonCTA } from "@/components/ui/BoutonCTA";
import { ErreurApi } from "@/lib/api";
import { libellesTypeTransaction, recupererHistoriquePoints, type HistoriquePoints, type TypeTransactionPoints } from "@/lib/dashboard";
import { useLanguage } from "@/components/i18n/LanguageProvider";

const vide: HistoriquePoints = { transactions: [], page: 1, limit: 10, total: 0, totalPages: 1 };

export function HistoriquePointsViewer() {
  const { langue } = useLanguage();
  const anglais = langue === "en";
  const [historique, setHistorique] = useState<HistoriquePoints | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [filtre, setFiltre] = useState<"TOUS" | TypeTransactionPoints>("TOUS");
  const [periode, setPeriode] = useState<"TOUTES" | "30">("TOUTES");
  const [maintenant] = useState(() => Date.now());
  const [selection, setSelection] = useState<string | null>(null);

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

  const transactions = useMemo(() => {
    const seuil = periode === "30" ? maintenant - 30 * 24 * 60 * 60 * 1000 : 0;
    return (historique?.transactions ?? []).filter((transaction) => (filtre === "TOUS" || transaction.type === filtre) && new Date(transaction.createdAt).getTime() >= seuil);
  }, [filtre, historique, maintenant, periode]);
  const totalPeriode = transactions.reduce((total, transaction) => total + transaction.montant, 0);
  const selectionnee = transactions.find((transaction) => transaction.id === selection) ?? transactions[0] ?? null;
  const exporter = () => {
    const csv = ["type,date,montant", ...transactions.map((item) => `${item.type},${item.createdAt},${item.montant}`)].join("\n");
    const lien = document.createElement("a");
    lien.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    lien.download = "skkup-historique-points.csv";
    lien.click();
    URL.revokeObjectURL(lien.href);
  };

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
        {historique && !erreur && <><div className="skuup-history-summary"><div><span>{anglais ? "Movements" : "Mouvements"}</span><strong>{historique.total}</strong></div><div><span>{anglais ? "Period total" : "Total période"}</span><strong>{totalPeriode >= 0 ? "+" : ""}{totalPeriode} pts</strong></div><div><span>{anglais ? "Page" : "Page"}</span><strong>{historique.total === 0 ? "0 / 0" : `${historique.page} / ${historique.totalPages}`}</strong></div></div><div className="skuup-viewer-toolbar"><label>{anglais ? "Type" : "Type"}<select value={filtre} onChange={(event) => { setFiltre(event.target.value as typeof filtre); setSelection(null); }}><option value="TOUS">{anglais ? "All types" : "Tous les types"}</option>{(Object.keys(libellesTypeTransaction) as TypeTransactionPoints[]).map((type) => <option key={type} value={type}>{libellesTypeTransaction[type]}</option>)}</select></label><label>{anglais ? "Period" : "Période"}<select value={periode} onChange={(event) => setPeriode(event.target.value as typeof periode)}><option value="TOUTES">{anglais ? "All time" : "Toutes"}</option><option value="30">{anglais ? "Last 30 days" : "30 derniers jours"}</option></select></label><button type="button" className="skuup-button skuup-button-outline" onClick={exporter} disabled={transactions.length === 0}>{anglais ? "Export CSV" : "Exporter CSV"}</button></div></>}
        {historique && !erreur && transactions.length === 0 && <p className="skuup-viewer-empty">{anglais ? "No point movement matches these filters." : "Aucun mouvement ne correspond à ces filtres."}</p>}
        {historique && !erreur && transactions.length > 0 && <div className="skuup-history-master-detail"><div className="skuup-history-table-wrap"><table className="skuup-history-table"><thead><tr><th scope="col">Type</th><th scope="col">{anglais ? "Date" : "Date"}</th><th scope="col">{anglais ? "Amount" : "Montant"}</th></tr></thead><tbody>{transactions.map((transaction) => <tr key={transaction.id} tabIndex={0} role="button" aria-selected={transaction.id === selectionnee?.id} className={transaction.id === selectionnee?.id ? "is-selected" : ""} onClick={() => setSelection(transaction.id)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setSelection(transaction.id); } }}><th scope="row">{libellesTypeTransaction[transaction.type]}</th><td>{new Date(transaction.createdAt).toLocaleDateString(anglais ? "en-US" : "fr-FR")}</td><td className={transaction.montant >= 0 ? "skuup-viewer-positive" : "skuup-viewer-negative"}>{transaction.montant >= 0 ? "+" : ""}{transaction.montant} pts</td></tr>)}</tbody></table></div><aside className="skuup-history-detail" aria-label={anglais ? "Selected movement" : "Mouvement sélectionné"}>{selectionnee ? <><p className="skuup-kicker">{anglais ? "Selected movement" : "Mouvement sélectionné"}</p><h2>{libellesTypeTransaction[selectionnee.type]}</h2><p>{new Date(selectionnee.createdAt).toLocaleString(anglais ? "en-US" : "fr-FR")}</p><strong className={selectionnee.montant >= 0 ? "skuup-viewer-positive" : "skuup-viewer-negative"}>{selectionnee.montant >= 0 ? "+" : ""}{selectionnee.montant} points</strong></> : <p className="skuup-viewer-empty">{anglais ? "Select a movement." : "Sélectionne un mouvement."}</p>}</aside></div>}
        {historique && !erreur && historique.totalPages > 1 && <nav className="skuup-viewer-pagination" aria-label={anglais ? "History pages" : "Pages de l’historique"}><BoutonCTA type="button" variante="secondaire" onClick={() => setPage((courante) => Math.max(1, courante - 1))} disabled={page <= 1}>{anglais ? "Previous" : "Précédente"}</BoutonCTA><span>{page} / {historique.totalPages}</span><BoutonCTA type="button" variante="secondaire" onClick={() => setPage((courante) => Math.min(historique.totalPages, courante + 1))} disabled={page >= historique.totalPages}>{anglais ? "Next" : "Suivante"}</BoutonCTA></nav>}
      </CarteGlow>
    </div>
  );
}

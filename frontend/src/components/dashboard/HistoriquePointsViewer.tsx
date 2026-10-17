"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CarteGlow } from "@/components/ui/CarteGlow";
import { BoutonCTA } from "@/components/ui/BoutonCTA";
import { ErreurApi } from "@/lib/api";
import {
  libellesTypeTransaction,
  recupererHistoriquePoints,
  recupererResumeDashboard,
  sessionsDepuisResume,
  type HistoriquePoints,
  type SessionVisionnageHistorique,
  type TypeTransactionPoints,
} from "@/lib/dashboard";
import { useLanguage } from "@/components/i18n/LanguageProvider";

const vide: HistoriquePoints = {
  transactions: [],
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 1,
};

export function HistoriquePointsViewer() {
  const { langue } = useLanguage();
  const anglais = langue === "en";
  const libelles = anglais
    ? {
        VISITE_QUOTIDIENNE: "Daily check-in",
        WATCH_TIME: "Watch time",
        CARTE_A_GRATTER: "Scratch card",
        AJUSTEMENT_ADMIN: "Admin adjustment",
      }
    : libellesTypeTransaction;
  const [historique, setHistorique] = useState<HistoriquePoints | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [filtre, setFiltre] = useState<"TOUS" | TypeTransactionPoints>("TOUS");
  const [periode, setPeriode] = useState<"TOUTES" | "30">("TOUTES");
  const [maintenant] = useState(() => Date.now());
  const [selection, setSelection] = useState<string | null>(null);
  const [resume, setResume] = useState<SessionVisionnageHistorique[] | null>(
    null,
  );
  const [erreurSessions, setErreurSessions] = useState<string | null>(null);

  const charger = useCallback(
    async (pageDemandee: number) => {
      setErreur(null);
      try {
        setHistorique(await recupererHistoriquePoints(pageDemandee));
      } catch (exception: unknown) {
        setHistorique(vide);
        setErreur(
          exception instanceof ErreurApi
            ? exception.message
            : anglais
              ? "History is unavailable."
              : "L’historique est indisponible.",
        );
      }
    },
    [anglais],
  );

  useEffect(() => {
    queueMicrotask(() => void charger(page));
  }, [charger, page]);
  useEffect(() => {
    let actif = true;
    void recupererResumeDashboard()
      .then((donnees) => {
        if (actif) setResume(sessionsDepuisResume(donnees));
      })
      .catch(() => {
        if (actif)
          setErreurSessions(
            anglais
              ? "Watch sessions are unavailable."
              : "Les sessions de visionnage sont indisponibles.",
          );
      });
    return () => {
      actif = false;
    };
  }, [anglais]);

  const transactions = useMemo(() => {
    const seuil = periode === "30" ? maintenant - 30 * 24 * 60 * 60 * 1000 : 0;
    return (historique?.transactions ?? []).filter(
      (transaction) =>
        (filtre === "TOUS" || transaction.type === filtre) &&
        new Date(transaction.createdAt).getTime() >= seuil,
    );
  }, [filtre, historique, maintenant, periode]);
  const totalPeriode = transactions.reduce(
    (total, transaction) => total + transaction.montant,
    0,
  );
  const selectionnee =
    transactions.find((transaction) => transaction.id === selection) ??
    transactions[0] ??
    null;
  return (
    <div className="skuup-viewer-page">
      <header className="skuup-dashboard-page-header">
        <p className="skuup-kicker">
          {anglais ? "Your activity" : "Ton activité"}
        </p>
        <h1 className="skuup-dashboard-page-title">
          {anglais ? "Points history" : "Historique des points"}
        </h1>
        <p>
          {anglais
            ? "Review only the point movements confirmed by Skkup."
            : "Retrouve uniquement les mouvements de points confirmés par Skkup."}
        </p>
      </header>
      <CarteGlow className="skuup-viewer-section">
        {historique === null && (
          <p role="status" className="skuup-viewer-state">
            {anglais ? "Loading history…" : "Chargement de l’historique…"}
          </p>
        )}
        {erreur && (
          <div className="skuup-viewer-error">
            <p role="alert">{erreur}</p>
            <button
              type="button"
              className="skuup-button skuup-button-outline"
              onClick={() => void charger(page)}
            >
              {anglais ? "Retry" : "Réessayer"}
            </button>
          </div>
        )}
        {historique && !erreur && (
          <>
            <div className="skuup-history-summary">
              <div>
                <span>{anglais ? "Movements" : "Mouvements"}</span>
                <strong>{historique.total}</strong>
              </div>
              <div>
                <span>{anglais ? "Period total" : "Total période"}</span>
                <strong>
                  {totalPeriode >= 0 ? "+" : ""}
                  {totalPeriode} pts
                </strong>
              </div>
              <div>
                <span>{anglais ? "Page" : "Page"}</span>
                <strong>
                  {historique.total === 0
                    ? "0 / 0"
                    : `${historique.page} / ${historique.totalPages}`}
                </strong>
              </div>
            </div>
            <div className="skuup-viewer-toolbar">
              <label>
                {anglais ? "Type" : "Type"}
                <select
                  value={filtre}
                  onChange={(event) => {
                    setFiltre(event.target.value as typeof filtre);
                    setSelection(null);
                  }}
                >
                  <option value="TOUS">
                    {anglais ? "All types" : "Tous les types"}
                  </option>
                  {(
                    Object.keys(
                      libellesTypeTransaction,
                    ) as TypeTransactionPoints[]
                  ).map((type) => (
                    <option key={type} value={type}>
                      {libelles[type]}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                {anglais ? "Period" : "Période"}
                <select
                  value={periode}
                  onChange={(event) =>
                    setPeriode(event.target.value as typeof periode)
                  }
                >
                  <option value="TOUTES">
                    {anglais ? "All time" : "Toutes"}
                  </option>
                  <option value="30">
                    {anglais ? "Last 30 days" : "30 derniers jours"}
                  </option>
                </select>
              </label>
            </div>
          </>
        )}
        {historique && !erreur && transactions.length === 0 && (
          <p className="skuup-viewer-empty">
            {anglais
              ? "No point movement matches these filters."
              : "Aucun mouvement ne correspond à ces filtres."}
          </p>
        )}
        {historique && !erreur && transactions.length > 0 && (
          <div className="skuup-history-master-detail">
            <div className="skuup-history-table-wrap">
              <table className="skuup-history-table">
                <thead>
                  <tr>
                    <th scope="col">Type</th>
                    <th scope="col">Date</th>
                    <th scope="col">{anglais ? "Amount" : "Montant"}</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((transaction) => (
                    <tr
                      key={transaction.id}
                      className={
                        transaction.id === selectionnee?.id ? "is-selected" : ""
                      }
                      tabIndex={0}
                      aria-selected={transaction.id === selectionnee?.id}
                      onClick={() => setSelection(transaction.id)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          setSelection(transaction.id);
                        }
                      }}
                    >
                      <th scope="row">{libelles[transaction.type]}</th>
                      <td>
                        {new Date(transaction.createdAt).toLocaleDateString(
                          anglais ? "en-US" : "fr-FR",
                        )}
                      </td>
                      <td
                        className={
                          transaction.montant >= 0
                            ? "skuup-viewer-positive"
                            : "skuup-viewer-negative"
                        }
                      >
                        {transaction.montant >= 0 ? "+" : ""}
                        {transaction.montant} pts
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <aside
              className="skuup-history-detail"
              aria-labelledby="history-detail-title"
            >
              {selectionnee ? (
                <>
                  <p className="skuup-kicker">
                    {anglais ? "Selected movement" : "Mouvement sélectionné"}
                  </p>
                  <h2 id="history-detail-title">
                    {libelles[selectionnee.type]}
                  </h2>
                  <p>
                    {new Date(selectionnee.createdAt).toLocaleString(
                      anglais ? "en-US" : "fr-FR",
                    )}
                  </p>
                  <strong
                    className={
                      selectionnee.montant >= 0
                        ? "skuup-viewer-positive"
                        : "skuup-viewer-negative"
                    }
                  >
                    {selectionnee.montant >= 0 ? "+" : ""}
                    {selectionnee.montant} points
                  </strong>
                </>
              ) : (
                <p className="skuup-viewer-empty">
                  {anglais ? "Select a movement." : "Sélectionne un mouvement."}
                </p>
              )}
            </aside>
          </div>
        )}
        {historique && !erreur && historique.totalPages > 1 && (
          <nav
            className="skuup-viewer-pagination"
            aria-label={anglais ? "History pages" : "Pages de l’historique"}
          >
            <BoutonCTA
              type="button"
              variante="secondaire"
              onClick={() => setPage((courante) => Math.max(1, courante - 1))}
              disabled={page <= 1}
            >
              {anglais ? "Previous" : "Précédente"}
            </BoutonCTA>
            <span>
              {page} / {historique.totalPages}
            </span>
            <BoutonCTA
              type="button"
              variante="secondaire"
              onClick={() =>
                setPage((courante) =>
                  Math.min(historique.totalPages, courante + 1),
                )
              }
              disabled={page >= historique.totalPages}
            >
              {anglais ? "Next" : "Suivante"}
            </BoutonCTA>
          </nav>
        )}
      </CarteGlow>
      <CarteGlow className="skuup-viewer-section" id="watch-sessions">
        <p className="skuup-kicker">
          {anglais ? "Validated viewing" : "Visionnage validé"}
        </p>
        <h2>{anglais ? "Watch sessions" : "Sessions de visionnage"}</h2>
        <p>
          {anglais
            ? "Only sessions exposed by the authenticated dashboard contract are shown."
            : "Seules les sessions exposées par le contrat authentifié du dashboard sont affichées."}
        </p>
        {resume === null && !erreurSessions && (
          <p role="status" className="skuup-viewer-state">
            {anglais ? "Loading watch sessions…" : "Chargement des sessions…"}
          </p>
        )}
        {erreurSessions && (
          <p role="alert" className="skuup-viewer-error">
            {erreurSessions}
          </p>
        )}
        {resume !== null && !erreurSessions && resume.length === 0 && (
          <p className="skuup-viewer-empty">
            {anglais
              ? "No watch session is exposed by the current API contract. A complete session history requires a dedicated read endpoint."
              : "Aucune session de visionnage n’est exposée par le contrat API actuel. Un historique complet nécessite un endpoint de lecture dédié."}
          </p>
        )}
        {resume !== null && !erreurSessions && resume.length > 0 && (
          <div className="skuup-history-table-wrap">
            <table className="skuup-history-table">
              <caption className="sr-only">
                {anglais
                  ? "Validated watch sessions"
                  : "Sessions de visionnage validées"}
              </caption>
              <thead>
                <tr>
                  <th scope="col">{anglais ? "Platform" : "Plateforme"}</th>
                  <th scope="col">{anglais ? "Stream" : "Chaîne"}</th>
                  <th scope="col">{anglais ? "Duration" : "Durée"}</th>
                  <th scope="col">{anglais ? "Points" : "Points"}</th>
                  <th scope="col">{anglais ? "Date" : "Date"}</th>
                </tr>
              </thead>
              <tbody>
                {resume.map((session) => (
                  <tr key={session.id}>
                    <th scope="row">{session.platform}</th>
                    <td>{session.streamExternalId}</td>
                    <td>{Math.floor(session.dureeValideeSecondes / 60)} min</td>
                    <td
                      className={
                        session.points >= 0
                          ? "skuup-viewer-positive"
                          : "skuup-viewer-negative"
                      }
                    >
                      {session.points >= 0 ? "+" : ""}
                      {session.points}
                    </td>
                    <td>
                      {new Date(session.createdAt).toLocaleDateString(
                        anglais ? "en-US" : "fr-FR",
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CarteGlow>
    </div>
  );
}

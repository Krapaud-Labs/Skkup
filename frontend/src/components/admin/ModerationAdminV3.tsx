"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ErreurApi } from "@/lib/api";
import {
  detailSignalement,
  listerSignalements,
  modifierSignalement,
  type DetailSignalementAdmin,
  type SignalementAdmin,
} from "@/lib/admin";
import { Shell } from "@/components/admin/AdminSectionPage";
import { useLanguage } from "@/components/i18n/LanguageProvider";

const PAGE_SIZE = 10;
type StatusTab = "ALL" | SignalementAdmin["statut"];

function priority(type: string, en = false) {
  const value = type.toLocaleLowerCase();
  return value.includes("fraude") || value.includes("arnaque")
    ? en
      ? "Critical"
      : "Critique"
    : value.includes("abus") || value.includes("inappropr")
      ? en
        ? "High"
        : "Haute"
      : en
        ? "Medium"
        : "Moyenne";
}

function statusLabel(status: SignalementAdmin["statut"], en = false) {
  return status === "OUVERTE"
    ? en
      ? "Pending"
      : "En attente"
    : status === "EXAMINEE"
      ? en
        ? "In review"
        : "En cours"
      : en
        ? "Closed"
        : "Classé";
}

export function ModerationAdminV3() {
  const { langue } = useLanguage();
  const en = langue === "en";
  const text = {
    kicker: en ? "Safety and trust" : "Sécurité et confiance",
    title: en ? "Reports" : "Signalements",
    description: en
      ? "Moderate content using data and evidence returned by the platform."
      : "Modérez les contenus avec les données et preuves réellement retournées par la plateforme.",
    apiNote: en
      ? "Data anonymised by the API"
      : "Données anonymisées par l’API",
    reports: en ? "Reports" : "Signalements",
    followedUsers: en ? "Monitored users" : "Utilisateurs suivis",
    kpiOpen: en ? "Pending reports" : "Signalements en attente",
    kpiExamined: en ? "Under review" : "En cours d’examen",
    kpiIgnored: en ? "Closed" : "Classés",
    kpiUsers: en ? "Affected users" : "Utilisateurs concernés",
    toProcess: en ? "To process" : "À traiter",
    examined: en ? "Reviewed" : "Examinés",
    noFollowUp: en ? "No action" : "Sans suite",
    knownCases: en ? "Known cases" : "Dossiers connus",
    filters: en ? "Moderation filters" : "Filtres de modération",
    search: en ? "Search a report" : "Rechercher un signalement",
    placeholder: en
      ? "Report, username or identifier"
      : "Signalement, pseudo ou identifiant",
    status: en ? "Status" : "Statut",
    reason: en ? "Reason" : "Motif",
    all: en ? "All" : "Tous",
    count: en ? "report" : "signalement",
    page: en ? "Page" : "Page",
    of: en ? "of" : "sur",
    noResults: en ? "No result" : "Aucun résultat",
    empty: en
      ? "No report was returned by the contract."
      : "Aucun signalement renvoyé par le contrat.",
    pagination: en ? "Report pagination" : "Pagination des signalements",
    previous: en ? "Previous page" : "Page précédente",
    next: en ? "Next page" : "Page suivante",
    detail: en ? "Report detail" : "Détail du signalement",
    loading: en
      ? "Loading details and evidence…"
      : "Chargement du détail et des preuves…",
    details: en ? "Report details" : "Détails du signalement",
    userData: en ? "Available user data" : "Données utilisateur disponibles",
    user: en ? "User" : "Utilisateur",
    email: en ? "Email" : "E-mail",
    priority: en ? "Priority" : "Priorité",
    received: en ? "Received on" : "Reçu le",
    evidence: en ? "Available evidence" : "Preuves disponibles",
    noDetails: en
      ? "No detail was provided by the contract."
      : "Aucun détail fourni dans le contrat.",
    session: en ? "Session" : "Session",
    platform: en ? "Platform" : "Plateforme",
    stream: en ? "Stream" : "Flux",
    view: en ? "View" : "Voir",
    timeline: en ? "Report timeline" : "Chronologie du signalement",
    noActions: en ? "No treatment recorded." : "Aucun traitement enregistré.",
    note: en ? "Moderation note" : "Note de modération",
    notePlaceholder: en
      ? "Note visible only to the moderation team"
      : "Note visible uniquement par l’équipe de modération",
    markReviewed: en ? "Mark as reviewed" : "Marquer examinée",
    close: en ? "Close" : "Classer",
    emptyDetail: en ? "Select a report" : "Sélectionnez un signalement",
    emptyDetailText: en
      ? "Evidence and information appear only after reading the API contract."
      : "Les preuves et informations s’afficheront uniquement après lecture du contrat API.",
    loadError: en
      ? "Unable to load reports."
      : "Impossible de charger les signalements.",
    detailError: en
      ? "Unable to load the report details."
      : "Impossible de charger le détail du signalement.",
    updateError: en
      ? "Unable to process the report."
      : "Traitement du signalement impossible.",
    forbidden: en
      ? "This action is restricted to authorised administrators."
      : "Cette action est réservée aux administrateurs autorisés.",
    retry: en ? "Try again" : "Réessayer",
    locale: en ? "en-US" : "fr-FR",
  };
  const [items, setItems] = useState<SignalementAdmin[]>([]);
  const [selected, setSelected] = useState<DetailSignalementAdmin | null>(null);
  const [tab, setTab] = useState<StatusTab>("ALL");
  const [query, setQuery] = useState("");
  const [type, setType] = useState("ALL");
  const [page, setPage] = useState(1);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const boutonPrecedent = useRef<HTMLButtonElement | null>(null);
  const boutonSuivant = useRef<HTMLButtonElement | null>(null);
  const focusPagination = useRef<"precedent" | "suivant" | null>(null);
  const messageErreur = (exception: unknown, fallback: string) =>
    exception instanceof ErreurApi && exception.statut === 403
      ? text.forbidden
      : fallback;

  useEffect(() => {
    void listerSignalements()
      .then(setItems)
      .catch((exception) => setError(messageErreur(exception, text.loadError)));
  }, []);
  const counts = useMemo(
    () => ({
      all: items.length,
      open: items.filter((item) => item.statut === "OUVERTE").length,
      examined: items.filter((item) => item.statut === "EXAMINEE").length,
      ignored: items.filter((item) => item.statut === "IGNOREE").length,
    }),
    [items],
  );
  const types = useMemo(
    () => Array.from(new Set(items.map((item) => item.type))).sort(),
    [items],
  );
  const filtered = useMemo(
    () =>
      items.filter(
        (item) =>
          (tab === "ALL" || item.statut === tab) &&
          (type === "ALL" || item.type === type) &&
          (!query.trim() ||
            `${item.id} ${item.type} ${item.user.pseudo} ${item.user.email}`
              .toLocaleLowerCase()
              .includes(query.trim().toLocaleLowerCase())),
      ),
    [items, query, tab, type],
  );
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const visible = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  useEffect(() => {
    const cible = focusPagination.current;
    if (!cible) return;
    focusPagination.current = null;
    const bouton =
      cible === "suivant" ? boutonSuivant.current : boutonPrecedent.current;
    const repli =
      cible === "suivant" ? boutonPrecedent.current : boutonSuivant.current;
    (bouton && !bouton.disabled ? bouton : repli)?.focus();
  }, [page]);
  async function select(item: SignalementAdmin) {
    setLoading(true);
    setError(null);
    try {
      setSelected(await detailSignalement(item.id));
    } catch (exception) {
      setError(messageErreur(exception, text.detailError));
    } finally {
      setLoading(false);
    }
  }
  async function update(status: "EXAMINEE" | "IGNOREE") {
    if (!selected) return;
    setError(null);
    try {
      const next = await modifierSignalement(selected.id, status, note);
      setItems((all) => all.map((item) => (item.id === next.id ? next : item)));
      setSelected((current) => (current ? { ...current, ...next } : current));
      setNote("");
    } catch (exception) {
      setError(messageErreur(exception, text.updateError));
    }
  }

  return (
    <Shell section="moderation">
      <div className="skuup-moderation-admin-v3">
        <header className="skuup-moderation-heading">
          <div>
            <p className="skuup-kicker">{text.kicker}</p>
            <h2>{text.title}</h2>
            <p>{text.description}</p>
          </div>
          <span className="skuup-admin-contract-note">{text.apiNote}</span>
        </header>
        <div
          className="skuup-moderation-tabs"
          role="tablist"
          aria-label={text.filters}
        >
          <button
            id="moderation-tab-reports"
            className="is-active"
            role="tab"
            aria-controls="moderation-workspace"
            aria-selected="true"
            type="button"
          >
            {text.reports} <b>{counts.all}</b>
          </button>
          <span>
            {text.followedUsers}{" "}
            <b>
              {items.length
                ? new Set(items.map((item) => item.user.id)).size
                : 0}
            </b>
          </span>
        </div>
        <div className="skuup-moderation-kpis" aria-label={text.title}>
          <article>
            <span>{text.kpiOpen}</span>
            <strong>{counts.open}</strong>
            <small>{text.toProcess}</small>
          </article>
          <article>
            <span>{text.kpiExamined}</span>
            <strong>{counts.examined}</strong>
            <small>{text.examined}</small>
          </article>
          <article>
            <span>{text.kpiIgnored}</span>
            <strong>{counts.ignored}</strong>
            <small>{text.noFollowUp}</small>
          </article>
          <article>
            <span>{text.kpiUsers}</span>
            <strong>{new Set(items.map((item) => item.user.id)).size}</strong>
            <small>{text.knownCases}</small>
          </article>
        </div>
        <section
          id="moderation-workspace"
          className="skuup-moderation-workspace"
          role="tabpanel"
          aria-labelledby="moderation-tab-reports"
        >
          <div className="skuup-premium-panel skuup-moderation-list">
            <div className="skuup-moderation-filters">
              <label>
                {text.search}
                <input
                  className="skuup-admin-input"
                  aria-label={text.search}
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={text.placeholder}
                />
              </label>
              <label>
                {text.status}
                <select
                  className="skuup-admin-input"
                  aria-label={text.status}
                  value={tab}
                  onChange={(event) => setTab(event.target.value as StatusTab)}
                >
                  <option value="ALL">{text.all}</option>
                  <option value="OUVERTE">{statusLabel("OUVERTE", en)}</option>
                  <option value="EXAMINEE">
                    {statusLabel("EXAMINEE", en)}
                  </option>
                  <option value="IGNOREE">{statusLabel("IGNOREE", en)}</option>
                </select>
              </label>
              <label>
                {text.reason}
                <select
                  className="skuup-admin-input"
                  aria-label={text.reason}
                  value={type}
                  onChange={(event) => setType(event.target.value)}
                >
                  <option value="ALL">{text.all}</option>
                  {types.map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="skuup-moderation-list-header">
              <span>
                {filtered.length} {text.count}
                {filtered.length > 1 && !en ? "s" : ""}
              </span>
              <span>
                {text.page} {page} / {pages}
              </span>
            </div>
            <div className="skuup-moderation-records">
              {visible.map((item) => (
                <button
                  type="button"
                  key={item.id}
                  aria-pressed={selected?.id === item.id}
                  className={`skuup-moderation-record ${selected?.id === item.id ? "is-selected" : ""}`}
                  onClick={() => void select(item)}
                >
                  <span className="skuup-moderation-record-id">
                    #{item.id.slice(-6).toUpperCase()}
                  </span>
                  <span>
                    <strong>{item.user.pseudo}</strong>
                    <small>{item.type}</small>
                    <small>{item.user.email}</small>
                  </span>
                  <span
                    className={`skuup-priority skuup-priority-${priority(item.type).toLocaleLowerCase()}`}
                  >
                    {priority(item.type, en)}
                  </span>
                  <span className="skuup-status-badge">
                    {statusLabel(item.statut, en)}
                  </span>
                  <time>
                    {new Date(item.createdAt).toLocaleDateString(text.locale)}
                  </time>
                  <span className="skuup-moderation-view">{text.view}</span>
                </button>
              ))}
              {!visible.length && (
                <p className="skuup-admin-inline-empty">{text.empty}</p>
              )}
            </div>
            <nav
              className="skuup-moderation-pagination"
              aria-label={text.pagination}
            >
              <span>
                {filtered.length
                  ? `${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, filtered.length)} ${text.of} ${filtered.length}`
                  : text.noResults}
              </span>
              <div>
                <button
                  type="button"
                  aria-label={text.previous}
                  ref={boutonPrecedent}
                  disabled={page <= 1}
                  onClick={() => {
                    focusPagination.current = "precedent";
                    setPage((value) => value - 1);
                  }}
                >
                  ‹
                </button>
                <button
                  type="button"
                  aria-label={text.next}
                  ref={boutonSuivant}
                  disabled={page >= pages}
                  onClick={() => {
                    focusPagination.current = "suivant";
                    setPage((value) => value + 1);
                  }}
                >
                  ›
                </button>
              </div>
            </nav>
          </div>
          <aside
            className="skuup-premium-panel skuup-moderation-detail"
            aria-label={text.detail}
          >
            {loading ? (
              <p role="status">{text.loading}</p>
            ) : selected ? (
              <>
                <div className="skuup-detail-topline">
                  <span>#{selected.id.slice(-6).toUpperCase()}</span>
                  <span className="skuup-status-badge">
                    {statusLabel(selected.statut, en)}
                  </span>
                </div>
                <h3>{text.details}</h3>
                <p className="skuup-kicker">Données utilisateur disponibles</p>
                <dl className="skuup-moderation-summary">
                  <div>
                    <dt>{text.user}</dt>
                    <dd>{selected.user.pseudo}</dd>
                  </div>
                  <div>
                    <dt>{text.email}</dt>
                    <dd>{selected.user.email}</dd>
                  </div>
                  <div>
                    <dt>{text.reason}</dt>
                    <dd>{selected.type}</dd>
                  </div>
                  <div>
                    <dt>{text.priority}</dt>
                    <dd>
                      <span
                        className={`skuup-priority skuup-priority-${priority(selected.type).toLocaleLowerCase()}`}
                      >
                        {priority(selected.type, en)}
                      </span>
                    </dd>
                  </div>
                  <div>
                    <dt>{text.received}</dt>
                    <dd>
                      {new Date(selected.createdAt).toLocaleString(text.locale)}
                    </dd>
                  </div>
                </dl>
                <section className="skuup-moderation-evidence">
                  <h4>{text.evidence}</h4>
                  <p>{selected.details || text.noDetails}</p>
                  {selected.watchSession && (
                    <dl>
                      <div>
                        <dt>{text.session}</dt>
                        <dd>{selected.watchSession.id}</dd>
                      </div>
                      <div>
                        <dt>{text.platform}</dt>
                        <dd>{selected.watchSession.platform}</dd>
                      </div>
                      <div>
                        <dt>{text.stream}</dt>
                        <dd>{selected.watchSession.streamExternalId}</dd>
                      </div>
                    </dl>
                  )}
                </section>
                <section>
                  <h4>{text.timeline}</h4>
                  {selected.audit.length ? (
                    <ol className="skuup-moderation-timeline">
                      {selected.audit.map((event) => (
                        <li key={event.id}>
                          <time>
                            {new Date(event.createdAt).toLocaleString(
                              text.locale,
                            )}
                          </time>
                          <strong>{event.action}</strong>
                          <span>{event.actor.pseudo}</span>
                        </li>
                      ))}
                    </ol>
                  ) : (
                    <p className="skuup-admin-inline-empty">{text.noActions}</p>
                  )}
                </section>
                {selected.statut === "OUVERTE" && (
                  <div className="skuup-moderation-actions">
                    <label>
                      {text.note}
                      <textarea
                        className="skuup-admin-input"
                        maxLength={500}
                        value={note}
                        onChange={(event) => setNote(event.target.value)}
                        placeholder={text.notePlaceholder}
                      />
                      <small>{note.length}/500</small>
                    </label>
                    <div>
                      <button
                        className="skuup-button skuup-button-primary"
                        type="button"
                        onClick={() => void update("EXAMINEE")}
                      >
                        {text.markReviewed}
                      </button>
                      <button
                        className="skuup-button skuup-button-outline"
                        type="button"
                        onClick={() => void update("IGNOREE")}
                      >
                        {text.close}
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="skuup-user-detail-empty">
                <p className="skuup-kicker">Détail du dossier</p>
                <h3>{text.emptyDetail}</h3>
                <p>
                  Les preuves et informations s’afficheront uniquement après
                  lecture du contrat API.
                </p>
              </div>
            )}
          </aside>
        </section>
        {error && (
          <p role="alert" className="skuup-admin-alert skuup-admin-alert-error">
            {error}
          </p>
        )}
      </div>
    </Shell>
  );
}

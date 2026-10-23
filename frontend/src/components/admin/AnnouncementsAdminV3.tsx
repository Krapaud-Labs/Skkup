"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";
import {
  archiverAnnonce,
  creerAnnonce,
  historiqueAnnonce,
  listerAnnonces,
  modifierAnnonce,
  publierAnnonce,
  restaurerAnnonce,
  type AnnonceAdmin,
  type EvenementAnnonceAdmin,
} from "@/lib/admin";
import { ErreurApi } from "@/lib/api";
import { Shell } from "@/components/admin/AdminSectionPage";
import { useLanguage } from "@/components/i18n/LanguageProvider";

const copy = {
  fr: {
    kicker: "Éditorial",
    title: "Annonces et contenus",
    description:
      "Gérez les annonces renvoyées par l’API et leur traçabilité de publication.",
    newAnnouncement: "＋ Nouvelle annonce",
    library: "Bibliothèque éditoriale",
    published: "Annonces publiées",
    all: "Toutes",
    publishedTab: "Publiées",
    drafts: "Brouillons",
    draftStatus: "Brouillon",
    scheduled: "Planifiées",
    expired: "Expirées",
    archived: "Archivées",
    search: "Rechercher une annonce",
    placeholder: "Rechercher un titre ou contenu…",
    period: "Filtrer les annonces par période",
    allPeriods: "Toutes les périodes",
    apiData: "Données API",
    announcement: "Annonce",
    status: "Statut",
    publication: "Publication",
    created: "Créée",
    action: "Action",
    open: "Ouvrir",
    loading: "Chargement des annonces…",
    empty: "Aucune annonce renvoyée par le contrat.",
    retry: "Réessayer",
    editorDetail: "Détail de l’annonce",
    edit: "Édition",
    revisions: "Révisions",
    history: "Historique",
    controlledEdit: "Édition contrôlée",
    newResource: "Nouvelle ressource",
    editAnnouncement: "Modifier l’annonce",
    createAnnouncement: "Créer une annonce",
    titleField: "Titre",
    messageField: "Message",
    start: "Publication",
    end: "Fin de publication",
    saving: "Enregistrement…",
    save: "Enregistrer les modifications",
    create: "Créer l’annonce",
    archive: "Archiver",
    publish: "Publier",
    restore: "Restaurer",
    traceability: "Traçabilité API",
    returnedRevisions: "Révisions renvoyées",
    publicationHistory: "Historique de publication",
    noEvents: "Aucun événement renvoyé par le contrat.",
    metadata: "Métadonnées disponibles",
    noSchedule: "Non planifiée",
    from: "À partir du",
    until: "Jusqu’au",
    to: "au",
    lastData: "Dernière donnée renvoyée le",
    active: "Publiée",
    archivedStatus: "Archivée",
    loadError: "Impossible de charger les annonces.",
    historyError: "Historique indisponible.",
    saveError: "Enregistrement impossible.",
    statusError: "Modification du statut impossible.",
    forbidden:
      "Cette action est réservée aux comptes administrateurs autorisés.",
    createdMessage: "Annonce créée depuis le contrat administrateur.",
    updatedMessage: "Annonce mise à jour depuis le contrat administrateur.",
    archivedMessage: "Annonce archivée.",
    publishedMessage: "Annonce publiée.",
    restoredMessage: "Annonce restaurée.",
    restoreUnavailable: "Aucun archivage restaurable n’est présent dans l’historique.",
    locale: "fr-FR",
  },
  en: {
    kicker: "Editorial",
    title: "Announcements and content",
    description:
      "Manage announcements returned by the API and their publication traceability.",
    newAnnouncement: "＋ New announcement",
    library: "Editorial library",
    published: "Published announcements",
    all: "All",
    publishedTab: "Published",
    drafts: "Drafts",
    draftStatus: "Draft",
    scheduled: "Scheduled",
    expired: "Expired",
    archived: "Archived",
    search: "Search announcements",
    placeholder: "Search a title or message…",
    period: "Filter announcements by period",
    allPeriods: "All periods",
    apiData: "API data",
    announcement: "Announcement",
    status: "Status",
    publication: "Publication",
    created: "Created",
    action: "Action",
    open: "Open",
    loading: "Loading announcements…",
    empty: "No announcement was returned by the contract.",
    retry: "Try again",
    editorDetail: "Announcement detail",
    edit: "Edit",
    revisions: "Revisions",
    history: "History",
    controlledEdit: "Controlled edit",
    newResource: "New resource",
    editAnnouncement: "Edit announcement",
    createAnnouncement: "Create announcement",
    titleField: "Title",
    messageField: "Message",
    start: "Publication",
    end: "End of publication",
    saving: "Saving…",
    save: "Save changes",
    create: "Create announcement",
    archive: "Archive",
    publish: "Publish",
    restore: "Restore",
    traceability: "API traceability",
    returnedRevisions: "Returned revisions",
    publicationHistory: "Publication history",
    noEvents: "No event was returned by the contract.",
    metadata: "Available metadata",
    noSchedule: "Not scheduled",
    from: "From",
    until: "Until",
    to: "to",
    lastData: "Last data returned on",
    active: "Published",
    archivedStatus: "Archived",
    loadError: "Unable to load announcements.",
    historyError: "History unavailable.",
    saveError: "Unable to save the announcement.",
    statusError: "Unable to update the status.",
    forbidden: "This action is limited to authorised administrator accounts.",
    createdMessage: "Announcement created through the administration contract.",
    updatedMessage: "Announcement updated through the administration contract.",
    archivedMessage: "Announcement archived.",
    publishedMessage: "Announcement published.",
    restoredMessage: "Announcement restored.",
    restoreUnavailable: "No restorable archive is present in the history.",
    locale: "en-US",
  },
} as const;
type AnnouncementCopy = typeof copy.fr | typeof copy.en;

function formatDate(
  value: string | null,
  langue: "fr" | "en",
  t: AnnouncementCopy,
) {
  if (!value) return t.noSchedule;
  return new Intl.DateTimeFormat(langue === "en" ? "en-US" : "fr-FR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}
function publication(
  item: AnnonceAdmin,
  langue: "fr" | "en",
  t: AnnouncementCopy,
) {
  if (!item.debutAt && !item.finAt) return t.noSchedule;
  if (item.debutAt && item.finAt)
    return `${formatDate(item.debutAt, langue, t)} ${t.to} ${formatDate(item.finAt, langue, t)}`;
  return item.debutAt
    ? `${t.from} ${formatDate(item.debutAt, langue, t)}`
    : `${t.until} ${formatDate(item.finAt, langue, t)}`;
}
function editorialStatus(item: AnnonceAdmin, now = Date.now()) {
  if (item.status === "DRAFT") return "BROUILLON" as const;
  if (item.status === "ARCHIVED") return "ARCHIVÉE" as const;
  const start = item.debutAt ? new Date(item.debutAt).getTime() : null;
  const end = item.finAt ? new Date(item.finAt).getTime() : null;
  if (start !== null && start > now) return "PLANIFIÉE" as const;
  if (end !== null && end < now) return "EXPIRÉE" as const;
  return "PUBLIÉE" as const;
}
function editorialStatusLabel(item: AnnonceAdmin, langue: "fr" | "en") {
  const labels =
    langue === "en"
      ? {
          PUBLIÉE: "Published",
          BROUILLON: "Draft",
          PLANIFIÉE: "Scheduled",
          EXPIRÉE: "Expired",
          ARCHIVÉE: "Archived",
        }
      : {
          PUBLIÉE: "Publiée",
          BROUILLON: "Brouillon",
          PLANIFIÉE: "Planifiée",
          EXPIRÉE: "Expirée",
          ARCHIVÉE: "Archivée",
        };
  return labels[editorialStatus(item)];
}
function eventLabel(event: EvenementAnnonceAdmin) {
  return event.action
    .replaceAll("_", " ")
    .toLocaleLowerCase()
    .replace(/^./, (value) => value.toUpperCase());
}

function latestRestorableArchive(events: EvenementAnnonceAdmin[]) {
  const restoredEventIds = new Set(
    events
      .filter((entry) => entry.action === "ANNOUNCEMENT_RESTORED")
      .map((entry) => entry.metadata.sourceEventId)
      .filter((id): id is string => typeof id === "string"),
  );
  return events.find(
    (entry) =>
      entry.action === "ANNOUNCEMENT_ARCHIVED" &&
      !restoredEventIds.has(entry.id),
  );
}
function announcementButtonLabel(t: AnnouncementCopy, title: string) {
  return `${t.open}${t.locale === "fr-FR" ? " l’annonce" : " announcement"} ${title}`;
}

export function AnnouncementsAdminV3() {
  const { langue } = useLanguage();
  const t = copy[langue];
  const [items, setItems] = useState<AnnonceAdmin[]>([]);
  const [selected, setSelected] = useState<AnnonceAdmin | null>(null);
  const [history, setHistory] = useState<EvenementAnnonceAdmin[]>([]);
  const [tab, setTab] = useState<"edition" | "revisions" | "historique">(
    "edition",
  );
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [debutAt, setDebutAt] = useState("");
  const [finAt, setFinAt] = useState("");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("TOUS");
  const [period, setPeriod] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const historyRequestId = useRef(0);

  const selectAnnouncement = useCallback(async (item: AnnonceAdmin) => {
    setSelected(item);
    setTitle(item.titre);
    setText(item.texte);
    setDebutAt(item.debutAt?.slice(0, 16) ?? "");
    setFinAt(item.finAt?.slice(0, 16) ?? "");
    setTab("edition");
    setHistory([]);
    const requestId = ++historyRequestId.current;
    try {
      const events = await historiqueAnnonce(item.id);
      if (requestId === historyRequestId.current) setHistory(events);
    } catch (exception: unknown) {
      setError(
        exception instanceof ErreurApi && exception.statut === 403
          ? t.forbidden
          : t.historyError,
      );
    }
  }, [t.forbidden, t.historyError]);

  const charger = useCallback(async () => {
    setLoading(true);
    setError(null);
    setMessage(null);
    setItems([]);
    setSelected(null);
    historyRequestId.current += 1;
    setHistory([]);
    try {
      const loaded = await listerAnnonces();
      setItems(loaded);
      if (loaded[0]) void selectAnnouncement(loaded[0]);
    } catch (exception: unknown) {
      setError(
        exception instanceof ErreurApi && exception.statut === 403
          ? t.forbidden
          : t.loadError,
      );
    } finally {
      setLoading(false);
    }
  }, [selectAnnouncement, t.forbidden, t.loadError]);

  useEffect(() => {
    void Promise.resolve().then(charger);
  }, [charger]);
  function newAnnouncement() {
    setSelected(null);
    setTitle("");
    setText("");
    setDebutAt("");
    setFinAt("");
    historyRequestId.current += 1;
    setHistory([]);
    setTab("edition");
    setMessage(null);
  }
  async function save(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const dates = {
        ...(debutAt ? { debutAt: new Date(debutAt).toISOString() } : {}),
        ...(finAt ? { finAt: new Date(finAt).toISOString() } : {}),
      };
      const next = selected
        ? await modifierAnnonce(selected.id, {
            titre: title,
            texte: text,
            ...dates,
          })
        : ((await creerAnnonce(title, text, dates)) as AnnonceAdmin);
      setItems((all) =>
        selected
          ? all.map((item) => (item.id === next.id ? next : item))
          : [next, ...all],
      );
      setSelected(next);
      setMessage(selected ? t.updatedMessage : t.createdMessage);
      if (selected) setHistory(await historiqueAnnonce(next.id));
    } catch (exception: unknown) {
      setError(
        exception instanceof ErreurApi && exception.statut === 403
          ? t.forbidden
          : t.saveError,
      );
    } finally {
      setSaving(false);
    }
  }
  async function toggle(item: AnnonceAdmin) {
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      let next: AnnonceAdmin;
      if (item.status === "DRAFT") {
        next = await publierAnnonce(item.id);
        setMessage(t.publishedMessage);
      } else if (item.status === "PUBLISHED") {
        next = await archiverAnnonce(item.id);
        setItems((all) => all.map((x) => (x.id === item.id ? next : x)));
        setSelected(next);
        setMessage(t.archivedMessage);
        // Do not leave the pre-archive event list active. Restore must use
        // the fresh archive event returned by the backend history endpoint.
        const requestId = ++historyRequestId.current;
        setHistory([]);
        try {
          const events = await historiqueAnnonce(item.id);
          if (requestId === historyRequestId.current) setHistory(events);
        } catch {
          setError(t.historyError);
        }
        return;
      } else {
        const archiveEvent = latestRestorableArchive(history);
        if (!archiveEvent) {
          setError(t.restoreUnavailable);
          return;
        }
        next = await restaurerAnnonce(item.id, archiveEvent.id);
        setItems((all) => all.map((x) => (x.id === item.id ? next : x)));
        setSelected(next);
        setMessage(t.restoredMessage);
        const requestId = ++historyRequestId.current;
        setHistory([]);
        try {
          const events = await historiqueAnnonce(item.id);
          if (requestId === historyRequestId.current) setHistory(events);
        } catch {
          setError(t.historyError);
        }
        return;
      }
      setItems((all) => all.map((x) => (x.id === item.id ? next : x)));
      setSelected(next);
    } catch (exception: unknown) {
      setError(
        exception instanceof ErreurApi && exception.statut === 403
          ? t.forbidden
          : t.statusError,
      );
    } finally {
      setSaving(false);
    }
  }
  const statusCounts = useMemo(
    () =>
      items.reduce(
        (counts, item) => {
          const key = editorialStatus(item);
          counts[key] += 1;
          return counts;
        },
        { BROUILLON: 0, PUBLIÉE: 0, PLANIFIÉE: 0, ARCHIVÉE: 0, EXPIRÉE: 0 },
      ),
    [items],
  );
  const visibleItems = useMemo(
    () =>
      items.filter((item) => {
        const locale = langue === "en" ? "en-US" : "fr-FR";
        const haystack = `${item.titre} ${item.texte}`.toLocaleLowerCase(
          locale,
        );
        const matchesPeriod =
          !period ||
          [item.debutAt, item.finAt, item.createdAt].some((value) =>
            value?.startsWith(period),
          );
        return (
          (!query.trim() ||
            haystack.includes(query.trim().toLocaleLowerCase(locale))) &&
          (status === "TOUS" || editorialStatus(item) === status) &&
          matchesPeriod
        );
      }),
    [items, langue, period, query, status],
  );

  return (
    <Shell section="announcements">
      <div className="skuup-admin-master-detail skuup-announcements-layout">
        <header className="skuup-announcements-heading">
          <div>
            <p className="skuup-kicker">{t.kicker}</p>
            <h2>{t.title}</h2>
            <p>{t.description}</p>
          </div>
          <button
            type="button"
            className="skuup-button skuup-button-primary"
            onClick={newAnnouncement}
          >
            {t.newAnnouncement}
          </button>
        </header>
        <section
          className="skuup-premium-panel skuup-admin-collection"
          aria-labelledby="announcements-list-title"
        >
          <div className="skuup-admin-panel-heading">
            <div>
              <p className="skuup-kicker">{t.library}</p>
              <h2 id="announcements-list-title">{t.published}</h2>
            </div>
            <span className="skuup-admin-count">
              {visibleItems.length} / {items.length}
            </span>
          </div>
          {error && (
            <div className="skuup-admin-alert skuup-admin-alert-error">
              <p role="alert">{error}</p>
              <button
                type="button"
                className="skuup-button skuup-button-outline"
                onClick={() => void charger()}
                disabled={loading}
              >
                {t.retry}
              </button>
            </div>
          )}
          {message && (
            <p
              role="status"
              className="skuup-admin-alert skuup-admin-alert-success"
            >
              {message}
            </p>
          )}
          <div
            className="skuup-announcement-tabs"
            role="tablist"
            aria-label={t.published}
          >
            <button
              id="announcements-tab-all"
              type="button"
              role="tab"
              aria-controls="announcements-list-panel"
              aria-selected={status === "TOUS"}
              className={status === "TOUS" ? "is-active" : ""}
              onClick={() => setStatus("TOUS")}
            >
              {t.all} · {items.length}
            </button>
            <button
              id="announcements-tab-draft"
              type="button"
              role="tab"
              aria-controls="announcements-list-panel"
              aria-selected={status === "BROUILLON"}
              className={status === "BROUILLON" ? "is-active" : ""}
              onClick={() => setStatus("BROUILLON")}
            >
              {t.drafts} · {statusCounts.BROUILLON}
            </button>
            <button
              id="announcements-tab-published"
              type="button"
              role="tab"
              aria-controls="announcements-list-panel"
              aria-selected={status === "PUBLIÉE"}
              className={status === "PUBLIÉE" ? "is-active" : ""}
              onClick={() => setStatus("PUBLIÉE")}
            >
              {t.publishedTab} · {statusCounts.PUBLIÉE}
            </button>
            <button
              id="announcements-tab-scheduled"
              type="button"
              role="tab"
              aria-controls="announcements-list-panel"
              aria-selected={status === "PLANIFIÉE"}
              className={status === "PLANIFIÉE" ? "is-active" : ""}
              onClick={() => setStatus("PLANIFIÉE")}
            >
              {t.scheduled} · {statusCounts.PLANIFIÉE}
            </button>
            <button
              id="announcements-tab-expired"
              type="button"
              role="tab"
              aria-controls="announcements-list-panel"
              aria-selected={status === "EXPIRÉE"}
              className={status === "EXPIRÉE" ? "is-active" : ""}
              onClick={() => setStatus("EXPIRÉE")}
            >
              {t.expired} · {statusCounts.EXPIRÉE}
            </button>
            <button
              id="announcements-tab-archived"
              type="button"
              role="tab"
              aria-controls="announcements-list-panel"
              aria-selected={status === "ARCHIVÉE"}
              className={status === "ARCHIVÉE" ? "is-active" : ""}
              onClick={() => setStatus("ARCHIVÉE")}
            >
              {t.archived} · {statusCounts.ARCHIVÉE}
            </button>
          </div>
          <div
            className="skuup-announcements-toolbar"
            role="search"
            aria-label={t.published}
          >
            <div className="skuup-announcements-filters">
              <input
                className="skuup-admin-input"
                aria-label={t.search}
                placeholder={t.placeholder}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
              <select
                className="skuup-admin-input"
                aria-label={t.period}
                value={period}
                onChange={(event) => setPeriod(event.target.value)}
              >
                <option value="">{t.allPeriods}</option>
                {Array.from(
                  new Set(
                    items.flatMap((item) =>
                      [item.debutAt, item.finAt]
                        .filter(Boolean)
                        .map((value) => value!.slice(0, 7)),
                    ),
                  ),
                )
                  .sort()
                  .map((value) => (
                    <option value={value} key={value}>
                      {value}
                    </option>
                  ))}
              </select>
            </div>
            <span className="skuup-status-badge">
              {t.apiData} · {visibleItems.length}
            </span>
          </div>
          <div className="skuup-announcements-table-head" aria-hidden="true">
            <span>{t.announcement}</span>
            <span>{t.status}</span>
            <span>{t.publication}</span>
            <span>{t.created}</span>
            <span>{t.action}</span>
          </div>
          <div
            id="announcements-list-panel"
            className="skuup-announcements-record-list mt-4"
            role="tabpanel"
            aria-labelledby={`announcements-tab-${status === "TOUS" ? "all" : status === "BROUILLON" ? "draft" : status === "PUBLIÉE" ? "published" : status === "PLANIFIÉE" ? "scheduled" : status === "EXPIRÉE" ? "expired" : "archived"}`}
          >
            <div role="list">
              {loading ? (
                <p className="skuup-admin-inline-empty" role="status">
                  {t.loading}
                </p>
              ) : (
                visibleItems.map((item) => (
                  <article
                    className={`skuup-announcement-record ${selected?.id === item.id ? "is-selected" : ""}`}
                    key={item.id}
                    role="listitem"
                  >
                    <button
                      type="button"
                      aria-label={announcementButtonLabel(t, item.titre)}
                      aria-pressed={selected?.id === item.id}
                      className="skuup-announcement-record-select"
                      onClick={() => void selectAnnouncement(item)}
                    >
                      <span className="skuup-announcement-record-main">
                        <strong>{item.titre}</strong>
                        <span>{item.texte}</span>
                      </span>
                      <span className="skuup-announcement-record-status">
                        <small>{t.status}</small>
                        <span className="skuup-status-badge">
                          {editorialStatusLabel(item, langue)}
                        </span>
                      </span>
                      <span className="skuup-announcement-record-meta">
                        <small>{t.publication}</small>
                        <span>{publication(item, langue, t)}</span>
                      </span>
                      <span className="skuup-announcement-record-meta">
                        <small>{t.created}</small>
                        <time dateTime={item.createdAt}>
                          {formatDate(item.createdAt, langue, t)}
                        </time>
                      </span>
                      <span
                        className="skuup-announcement-record-action"
                        aria-hidden="true"
                      >
                        {t.open} <span>→</span>
                      </span>
                    </button>
                  </article>
                ))
              )}
              {!loading && !visibleItems.length && (
                <p className="skuup-admin-inline-empty">{t.empty}</p>
              )}
            </div>
          </div>
        </section>
        <form
          className="skuup-premium-panel skuup-admin-detail skuup-announcement-editor"
          aria-labelledby="announcement-editor-title"
          onSubmit={save}
        >
          {selected && (
            <div className="skuup-announcement-selected">
              <span
                className="skuup-announcement-selected-mark"
                aria-hidden="true"
              >
                ●
              </span>
              <div>
                <strong>{selected.titre}</strong>
                <span>
                  {t.lastData} {formatDate(selected.createdAt, langue, t)}
                </span>
              </div>
              <span className="skuup-status-badge">
                {selected.status === "DRAFT" ? t.draftStatus : selected.status === "PUBLISHED" ? t.active : t.archivedStatus}
              </span>
            </div>
          )}
          <div
            className="skuup-announcement-editor-tabs"
            role="tablist"
            aria-label={t.editorDetail}
          >
            <button
              id="announcement-tab-edition"
              type="button"
              role="tab"
              aria-controls="announcement-editor-panel"
              aria-selected={tab === "edition"}
              className={tab === "edition" ? "is-active" : ""}
              onClick={() => setTab("edition")}
            >
              {t.edit}
            </button>
            <button
              id="announcement-tab-revisions"
              type="button"
              role="tab"
              aria-controls="announcement-editor-panel"
              aria-selected={tab === "revisions"}
              className={tab === "revisions" ? "is-active" : ""}
              onClick={() => setTab("revisions")}
              disabled={!selected}
            >
              {t.revisions} ({history.length})
            </button>
            <button
              id="announcement-tab-history"
              type="button"
              role="tab"
              aria-controls="announcement-editor-panel"
              aria-selected={tab === "historique"}
              className={tab === "historique" ? "is-active" : ""}
              onClick={() => setTab("historique")}
              disabled={!selected}
            >
              {t.history}
            </button>
          </div>
          <div
            id="announcement-editor-panel"
            role="tabpanel"
            aria-labelledby={`announcement-tab-${tab === "edition" ? "edition" : tab === "revisions" ? "revisions" : "history"}`}
          >
            {tab === "edition" ? (
              <>
                <p className="skuup-kicker">
                  {selected ? t.controlledEdit : t.newResource}
                </p>
                <h2 id="announcement-editor-title">
                  {selected ? t.editAnnouncement : t.createAnnouncement}
                </h2>
                <label className="skuup-admin-field mt-5">
                  {t.titleField}
                  <input
                    className="skuup-admin-input"
                    required
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                  />
                </label>
                <label className="skuup-admin-field mt-3">
                  {t.messageField}
                  <textarea
                    className="skuup-admin-input min-h-40"
                    required
                    value={text}
                    onChange={(event) => setText(event.target.value)}
                  />
                </label>
                <div className="skuup-announcement-date-grid mt-3">
                  <label className="skuup-admin-field">
                    {t.start}
                    <input
                      className="skuup-admin-input"
                      type="datetime-local"
                      value={debutAt}
                      onChange={(event) => setDebutAt(event.target.value)}
                    />
                  </label>
                  <label className="skuup-admin-field">
                    {t.end}
                    <input
                      className="skuup-admin-input"
                      type="datetime-local"
                      value={finAt}
                      onChange={(event) => setFinAt(event.target.value)}
                    />
                  </label>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    className="skuup-button skuup-button-primary"
                    disabled={saving || selected?.status === "ARCHIVED"}
                  >
                    {saving ? t.saving : selected ? t.save : t.create}
                  </button>
                  {selected && selected.status !== "ARCHIVED" && (
                    <button
                      type="button"
                      className="skuup-button skuup-button-outline"
                      onClick={() => void toggle(selected)}
                      disabled={saving}
                    >
                      {selected.status === "DRAFT" ? t.publish : t.archive}
                    </button>
                  )}
                  {selected?.status === "ARCHIVED" && (
                    <button type="button" className="skuup-button skuup-button-outline" onClick={() => void toggle(selected)} disabled={saving}>
                      {t.restore}
                    </button>
                  )}
                </div>
              </>
            ) : (
              <section
                className="skuup-admin-timeline"
                aria-label={tab === "revisions" ? t.revisions : t.history}
              >
                <p className="skuup-kicker">{t.traceability}</p>
                <h2>
                  {tab === "revisions"
                    ? t.returnedRevisions
                    : t.publicationHistory}
                </h2>
                {history.length ? (
                  <ol>
                    {history.map((entry) => (
                      <li key={entry.id}>
                        <span
                          className="skuup-timeline-dot"
                          aria-hidden="true"
                        />
                        <div>
                          <strong>{eventLabel(entry)}</strong>
                          <time dateTime={entry.createdAt}>
                            {formatDate(entry.createdAt, langue, t)}
                          </time>
                          <span>{entry.actor?.pseudo || entry.actorId}</span>
                          <details>
                            <summary>{t.metadata}</summary>
                            <pre>{JSON.stringify(entry.metadata, null, 2)}</pre>
                          </details>
                        </div>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="skuup-admin-inline-empty">{t.noEvents}</p>
                )}
              </section>
            )}
          </div>
        </form>
      </div>
    </Shell>
  );
}

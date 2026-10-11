"use client";

import { useEffect, useMemo, useState } from "react";
import { ErreurApi } from "@/lib/api";
import { Shell } from "@/components/admin/AdminSectionPage";
import { listerAuditContenu, type AuditContenuAdmin } from "@/lib/admin";
import { useLanguage } from "@/components/i18n/LanguageProvider";

const PAGE_SIZE = 8;
function formatDate(value: string, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
function title(value: string, locale: string) {
  return value
    .replaceAll("_", " ")
    .toLocaleLowerCase(locale)
    .replace(/^./, (part) => part.toUpperCase());
}

export function AuditAdminV3() {
  const { langue } = useLanguage();
  const en = langue === "en";
  const locale = en ? "en-US" : "fr-FR";
  const text = {
    heading: en ? "Audit log" : "Journal d’audit",
    kicker: en ? "Traceability" : "Traçabilité",
    description: en
      ? "Every sensitive action can be reviewed from its API evidence, without redundant information."
      : "Chaque action sensible est consultable depuis sa preuve API, sans information redondante.",
    available: en ? "events available" : "événements disponibles",
    indicators: en ? "Audit indicators" : "Indicateurs du journal",
    events: en ? "Events" : "Événements",
    returned: en ? "returned by the API" : "renvoyés par l’API",
    actions: "Actions",
    observed: en ? "observed types" : "types observés",
    entities: en ? "Entities" : "Entités",
    actors: en ? "Actors" : "Acteurs",
    distinct: en ? "distinct identifiers" : "identifiants distincts",
    filters: en ? "Audit filters" : "Filtres du journal",
    action: "Action",
    entity: en ? "Entity" : "Entité",
    actor: en ? "Actor" : "Acteur",
    allActions: en ? "All actions" : "Toutes les actions",
    allEntities: en ? "All entities" : "Toutes les entités",
    actorPlaceholder: en ? "API identifier" : "Identifiant API",
    reset: en ? "Reset" : "Réinitialiser",
    result: en ? "result" : "résultat",
    recent: en ? "Recent activity" : "Activité récente",
    verifiable: en ? "Verifiable events" : "Événements vérifiables",
    page: "Page",
    previous: en ? "Previous" : "Précédent",
    next: en ? "Next" : "Suivant",
    pagination: en ? "Audit log pagination" : "Pagination du journal",
    empty: en
      ? "No event matches the filters."
      : "Aucun événement ne correspond aux filtres.",
    selected: en ? "Selected evidence" : "Preuve sélectionnée",
    verified: en ? "VERIFIED" : "VÉRIFIÉ",
    date: "Date",
    identifier: en ? "Identifier" : "Identifiant",
    timeline: en ? "Event timeline" : "Chronologie de l’événement",
    metadata: en ? "Contract metadata" : "Métadonnées contractuelles",
    noSelected: en ? "No event selected" : "Aucun événement sélectionné",
    noAvailable: en
      ? "The log will return actions as soon as they are available."
      : "Le journal renverra les actions dès qu’elles seront disponibles.",
    loadError: en
      ? "Unable to load the audit log."
      : "Impossible de charger le journal.",
    forbidden: en
      ? "This action is restricted to authorised administrators."
      : "Cette action est réservée aux administrateurs autorisés.",
  };
  const [items, setItems] = useState<AuditContenuAdmin[]>([]);
  const [action, setAction] = useState("");
  const [entityType, setEntityType] = useState("");
  const [actor, setActor] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    void listerAuditContenu({})
      .then((loaded) => {
        setItems(loaded);
        setSelectedId(loaded[0]?.id ?? null);
      })
      .catch((exception: unknown) =>
        setError(
          exception instanceof ErreurApi && exception.statut === 403
            ? text.forbidden
            : text.loadError,
        ),
      );
  }, [text.forbidden, text.loadError]);
  const visible = useMemo(
    () =>
      items.filter(
        (item) =>
          (!action ||
            item.action
              .toLocaleLowerCase(locale)
              .includes(action.toLocaleLowerCase(locale))) &&
          (!entityType ||
            item.entityType
              .toLocaleLowerCase(locale)
              .includes(entityType.toLocaleLowerCase(locale))) &&
          (!actor ||
            item.actorId
              .toLocaleLowerCase(locale)
              .includes(actor.toLocaleLowerCase(locale))),
      ),
    [action, actor, entityType, items, locale],
  );
  const pageCount = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageItems = visible.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );
  const selected =
    visible.find((item) => item.id === selectedId) ?? pageItems[0] ?? null;
  const actors = Array.from(new Set(items.map((item) => item.actorId))).filter(
    Boolean,
  );
  const entities = Array.from(
    new Set(items.map((item) => item.entityType)),
  ).filter(Boolean);
  const actions = Array.from(new Set(items.map((item) => item.action))).filter(
    Boolean,
  );
  function resetFilters() {
    setAction("");
    setEntityType("");
    setActor("");
    setPage(1);
  }
  function changeFilter(setter: (value: string) => void, value: string) {
    setter(value);
    setPage(1);
  }
  return (
    <Shell section="audit">
      <div className="skuup-audit-v3">
        <section className="skuup-audit-heading">
          <div>
            <p className="skuup-kicker">{text.kicker}</p>
            <h2>{text.heading}</h2>
            <p>{text.description}</p>
          </div>
          <span className="skuup-admin-contract-note">
            {items.length} {text.available}
          </span>
        </section>
        <section className="skuup-audit-stats" aria-label={text.indicators}>
          <div>
            <span>{text.events}</span>
            <strong>{items.length}</strong>
            <small>{text.returned}</small>
          </div>
          <div>
            <span>{text.actions}</span>
            <strong>{actions.length}</strong>
            <small>{text.observed}</small>
          </div>
          <div>
            <span>{text.entities}</span>
            <strong>{entities.length}</strong>
            <small>{text.observed}</small>
          </div>
          <div>
            <span>{text.actors}</span>
            <strong>{actors.length}</strong>
            <small>{text.distinct}</small>
          </div>
        </section>
        <section className="skuup-audit-filters" aria-label={text.filters}>
          <label>
            {text.action}
            <select
              className="skuup-admin-input"
              value={action}
              onChange={(event) => changeFilter(setAction, event.target.value)}
            >
              <option value="">{text.allActions}</option>
              {actions.map((value) => (
                <option key={value} value={value}>
                  {title(value, locale)}
                </option>
              ))}
            </select>
          </label>
          <label>
            {text.entity}
            <select
              className="skuup-admin-input"
              value={entityType}
              onChange={(event) =>
                changeFilter(setEntityType, event.target.value)
              }
            >
              <option value="">{text.allEntities}</option>
              {entities.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>
          <label>
            {text.actor}
            <input
              className="skuup-admin-input"
              value={actor}
              onChange={(event) => changeFilter(setActor, event.target.value)}
              placeholder={text.actorPlaceholder}
            />
          </label>
          <button
            type="button"
            className="skuup-button skuup-button-outline"
            onClick={resetFilters}
          >
            {text.reset}
          </button>
          <span>
            {visible.length} {text.result}
            {visible.length > 1 ? "s" : ""}
          </span>
        </section>
        {error && (
          <p role="alert" className="skuup-admin-alert skuup-admin-alert-error">
            {error}
          </p>
        )}
        <div className="skuup-admin-master-detail skuup-audit-grid">
          <section className="skuup-premium-panel skuup-admin-collection">
            <div className="skuup-admin-panel-heading">
              <div>
                <p className="skuup-kicker">{text.recent}</p>
                <h3>{text.verifiable}</h3>
              </div>
              <span className="skuup-admin-count">
                {text.page} {currentPage} / {pageCount}
              </span>
            </div>
            <div className="skuup-admin-record-list skuup-audit-record-list">
              {pageItems.map((item) => (
                <button
                  type="button"
                  key={item.id}
                  aria-pressed={selected?.id === item.id}
                  onClick={() => setSelectedId(item.id)}
                  className={`skuup-admin-record ${selected?.id === item.id ? "is-selected" : ""}`}
                >
                  <span
                    className="skuup-audit-record-marker"
                    aria-hidden="true"
                  />
                  <span className="skuup-admin-record-main">
                    <strong>{title(item.action, locale)}</strong>
                    <span>
                      {item.entityType} · {item.entityId}
                    </span>
                    <small>{item.actorId}</small>
                  </span>
                  <span className="skuup-admin-record-meta">
                    <time dateTime={item.createdAt}>
                      {formatDate(item.createdAt, locale)}
                    </time>
                  </span>
                </button>
              ))}
              {!pageItems.length && (
                <p className="skuup-admin-inline-empty">{text.empty}</p>
              )}
            </div>
            <nav
              className="skuup-audit-pagination"
              aria-label={text.pagination}
            >
              <button
                type="button"
                className="skuup-button skuup-button-outline"
                disabled={currentPage <= 1}
                onClick={() => setPage((value) => Math.max(1, value - 1))}
              >
                {text.previous}
              </button>
              <span>
                {visible.length
                  ? `${(currentPage - 1) * PAGE_SIZE + 1}–${Math.min(currentPage * PAGE_SIZE, visible.length)} ${en ? "of" : "sur"} ${visible.length}`
                  : `0 ${text.result}`}
              </span>
              <button
                type="button"
                className="skuup-button skuup-button-outline"
                disabled={currentPage >= pageCount}
                onClick={() =>
                  setPage((value) => Math.min(pageCount, value + 1))
                }
              >
                {text.next}
              </button>
            </nav>
          </section>
          <section
            className="skuup-premium-panel skuup-audit-detail"
            aria-label={
              en ? "Audit event detail" : "Détail de l’événement d’audit"
            }
          >
            {selected ? (
              <>
                <p className="skuup-kicker">{text.selected}</p>
                <div className="skuup-audit-detail-title">
                  <div>
                    <h3>{title(selected.action, locale)}</h3>
                    <p>
                      {selected.entityType} · {selected.entityId}
                    </p>
                  </div>
                  <span className="skuup-status-badge">{text.verified}</span>
                </div>
                <dl className="skuup-admin-facts">
                  <div>
                    <dt>{text.actor}</dt>
                    <dd>{selected.actorId}</dd>
                  </div>
                  <div>
                    <dt>{text.date}</dt>
                    <dd>{formatDate(selected.createdAt, locale)}</dd>
                  </div>
                  <div>
                    <dt>{text.identifier}</dt>
                    <dd>{selected.id}</dd>
                  </div>
                </dl>
                <div className="skuup-audit-timeline">
                  <h4>{text.timeline}</h4>
                  <ol>
                    <li>
                      <span className="skuup-timeline-dot" aria-hidden="true" />
                      <div>
                        <strong>{title(selected.action, locale)}</strong>
                        <time dateTime={selected.createdAt}>
                          {formatDate(selected.createdAt, locale)}
                        </time>
                        <span>
                          {selected.actorId} · {selected.entityType}
                        </span>
                      </div>
                    </li>
                  </ol>
                </div>
                <div className="skuup-audit-metadata">
                  <h4>{text.metadata}</h4>
                  <pre>{JSON.stringify(selected.metadata, null, 2)}</pre>
                </div>
              </>
            ) : (
              <div className="skuup-admin-empty">
                <h3>{text.noSelected}</h3>
                <p>{text.noAvailable}</p>
              </div>
            )}
          </section>
        </div>
      </div>
    </Shell>
  );
}

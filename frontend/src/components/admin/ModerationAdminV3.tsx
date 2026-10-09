"use client";

import { useEffect, useMemo, useState } from "react";
import {
  detailSignalement,
  listerSignalements,
  modifierSignalement,
  type DetailSignalementAdmin,
  type SignalementAdmin,
} from "@/lib/admin";
import { Shell } from "@/components/admin/AdminSectionPage";

const PAGE_SIZE = 10;
type StatusTab = "ALL" | SignalementAdmin["statut"];

function priority(type: string) {
  const value = type.toLocaleLowerCase();
  return value.includes("fraude") || value.includes("arnaque")
    ? "Critique"
    : value.includes("abus") || value.includes("inappropr")
      ? "Haute"
      : "Moyenne";
}

function statusLabel(status: SignalementAdmin["statut"]) {
  return status === "OUVERTE"
    ? "En attente"
    : status === "EXAMINEE"
      ? "En cours"
      : "Classé";
}

export function ModerationAdminV3() {
  const [items, setItems] = useState<SignalementAdmin[]>([]);
  const [selected, setSelected] = useState<DetailSignalementAdmin | null>(null);
  const [tab, setTab] = useState<StatusTab>("ALL");
  const [query, setQuery] = useState("");
  const [type, setType] = useState("ALL");
  const [page, setPage] = useState(1);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messageErreur = (_exception: unknown, fallback: string) => fallback;

  useEffect(() => {
    void listerSignalements()
      .then(setItems)
      .catch((exception) =>
        setError(
          messageErreur(exception, "Impossible de charger les signalements."),
        ),
      );
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
  async function select(item: SignalementAdmin) {
    setLoading(true);
    setError(null);
    try {
      setSelected(await detailSignalement(item.id));
    } catch (exception) {
      setError(
        messageErreur(
          exception,
          "Impossible de charger le détail du signalement.",
        ),
      );
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
      setError(
        messageErreur(exception, "Traitement du signalement impossible."),
      );
    }
  }

  return (
    <Shell section="moderation">
      <div className="skuup-moderation-admin-v3">
        <header className="skuup-moderation-heading">
          <div>
            <p className="skuup-kicker">Sécurité et confiance</p>
            <h2>Signalements</h2>
            <p>
              Modérez les contenus avec les données et preuves réellement
              retournées par la plateforme.
            </p>
          </div>
          <span className="skuup-admin-contract-note">
            Données anonymisées par l’API
          </span>
        </header>
        <div
          className="skuup-moderation-tabs"
          role="tablist"
          aria-label="Espaces de modération"
        >
          <button
            className="is-active"
            role="tab"
            aria-selected="true"
            type="button"
          >
            Signalements <b>{counts.all}</b>
          </button>
          <span>
            Utilisateurs suivis{" "}
            <b>
              {items.length
                ? new Set(items.map((item) => item.user.id)).size
                : 0}
            </b>
          </span>
        </div>
        <div
          className="skuup-moderation-kpis"
          aria-label="Indicateurs de modération"
        >
          <article>
            <span>Signalements en attente</span>
            <strong>{counts.open}</strong>
            <small>À traiter</small>
          </article>
          <article>
            <span>En cours d’examen</span>
            <strong>{counts.examined}</strong>
            <small>Examinés</small>
          </article>
          <article>
            <span>Classés</span>
            <strong>{counts.ignored}</strong>
            <small>Sans suite</small>
          </article>
          <article>
            <span>Utilisateurs concernés</span>
            <strong>{new Set(items.map((item) => item.user.id)).size}</strong>
            <small>Dossiers connus</small>
          </article>
        </div>
        <section className="skuup-moderation-workspace">
          <div className="skuup-premium-panel skuup-moderation-list">
            <div className="skuup-moderation-filters">
              <label>
                Rechercher
                <input
                  className="skuup-admin-input"
                  aria-label="Rechercher un signalement"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Signalement, pseudo ou identifiant"
                />
              </label>
              <label>
                Statut
                <select
                  className="skuup-admin-input"
                  aria-label="Filtrer par statut"
                  value={tab}
                  onChange={(event) => setTab(event.target.value as StatusTab)}
                >
                  <option value="ALL">Tous</option>
                  <option value="OUVERTE">En attente</option>
                  <option value="EXAMINEE">En cours</option>
                  <option value="IGNOREE">Classés</option>
                </select>
              </label>
              <label>
                Motif
                <select
                  className="skuup-admin-input"
                  aria-label="Filtrer par motif"
                  value={type}
                  onChange={(event) => setType(event.target.value)}
                >
                  <option value="ALL">Tous</option>
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
                {filtered.length} signalement{filtered.length > 1 ? "s" : ""}
              </span>
              <span>
                Page {page} / {pages}
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
                    {priority(item.type)}
                  </span>
                  <span className="skuup-status-badge">
                    {statusLabel(item.statut)}
                  </span>
                  <time>
                    {new Date(item.createdAt).toLocaleDateString("fr-FR")}
                  </time>
                  <span className="skuup-moderation-view">Voir</span>
                </button>
              ))}
              {!visible.length && (
                <p className="skuup-admin-inline-empty">
                  Aucun signalement renvoyé par le contrat.
                </p>
              )}
            </div>
            <div className="skuup-moderation-pagination">
              <span>
                {filtered.length
                  ? `${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, filtered.length)} sur ${filtered.length}`
                  : "Aucun résultat"}
              </span>
              <div>
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((value) => value - 1)}
                >
                  ‹
                </button>
                <button
                  type="button"
                  disabled={page >= pages}
                  onClick={() => setPage((value) => value + 1)}
                >
                  ›
                </button>
              </div>
            </div>
          </div>
          <aside
            className="skuup-premium-panel skuup-moderation-detail"
            aria-label="Détail du signalement"
          >
            {loading ? (
              <p role="status">Chargement du détail et des preuves…</p>
            ) : selected ? (
              <>
                <div className="skuup-detail-topline">
                  <span>#{selected.id.slice(-6).toUpperCase()}</span>
                  <span className="skuup-status-badge">
                    {statusLabel(selected.statut)}
                  </span>
                </div>
              <h3>Détails du signalement</h3>
              <p className="skuup-kicker">Données utilisateur disponibles</p>
                <dl className="skuup-moderation-summary">
                  <div>
                    <dt>Utilisateur</dt>
                    <dd>{selected.user.pseudo}</dd>
                  </div>
                  <div>
                    <dt>E-mail</dt>
                    <dd>{selected.user.email}</dd>
                  </div>
                  <div>
                    <dt>Motif</dt>
                    <dd>{selected.type}</dd>
                  </div>
                  <div>
                    <dt>Priorité</dt>
                    <dd>
                      <span
                        className={`skuup-priority skuup-priority-${priority(selected.type).toLocaleLowerCase()}`}
                      >
                        {priority(selected.type)}
                      </span>
                    </dd>
                  </div>
                  <div>
                    <dt>Reçu le</dt>
                    <dd>
                      {new Date(selected.createdAt).toLocaleString("fr-FR")}
                    </dd>
                  </div>
                </dl>
                <section className="skuup-moderation-evidence">
                  <h4>Preuves disponibles</h4>
                  <p>
                    {selected.details || "Aucun détail fourni dans le contrat."}
                  </p>
                  {selected.watchSession && (
                    <dl>
                      <div>
                        <dt>Session</dt>
                        <dd>{selected.watchSession.id}</dd>
                      </div>
                      <div>
                        <dt>Plateforme</dt>
                        <dd>{selected.watchSession.platform}</dd>
                      </div>
                      <div>
                        <dt>Flux</dt>
                        <dd>{selected.watchSession.streamExternalId}</dd>
                      </div>
                    </dl>
                  )}
                </section>
                <section>
                  <h4>Chronologie du signalement</h4>
                  {selected.audit.length ? (
                    <ol className="skuup-moderation-timeline">
                      {selected.audit.map((event) => (
                        <li key={event.id}>
                          <time>
                            {new Date(event.createdAt).toLocaleString("fr-FR")}
                          </time>
                          <strong>{event.action}</strong>
                          <span>{event.actor.pseudo}</span>
                        </li>
                      ))}
                    </ol>
                  ) : (
                    <p className="skuup-admin-inline-empty">
                      Aucun traitement enregistré.
                    </p>
                  )}
                </section>
                {selected.statut === "OUVERTE" && (
                  <div className="skuup-moderation-actions">
                    <label>
                      Note de modération
                      <textarea
                        className="skuup-admin-input"
                        maxLength={500}
                        value={note}
                        onChange={(event) => setNote(event.target.value)}
                        placeholder="Note visible uniquement par l’équipe de modération"
                      />
                      <small>{note.length}/500</small>
                    </label>
                    <div>
                      <button
                        className="skuup-button skuup-button-primary"
                        type="button"
                        onClick={() => void update("EXAMINEE")}
                      >
                        Marquer examinée
                      </button>
                      <button
                        className="skuup-button skuup-button-outline"
                        type="button"
                        onClick={() => void update("IGNOREE")}
                      >
                        Classer
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="skuup-user-detail-empty">
                <p className="skuup-kicker">Détail du dossier</p>
                <h3>Sélectionnez un signalement</h3>
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

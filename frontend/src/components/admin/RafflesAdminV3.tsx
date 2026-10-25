"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import {
  executerTirage,
  historiqueTirage,
  listerTiragesAdmin,
  type TirageAdmin,
} from "@/lib/admin";
import { ErreurApi } from "@/lib/api";
import { Shell } from "@/components/admin/AdminSectionPage";
import { SkkupIcon } from "@/components/ui/SkkupIcon";
import { useLanguage } from "@/components/i18n/LanguageProvider";

const formatDate = (value: string, langue: "fr" | "en") =>
  new Date(value).toLocaleString(langue === "en" ? "en-US" : "fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  });
const statusLabel = (status: string, langue: "fr" | "en") =>
  (
    ({
      OUVERT: langue === "en" ? "Open" : "Ouvert",
      CLOTURE: langue === "en" ? "Closed" : "Clôturé",
      TIRE: langue === "en" ? "Result published" : "Résultat publié",
    }) as Record<string, string>
  )[status] ?? status;

const copy = {
  fr: {
    control: "Centre de pilotage", loading: "Chargement des tirages", loadingDescription: "Les données opérationnelles sont récupérées depuis l’API.", empty: "Aucun tirage à piloter", emptyDescription: "L’API n’a renvoyé aucun tirage. Aucun lot, compteur ou statut n’est simulé.", operations: "Opérations", title: "Tirages à piloter", search: "Rechercher", searchLabel: "Rechercher un tirage", searchPlaceholder: "Titre ou description", noMatch: "Aucun tirage ne correspond à la recherche.", manageKicker: "Tirages · Gérer un tirage", opened: "Ouvert le", seeAnnouncement: "Voir l’annonce", moreActions: "Plus d’actions", mainPrize: "Lot principal", noImage: "Image du lot non fournie", noPrize: "Lot non renseigné", lots: "lot", lotsPlural: "lots", noDescription: "Aucune description fournie par l’API.", estimatedValue: "Valeur estimée", quantity: "Quantité", supplier: "Fournisseur", participationPeriod: "Période de participation", drawDates: "Dates du tirage", start: "Début", draw: "Tirage", entries: "Participations", validatedEntries: "participations validées", associatedLots: "lots associés", publishedWinners: "gagnants publiés", eligibility: "Éligibilité", configuredRules: "Règles configurées", apiData: "Données API", datesConfigured: "Dates configurées", linkedPrizes: "Lots associés", openContract: "Contrat ouvert", noLinkedPrizes: "Aucun lot associé au contrat.", progress: "Avancement du tirage", preparation: "Préparation", checks: "Vérifications", prerequisite: "préalables", prepare: "Préparer", drawResults: "Tirage et résultats", stepVerify: "Étape 1 · Vérifier le tirage", stepDescription: "Contrôlez les conditions avant toute exécution.", operatorSeed: "Graine exploitant", publicEntropy: "Entropie publique", execute: "Exécuter le tirage", notExecutable: "Tirage non exécutable", validationPoints: "Points de validation à corriger", traceability: "Traçabilité", drawLog: "Journal du tirage", historyLoading: "Chargement de l’historique…", verifiableExecution: "Exécution vérifiable", noHistory: "Aucune exécution enregistrée dans l’historique API.", requiredInputs: "La graine exploitant et l’entropie publique sont obligatoires.", confirm: (name: string) => `Exécuter le tirage « ${name} » ?`, success: (hash?: string) => `Tirage exécuté${hash ? ` · hash ${hash}` : ""}.`, loadError: "Impossible de charger les tirages.", executeError: "Exécution du tirage impossible.", permissions: "L’exécution est réservée aux tirages ouverts et aux comptes autorisés.", locale: "fr-FR",
  },
  en: {
    control: "Control centre", loading: "Loading draws", loadingDescription: "Operational data is retrieved from the API.", empty: "No draw to manage", emptyDescription: "The API returned no draw. No prize, counter or status is simulated.", operations: "Operations", title: "Draws to manage", search: "Search", searchLabel: "Search draws", searchPlaceholder: "Title or description", noMatch: "No draw matches the search.", manageKicker: "Draws · Manage a draw", opened: "Opened on", seeAnnouncement: "View announcement", moreActions: "More actions", mainPrize: "Main prize", noImage: "Prize image not provided", noPrize: "Prize not provided", lots: "prize", lotsPlural: "prizes", noDescription: "No description provided by the API.", estimatedValue: "Estimated value", quantity: "Quantity", supplier: "Supplier", participationPeriod: "Entry period", drawDates: "Draw dates", start: "Start", draw: "Draw", entries: "Entries", validatedEntries: "validated entries", associatedLots: "associated prizes", publishedWinners: "published winners", eligibility: "Eligibility", configuredRules: "Configured rules", apiData: "API data", datesConfigured: "Dates configured", linkedPrizes: "Linked prizes", openContract: "Open contract", noLinkedPrizes: "No prize is linked in the contract.", progress: "Draw progress", preparation: "Preparation", checks: "Checks", prerequisite: "prerequisites", prepare: "Prepare", drawResults: "Draw and results", stepVerify: "Step 1 · Verify the draw", stepDescription: "Check the conditions before executing anything.", operatorSeed: "Operator seed", publicEntropy: "Public entropy", execute: "Run draw", notExecutable: "Draw unavailable", validationPoints: "Validation points to fix", traceability: "Traceability", drawLog: "Draw log", historyLoading: "Loading history…", verifiableExecution: "Verifiable execution", noHistory: "No execution is recorded in the API history.", requiredInputs: "Operator seed and public entropy are required.", confirm: (name: string) => `Run the draw “${name}”?`, success: (hash?: string) => `Draw executed${hash ? ` · hash ${hash}` : ""}.`, loadError: "Unable to load draws.", executeError: "Unable to execute the draw.", permissions: "Execution is limited to open draws and authorised accounts.", locale: "en-US",
  },
} as const;

export function RafflesAdminV3() {
  const { langue } = useLanguage();
  const t = copy[langue];
  const [items, setItems] = useState<TirageAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [history, setHistory] = useState<
    Awaited<ReturnType<typeof historiqueTirage>>
  >([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [seed, setSeed] = useState("");
  const [entropy, setEntropy] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const selected =
    items.find((item) => item.id === selectedId) ?? items[0] ?? null;
  const visible = useMemo(
    () =>
      items.filter((item) =>
        `${item.titre} ${item.description}`
          .toLocaleLowerCase()
          .includes(query.toLocaleLowerCase()),
      ),
    [items, query],
  );
  const checks = selected
    ? [
        {
          label: t.datesConfigured,
          ready: Boolean(selected.dateOuverture && selected.dateTirage),
        },
        { label: t.linkedPrizes, ready: selected.lots.length > 0 },
        { label: t.openContract, ready: selected.statut === "OUVERT" },
      ]
    : [];
  const completion = checks.length
    ? Math.round(
        (checks.filter((check) => check.ready).length / checks.length) * 100,
      )
    : 0;

  useEffect(() => {
    void listerTiragesAdmin()
      .then((loaded) => {
        setItems(loaded);
        setSelectedId(loaded[0]?.id ?? null);
      })
      .catch(() => setError(t.loadError))
      .finally(() => setLoading(false));
  }, [t.loadError]);
  useEffect(() => {
    if (selected) {
      queueMicrotask(() => setHistoryLoading(true));
      void historiqueTirage(selected.id)
        .then(setHistory)
        .catch(() => setHistory([]))
        .finally(() => setHistoryLoading(false));
    }
  }, [selected]);

  async function draw() {
    if (!selected || !seed.trim() || !entropy.trim())
      return setError(t.requiredInputs);
    if (!window.confirm(t.confirm(selected.titre))) return;
    try {
      const result = await executerTirage(selected.id, seed, entropy);
      setItems((all) =>
        all.map((item) =>
          item.id === selected.id ? { ...item, statut: "TIRE" } : item,
        ),
      );
      setMessage(
        t.success(result.resultHash),
      );
      setHistory(await historiqueTirage(selected.id));
    } catch (exception: unknown) {
      setError(exception instanceof ErreurApi && exception.statut === 403 ? t.permissions : t.executeError);
    }
  }

  return (
    <Shell section="raffles">
      <div className="skuup-raffle-admin-v3">
        {error && (
          <p role="alert" className="skuup-admin-alert skuup-admin-alert-error">
            {error}
          </p>
        )}
        {message && (
          <p
            role="status"
            className="skuup-admin-alert skuup-admin-alert-success"
          >
            {message}
          </p>
        )}
        {loading ? (
          <section
            className="skuup-premium-panel skuup-admin-empty"
            aria-busy="true"
            aria-label={t.loading}
            role="status"
          >
            <p className="skuup-kicker">{t.control}</p>
            <h2>{t.loading}</h2>
            <p>{t.loadingDescription}</p>
          </section>
        ) : !items.length ? (
          <section className="skuup-premium-panel skuup-admin-empty">
            <p className="skuup-kicker">{t.control}</p>
            <h2>{t.empty}</h2>
            <p>{t.emptyDescription}</p>
          </section>
        ) : (
          <div className="skuup-raffle-admin-grid skuup-raffle-admin-grid-wide">
            <section className="skuup-premium-panel skuup-raffle-admin-list">
              <div className="skuup-admin-panel-heading">
                <div>
                  <p className="skuup-kicker">{t.operations}</p>
                  <h2>{t.title}</h2>
                </div>
                <span className="skuup-admin-count">
                  {visible.length} / {items.length}
                </span>
              </div>
              <label className="skuup-admin-search">
                {t.search}
                <input
                  aria-label={t.searchLabel}
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={t.searchPlaceholder}
                />
              </label>
              <div className="skuup-admin-record-list">
                {visible.map((item) => (
                  <button
                    className={`skuup-admin-record ${selected?.id === item.id ? "is-selected" : ""}`}
                    aria-pressed={selected?.id === item.id}
                    key={item.id}
                    onClick={() => setSelectedId(item.id)}
                  >
                    <span className="skuup-admin-record-main">
                      <strong>{item.titre}</strong>
                      <span>
                        {item.description || t.noDescription}
                      </span>
                    </span>
                    <span className="skuup-status-badge">
                      {statusLabel(item.statut, langue)}
                    </span>
                    <span className="skuup-admin-record-meta">
                      {item._count.tickets} {t.entries.toLocaleLowerCase()}
                      <br />
                      {formatDate(item.dateTirage, langue)}
                    </span>
                  </button>
                ))}
                {!visible.length && (
                  <p className="skuup-admin-inline-empty">
                    {t.noMatch}
                  </p>
                )}
              </div>
            </section>
            {selected && (
              <div className="skuup-raffle-admin-main">
                <header className="skuup-raffle-detail-heading">
                  <div>
                    <p className="skuup-kicker">{t.manageKicker}</p>
                    <div className="skuup-raffle-detail-title">
                      <h2>{selected.titre}</h2>
                      <span className="skuup-status-badge">
                        {statusLabel(selected.statut, langue)}
                      </span>
                    </div>
                    <p>
                      {t.draw} #{selected.id} · {t.opened}{" "}
                      {formatDate(selected.dateOuverture, langue)}
                    </p>
                  </div>
                  <div className="skuup-admin-panel-actions">
                    <button
                      className="skuup-button skuup-button-outline"
                      type="button"
                    >
                      <span className="inline-flex items-center gap-2">{t.seeAnnouncement}<SkkupIcon name="arrowUpRight" size={16} /></span>
                    </button>
                    <button
                      className="skuup-button skuup-button-outline"
                      type="button"
                    >
                      <span className="inline-flex items-center gap-2">{t.moreActions}<SkkupIcon name="chevronDown" size={14} /></span>
                    </button>
                  </div>
                </header>
                <div className="skuup-raffle-detail-grid">
                  <div className="skuup-raffle-detail-primary">
                    <section className="skuup-premium-panel skuup-raffle-prize-card">
                      <div className="skuup-raffle-prize-media">
                        {selected.lots[0]?.imageUrl ? (
                          <Image
                            src={selected.lots[0].imageUrl}
                            alt={selected.lots[0].nom}
                            width={640}
                            height={360}
                          />
                        ) : (
                          <span className="skuup-raffle-lot-placeholder" role="img" aria-label={t.noImage}>{t.noImage}</span>
                        )}
                      </div>
                      <div className="skuup-raffle-prize-copy">
                        <div className="skuup-raffle-section-heading">
                          <div>
                            <p className="skuup-kicker">{t.mainPrize}</p>
                            <h2>
                              {selected.lots[0]?.nom ?? t.noPrize}
                            </h2>
                          </div>
                          <span className="skuup-status-badge">
                            {selected.lots.length} {selected.lots.length > 1 ? t.lotsPlural : t.lots}
                          </span>
                        </div>
                        <p>
                          {selected.description ||
                            t.noDescription}
                        </p>
                        <div className="skuup-raffle-fact-row">
                          <span>
                            {t.estimatedValue}
                            <strong>
                              {selected.lots[0]?.valeurEstimee ??
                                (langue === "en" ? "Not provided" : "Non renseignée")}
                            </strong>
                          </span>
                          <span>
                            {t.quantity}
                            <strong>
                              {selected.lots[0]?.quantite ?? (langue === "en" ? "Not provided" : "Non renseignée")}
                            </strong>
                          </span>
                          <span>
                            {t.supplier}
                            <strong>
                              {selected.lots[0]?.fournisseur ?? (langue === "en" ? "Not provided" : "Non renseigné")}
                            </strong>
                          </span>
                        </div>
                      </div>
                    </section>
                    <section className="skuup-premium-panel skuup-raffle-period-card">
                      <div className="skuup-raffle-section-heading">
                        <div>
                          <p className="skuup-kicker">{t.participationPeriod}</p>
                          <h2>{t.drawDates}</h2>
                        </div>
                      </div>
                      <div className="skuup-raffle-fact-row">
                        <span>
                          {t.start}
                          <strong>{formatDate(selected.dateOuverture, langue)}</strong>
                        </span>
                        <span>
                          {t.draw}
                          <strong>{formatDate(selected.dateTirage, langue)}</strong>
                        </span>
                        <span>
                          {t.entries}
                          <strong>
                            {selected._count.tickets.toLocaleString(t.locale)}
                          </strong>
                        </span>
                      </div>
                    </section>
                    <section
                      className="skuup-raffle-kpi-strip"
                      aria-label={t.title}
                    >
                      <div>
                        <span className="skuup-raffle-kpi-icon">
                          <SkkupIcon name="users" size={18} />
                        </span>
                        <strong>
                          {selected._count.tickets.toLocaleString(t.locale)}
                        </strong>
                        <small>{t.validatedEntries}</small>
                      </div>
                      <div>
                        <span className="skuup-raffle-kpi-icon">
                          <SkkupIcon name="gift" size={18} />
                        </span>
                        <strong>{selected.lots.length}</strong>
                        <small>{t.associatedLots}</small>
                      </div>
                      <div>
                        <span className="skuup-raffle-kpi-icon">
                          <SkkupIcon name="trophy" size={18} />
                        </span>
                        <strong>{selected._count.winners}</strong>
                        <small>{t.publishedWinners}</small>
                      </div>
                    </section>
                    <div className="skuup-raffle-admin-bottom">
                      <section className="skuup-premium-panel">
                        <div className="skuup-raffle-section-heading">
                          <div>
                            <p className="skuup-kicker">{t.eligibility}</p>
                            <h2>{t.configuredRules}</h2>
                          </div>
                          <span className="skuup-status-badge">
                            {t.apiData}
                          </span>
                        </div>
                        {checks.map((check) => (
                          <p
                            className={`skuup-raffle-check-row ${check.ready ? "is-ready" : "is-pending"}`}
                            key={check.label}
                          >
                            <span aria-hidden="true"><SkkupIcon name={check.ready ? "check" : "warning"} size={16} /></span>
                            {check.label}
                          </p>
                        ))}
                      </section>
                      <section className="skuup-premium-panel">
                        <div className="skuup-raffle-section-heading">
                          <div>
                            <p className="skuup-kicker">{t.linkedPrizes}</p>
                            <h2>{t.linkedPrizes}</h2>
                          </div>
                        </div>
                        {selected.lots.length ? (
                          <div className="skuup-raffle-admin-lots">
                            {selected.lots.map((lot) => (
                              <article key={lot.id}>
                                {lot.imageUrl ? (
                                  <Image src={lot.imageUrl} alt="" width={48} height={48} />
                                ) : (
                                  <span className="skuup-raffle-lot-placeholder">
                                    <SkkupIcon name="gift" size={17} />
                                  </span>
                                )}
                                <div>
                                  <strong>{lot.nom}</strong>
                                  <span>
                                    ×{lot.quantite} · {lot.valeurEstimee}
                                  </span>
                                  <small>{lot.fournisseur}</small>
                                </div>
                              </article>
                            ))}
                          </div>
                        ) : (
                          <p className="skuup-admin-inline-empty">
                            {t.noLinkedPrizes}
                          </p>
                        )}
                      </section>
                    </div>
                  </div>
                  <aside className="skuup-raffle-detail-aside">
                    <section className="skuup-premium-panel skuup-raffle-progress">
                      <div className="skuup-raffle-section-heading">
                        <div>
                          <p className="skuup-kicker">{t.progress}</p>
                          <h2>{t.preparation}</h2>
                        </div>
                        <strong>{completion}%</strong>
                      </div>
                      <div className="skuup-raffle-steps">
                        <span className="is-current">
                          1
                          <small>
                            {t.checks}
                            <br />
                            {t.prerequisite}
                          </small>
                        </span>
                        <span>
                          2
                          <small>
                            {t.prepare}
                            <br />
                            le tirage
                          </small>
                        </span>
                        <span>
                          3
                          <small>
                            {t.draw}
                            <br />
                            {t.drawResults}
                          </small>
                        </span>
                      </div>
                      <div className="skuup-raffle-progress-bar">
                        <span style={{ width: `${completion}%` }} />
                      </div>
                      <div className="skuup-raffle-action-card">
                        <h3>{t.stepVerify}</h3>
                        <p>{t.stepDescription}</p>
                        <label className="skuup-admin-field">
                          {t.operatorSeed}
                          <input className="skuup-admin-input" aria-label={t.operatorSeed} value={seed} onChange={(event) => setSeed(event.target.value)} />
                        </label>
                        <label className="skuup-admin-field">
                          {t.publicEntropy}
                          <input className="skuup-admin-input" aria-label={t.publicEntropy} value={entropy} onChange={(event) => setEntropy(event.target.value)} />
                        </label>
                        <button
                          className="skuup-button skuup-button-primary"
                          type="button"
                          disabled={selected.statut !== "OUVERT"}
                          onClick={() => void draw()}
                        >
                          {selected.statut === "OUVERT"
                            ? t.execute
                            : t.notExecutable}
                        </button>
                      </div>
                    </section>
                    {!checks.every((check) => check.ready) && (
                      <section className="skuup-raffle-warning">
                        <SkkupIcon name="shield" size={22} />
                        <div>
                          <h3>{t.validationPoints}</h3>
                          {checks
                            .filter((check) => !check.ready)
                            .map((check) => (
                              <p key={check.label}>{check.label}</p>
                            ))}
                        </div>
                      </section>
                    )}
                    <section className="skuup-premium-panel skuup-raffle-timeline">
                      <div className="skuup-raffle-section-heading">
                        <div>
                            <p className="skuup-kicker">{t.traceability}</p>
                            <h2>{t.drawLog}</h2>
                        </div>
                      </div>
                      {historyLoading ? (
                        <p className="skuup-admin-inline-empty" role="status">
                          {t.historyLoading}
                        </p>
                      ) : history.length ? (
                        <ol>
                          {history.map((entry) => (
                            <li key={entry.id}>
                              <span className="skuup-raffle-timeline-dot" />
                              <div>
                                <strong>{formatDate(entry.executedAt, langue)}</strong>
                                <span>{t.verifiableExecution}</span>
                                <small>{entry.resultHash}</small>
                              </div>
                            </li>
                          ))}
                        </ol>
                      ) : (
                        <p className="skuup-admin-inline-empty">
                          {t.noHistory}
                        </p>
                      )}
                    </section>
                  </aside>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Shell>
  );
}

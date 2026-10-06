"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import {
  executerTirage,
  historiqueTirage,
  listerTiragesAdmin,
  type TirageAdmin,
} from "@/lib/admin";
import { Shell } from "@/components/admin/AdminSectionPage";
import { SkkupIcon } from "@/components/ui/SkkupIcon";

const formatDate = (value: string) =>
  new Date(value).toLocaleString("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  });
const statusLabel = (status: string) =>
  (
    ({
      OUVERT: "Ouvert",
      CLOTURE: "Clôturé",
      TIRE: "Résultat publié",
    }) as Record<string, string>
  )[status] ?? status;

export function RafflesAdminV3() {
  const [items, setItems] = useState<TirageAdmin[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [history, setHistory] = useState<
    Awaited<ReturnType<typeof historiqueTirage>>
  >([]);
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
          label: "Dates configurées",
          ready: Boolean(selected.dateOuverture && selected.dateTirage),
        },
        { label: "Lots associés", ready: selected.lots.length > 0 },
        { label: "Contrat ouvert", ready: selected.statut === "OUVERT" },
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
      .catch(() => setError("Impossible de charger les tirages."));
  }, []);
  useEffect(() => {
    if (selected)
      void historiqueTirage(selected.id)
        .then(setHistory)
        .catch(() => setHistory([]));
  }, [selected]);

  async function draw() {
    if (!selected || !seed.trim() || !entropy.trim())
      return setError(
        "La graine exploitant et l’entropie publique sont obligatoires.",
      );
    if (!window.confirm(`Exécuter le tirage « ${selected.titre} » ?`)) return;
    try {
      const result = await executerTirage(selected.id, seed, entropy);
      setItems((all) =>
        all.map((item) =>
          item.id === selected.id ? { ...item, statut: "TIRE" } : item,
        ),
      );
      setMessage(
        `Tirage exécuté${result.resultHash ? ` · hash ${result.resultHash}` : ""}.`,
      );
      setHistory(await historiqueTirage(selected.id));
    } catch {
      setError("Exécution du tirage impossible.");
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
        {!items.length ? (
          <section className="skuup-premium-panel skuup-admin-empty">
            <p className="skuup-kicker">Centre de pilotage</p>
            <h2>Aucun tirage à piloter</h2>
            <p>
              L’API n’a renvoyé aucun tirage. Aucun lot, compteur ou statut
              n’est simulé.
            </p>
          </section>
        ) : (
          <div className="skuup-raffle-admin-grid">
            <section className="skuup-premium-panel skuup-raffle-admin-list">
              <div className="skuup-admin-panel-heading">
                <div>
                  <p className="skuup-kicker">Opérations</p>
                  <h2>Tirages à piloter</h2>
                </div>
                <span className="skuup-admin-count">
                  {visible.length} / {items.length}
                </span>
              </div>
              <label className="skuup-admin-search">
                Rechercher
                <input
                  aria-label="Rechercher un tirage"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Titre ou description"
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
                        {item.description || "Aucune description fournie."}
                      </span>
                    </span>
                    <span className="skuup-status-badge">
                      {statusLabel(item.statut)}
                    </span>
                    <span className="skuup-admin-record-meta">
                      {item._count.tickets} participations
                      <br />
                      {formatDate(item.dateTirage)}
                    </span>
                  </button>
                ))}
                {!visible.length && (
                  <p className="skuup-admin-inline-empty">
                    Aucun tirage ne correspond à la recherche.
                  </p>
                )}
              </div>
            </section>
            {selected && (
              <div className="skuup-raffle-admin-main">
                <header className="skuup-raffle-detail-heading">
                  <div>
                    <p className="skuup-kicker">Tirages · Gérer un tirage</p>
                    <div className="skuup-raffle-detail-title">
                      <h2>{selected.titre}</h2>
                      <span className="skuup-status-badge">
                        {statusLabel(selected.statut)}
                      </span>
                    </div>
                    <p>
                      Tirage #{selected.id} · Ouvert le{" "}
                      {formatDate(selected.dateOuverture)}
                    </p>
                  </div>
                  <div className="skuup-admin-panel-actions">
                    <button
                      className="skuup-button skuup-button-outline"
                      type="button"
                    >
                      Voir l’annonce ↗
                    </button>
                    <button
                      className="skuup-button skuup-button-outline"
                      type="button"
                    >
                      Plus d’actions⌄
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
                          <SkkupIcon name="gift" size={42} aria-hidden="true" />
                        )}
                      </div>
                      <div className="skuup-raffle-prize-copy">
                        <div className="skuup-raffle-section-heading">
                          <div>
                            <p className="skuup-kicker">Lot principal</p>
                            <h2>
                              {selected.lots[0]?.nom ?? "Lot non renseigné"}
                            </h2>
                          </div>
                          <span className="skuup-status-badge">
                            {selected.lots.length} lot
                            {selected.lots.length > 1 ? "s" : ""}
                          </span>
                        </div>
                        <p>
                          {selected.description ||
                            "Aucune description fournie par l’API."}
                        </p>
                        <div className="skuup-raffle-fact-row">
                          <span>
                            Valeur estimée
                            <strong>
                              {selected.lots[0]?.valeurEstimee ??
                                "Non renseignée"}
                            </strong>
                          </span>
                          <span>
                            Quantité
                            <strong>
                              {selected.lots[0]?.quantite ?? "Non renseignée"}
                            </strong>
                          </span>
                          <span>
                            Fournisseur
                            <strong>
                              {selected.lots[0]?.fournisseur ?? "Non renseigné"}
                            </strong>
                          </span>
                        </div>
                      </div>
                    </section>
                    <section className="skuup-premium-panel skuup-raffle-period-card">
                      <div className="skuup-raffle-section-heading">
                        <div>
                          <p className="skuup-kicker">
                            Période de participation
                          </p>
                          <h2>Dates du tirage</h2>
                        </div>
                      </div>
                      <div className="skuup-raffle-fact-row">
                        <span>
                          Début
                          <strong>{formatDate(selected.dateOuverture)}</strong>
                        </span>
                        <span>
                          Tirage
                          <strong>{formatDate(selected.dateTirage)}</strong>
                        </span>
                        <span>
                          Participations
                          <strong>
                            {selected._count.tickets.toLocaleString("fr-FR")}
                          </strong>
                        </span>
                      </div>
                    </section>
                    <section
                      className="skuup-raffle-kpi-strip"
                      aria-label="Indicateurs du tirage"
                    >
                      <div>
                        <span className="skuup-raffle-kpi-icon">
                          <SkkupIcon name="users" size={18} />
                        </span>
                        <strong>
                          {selected._count.tickets.toLocaleString("fr-FR")}
                        </strong>
                        <small>participations validées</small>
                      </div>
                      <div>
                        <span className="skuup-raffle-kpi-icon">
                          <SkkupIcon name="gift" size={18} />
                        </span>
                        <strong>{selected.lots.length}</strong>
                        <small>lots associés</small>
                      </div>
                      <div>
                        <span className="skuup-raffle-kpi-icon">
                          <SkkupIcon name="trophy" size={18} />
                        </span>
                        <strong>{selected._count.winners}</strong>
                        <small>gagnants publiés</small>
                      </div>
                    </section>
                    <div className="skuup-raffle-admin-bottom">
                      <section className="skuup-premium-panel">
                        <div className="skuup-raffle-section-heading">
                          <div>
                            <p className="skuup-kicker">Éligibilité</p>
                            <h2>Règles configurées</h2>
                          </div>
                          <span className="skuup-status-badge">
                            Données API
                          </span>
                        </div>
                        {checks.map((check) => (
                          <p
                            className={`skuup-raffle-check-row ${check.ready ? "is-ready" : "is-pending"}`}
                            key={check.label}
                          >
                            <span aria-hidden="true">
                              {check.ready ? "✓" : "!"}
                            </span>
                            {check.label}
                          </p>
                        ))}
                      </section>
                      <section className="skuup-premium-panel">
                        <div className="skuup-raffle-section-heading">
                          <div>
                            <p className="skuup-kicker">Récompenses</p>
                            <h2>Lots associés</h2>
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
                            Aucun lot associé au contrat.
                          </p>
                        )}
                      </section>
                    </div>
                  </div>
                  <aside className="skuup-raffle-detail-aside">
                    <section className="skuup-premium-panel skuup-raffle-progress">
                      <div className="skuup-raffle-section-heading">
                        <div>
                          <p className="skuup-kicker">Avancement du tirage</p>
                          <h2>Préparation</h2>
                        </div>
                        <strong>{completion}%</strong>
                      </div>
                      <div className="skuup-raffle-steps">
                        <span className="is-current">
                          1
                          <small>
                            Vérifications
                            <br />
                            préalables
                          </small>
                        </span>
                        <span>
                          2
                          <small>
                            Préparer
                            <br />
                            le tirage
                          </small>
                        </span>
                        <span>
                          3
                          <small>
                            Tirage et
                            <br />
                            résultats
                          </small>
                        </span>
                      </div>
                      <div className="skuup-raffle-progress-bar">
                        <span style={{ width: `${completion}%` }} />
                      </div>
                      <div className="skuup-raffle-action-card">
                        <h3>Étape 1 · Vérifier le tirage</h3>
                        <p>Contrôlez les conditions avant toute exécution.</p>
                        <label className="skuup-admin-field">
                          Graine exploitant
                          <input className="skuup-admin-input" aria-label="Graine exploitant" value={seed} onChange={(event) => setSeed(event.target.value)} />
                        </label>
                        <label className="skuup-admin-field">
                          Entropie publique
                          <input className="skuup-admin-input" aria-label="Entropie publique" value={entropy} onChange={(event) => setEntropy(event.target.value)} />
                        </label>
                        <button
                          className="skuup-button skuup-button-primary"
                          type="button"
                          disabled={selected.statut !== "OUVERT"}
                          onClick={() => void draw()}
                        >
                          {selected.statut === "OUVERT"
                            ? "Exécuter le tirage"
                            : "Tirage non exécutable"}
                        </button>
                      </div>
                    </section>
                    {!checks.every((check) => check.ready) && (
                      <section className="skuup-raffle-warning">
                        <SkkupIcon name="shield" size={22} />
                        <div>
                          <h3>Points de validation à corriger</h3>
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
                          <p className="skuup-kicker">Traçabilité</p>
                          <h2>Journal du tirage</h2>
                        </div>
                      </div>
                      {history.length ? (
                        <ol>
                          {history.map((entry) => (
                            <li key={entry.id}>
                              <span className="skuup-raffle-timeline-dot" />
                              <div>
                                <strong>{formatDate(entry.executedAt)}</strong>
                                <span>Exécution vérifiable</span>
                                <small>{entry.resultHash}</small>
                              </div>
                            </li>
                          ))}
                        </ol>
                      ) : (
                        <p className="skuup-admin-inline-empty">
                          Aucune exécution enregistrée dans l’historique API.
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

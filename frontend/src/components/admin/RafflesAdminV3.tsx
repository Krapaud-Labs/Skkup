"use client";

import { useEffect, useMemo, useState } from "react";
import { executerTirage, historiqueTirage, listerTiragesAdmin, type TirageAdmin } from "@/lib/admin";
import { Shell } from "@/components/admin/AdminSectionPage";

function date(value: string) { return new Date(value).toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" }); }

export function RafflesAdminV3() {
  const [items, setItems] = useState<TirageAdmin[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [history, setHistory] = useState<Awaited<ReturnType<typeof historiqueTirage>>>([]);
  const [query, setQuery] = useState("");
  const [seed, setSeed] = useState("");
  const [entropy, setEntropy] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const selected = items.find((item) => item.id === selectedId) ?? items[0] ?? null;
  const visible = useMemo(() => items.filter((item) => `${item.titre} ${item.description}`.toLocaleLowerCase().includes(query.toLocaleLowerCase())), [items, query]);

  useEffect(() => { void listerTiragesAdmin().then((loaded) => { setItems(loaded); setSelectedId(loaded[0]?.id ?? null); }).catch(() => setError("Impossible de charger les tirages.")); }, []);
  useEffect(() => { if (selected) void historiqueTirage(selected.id).then(setHistory).catch(() => setHistory([])); }, [selected]);

  async function draw() {
    if (!selected || !seed.trim() || !entropy.trim()) return setError("La graine exploitant et l’entropie publique sont obligatoires.");
    if (!window.confirm(`Exécuter le tirage « ${selected.titre} » ?`)) return;
    try { const result = await executerTirage(selected.id, seed, entropy); setItems((all) => all.map((item) => item.id === selected.id ? { ...item, statut: "TIRE" } : item)); setMessage(`Tirage exécuté${result.resultHash ? ` · hash ${result.resultHash}` : ""}.`); setHistory(await historiqueTirage(selected.id)); }
    catch { setError("Exécution du tirage impossible."); }
  }

  return <Shell section="raffles"><div className="skuup-raffle-admin-v3">
    {error && <p role="alert" className="skuup-admin-alert skuup-admin-alert-error">{error}</p>}{message && <p role="status" className="skuup-admin-alert skuup-admin-alert-success">{message}</p>}
    {!items.length ? <section className="skuup-premium-panel skuup-admin-empty"><p className="skuup-kicker">Centre de pilotage</p><h2>Aucun tirage à piloter</h2><p>L’API n’a renvoyé aucun tirage. Aucun lot, compteur ou statut n’est simulé.</p></section> : <>
      <div className="skuup-raffle-admin-grid"><section className="skuup-premium-panel skuup-raffle-admin-list"><div className="skuup-admin-panel-heading"><div><p className="skuup-kicker">Opérations</p><h2>Tirages à piloter</h2></div><span className="skuup-admin-count">{visible.length} / {items.length}</span></div><label className="skuup-admin-search">Rechercher<input aria-label="Rechercher un tirage" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Titre ou description" /></label><div className="skuup-admin-record-list">{visible.map((item) => <button className={`skuup-admin-record ${selected?.id === item.id ? "is-selected" : ""}`} aria-pressed={selected?.id === item.id} key={item.id} onClick={() => setSelectedId(item.id)}><span className="skuup-admin-record-main"><strong>{item.titre}</strong><span>{item.description || "Aucune description fournie."}</span></span><span className="skuup-status-badge">{item.statut}</span><span className="skuup-admin-record-meta">{item._count.tickets} participations<br />{date(item.dateTirage)}</span></button>)}{!visible.length && <p className="skuup-admin-inline-empty">Aucun tirage ne correspond à la recherche.</p>}</div></section>
        {selected && <main className="skuup-raffle-admin-main"><section className="skuup-premium-panel skuup-raffle-hero"><div className="skuup-raffle-hero-copy"><p className="skuup-kicker">Pilotage du tirage</p><div className="skuup-raffle-hero-title"><span className="skuup-raffle-hero-mark" aria-hidden="true">✦</span><div><h2>{selected.titre}</h2><p>{selected.description || "Aucune description fournie par le contrat."}</p></div></div><div className="skuup-raffle-hero-meta"><span>Ouverture <strong>{date(selected.dateOuverture)}</strong></span><span>Tirage prévu <strong>{date(selected.dateTirage)}</strong></span></div></div><div className="skuup-raffle-hero-status"><span className="skuup-status-badge">{selected.statut}</span><small>Contrat API administrateur</small></div></section>
          <section className="skuup-raffle-kpi-strip" aria-label="Indicateurs du tirage"><div><span className="skuup-raffle-kpi-icon" aria-hidden="true">♧</span><strong>{selected._count.tickets}</strong><small>participations</small><em>Tickets reçus</em></div><div><span className="skuup-raffle-kpi-icon" aria-hidden="true">✦</span><strong>{selected.lots.length}</strong><small>lots associés</small><em>Récompenses configurées</em></div><div><span className="skuup-raffle-kpi-icon" aria-hidden="true">✓</span><strong>{selected._count.winners}</strong><small>gagnants publiés</small><em>Résultats disponibles</em></div></section>
          <section className="skuup-raffle-progress skuup-premium-panel"><div className="skuup-raffle-section-heading"><div><p className="skuup-kicker">État de préparation</p><h3>Contrôles avant exécution</h3></div><strong>{Math.round(([selected.dateOuverture, selected.dateTirage, selected.lots.length ? "lots" : ""].filter(Boolean).length / 3) * 100)}%</strong></div><div className="skuup-raffle-progress-bar"><span style={{ width: `${([selected.dateOuverture, selected.dateTirage, selected.lots.length ? "lots" : ""].filter(Boolean).length / 3) * 100}%` }} /></div><div className="skuup-raffle-checks"><span className="is-ready">✓ Dates configurées</span><span className={selected.lots.length ? "is-ready" : "is-pending"}>{selected.lots.length ? "✓ Lots associés" : "○ Lot manquant"}</span><span className={selected.statut === "OUVERT" ? "is-ready" : "is-pending"}>{selected.statut === "OUVERT" ? "✓ Contrat ouvert" : "○ Contrat fermé"}</span></div></section>
          <div className="skuup-raffle-admin-bottom"><section className="skuup-premium-panel"><p className="skuup-kicker">Récompenses</p><h3>Lots associés <span className="skuup-admin-count">{selected.lots.length}</span></h3>{selected.lots.length ? <div className="skuup-raffle-admin-lots">{selected.lots.map((lot) => <article key={lot.id}><strong>{lot.nom}</strong><span>×{lot.quantite} · {lot.valeurEstimee}</span><small>{lot.fournisseur}</small></article>)}</div> : <p className="skuup-admin-inline-empty">Aucun lot associé au contrat.</p>}</section><section className="skuup-premium-panel"><p className="skuup-kicker">Règles exposées</p><h3>Cadre du tirage</h3><dl className="skuup-admin-facts"><div><dt>Ouverture</dt><dd>{date(selected.dateOuverture)}</dd></div><div><dt>Clôture / tirage</dt><dd>{date(selected.dateTirage)}</dd></div><div><dt>Participations</dt><dd>{selected._count.tickets} tickets · {selected._count.winners} gagnant{selected._count.winners > 1 ? "s" : ""}</dd></div></dl><p className="skuup-admin-contract-note">Aucune règle métier supplémentaire n’est affichée sans donnée fournie par l’API.</p></section></div>
          <div className="skuup-raffle-admin-bottom"><section className="skuup-premium-panel"><p className="skuup-kicker">Traçabilité</p><h3>Contrôle cryptographique</h3><label className="skuup-admin-field">Graine exploitant<input className="skuup-admin-input" aria-label="Graine exploitant" value={seed} onChange={(event) => setSeed(event.target.value)} /></label><label className="skuup-admin-field">Entropie publique<input className="skuup-admin-input" aria-label="Entropie publique" value={entropy} onChange={(event) => setEntropy(event.target.value)} /></label><button className="skuup-button skuup-button-primary mt-4 w-full" disabled={selected.statut !== "OUVERT"} onClick={() => void draw()}>{selected.statut === "OUVERT" ? "Exécuter le tirage" : "Tirage non exécutable"}</button></section><section className="skuup-premium-panel"><p className="skuup-kicker">Journal vérifiable</p><h3>Exécutions précédentes</h3>{history.length ? <ol className="skuup-raffle-history">{history.map((entry) => <li key={entry.id}><strong>{date(entry.executedAt)}</strong><span>{entry.resultHash}</span></li>)}</ol> : <p className="skuup-admin-inline-empty">Aucune exécution enregistrée dans l’historique API.</p>}</section></div>
        </main>}
      </div></>}
  </div></Shell>;
}

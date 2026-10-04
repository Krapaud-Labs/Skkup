"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  detailUtilisateurAdmin,
  historiqueUtilisateurAdmin,
  listerUtilisateursAdmin,
  modifierStatutUtilisateurAdmin,
  type DetailUtilisateurAdmin,
  type EvenementUtilisateurAdmin,
  type UtilisateurAdmin,
} from "@/lib/admin";
import { Shell } from "@/components/admin/AdminSectionPage";

function formatDate(value: string | null) {
  if (!value) return "Non renseignée";
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function maskEmail(value: string) {
  const [local, domain] = value.split("@", 2);
  if (!domain || !local) return "Adresse masquée";
  return `${local.slice(0, 1)}${"•".repeat(Math.max(2, Math.min(5, local.length - 1)))}@${domain}`;
}

export function UsersAdminV3() {
  const [items, setItems] = useState<UtilisateurAdmin[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<DetailUtilisateurAdmin | null>(null);
  const [history, setHistory] = useState<EvenementUtilisateurAdmin[]>([]);
  const [query, setQuery] = useState("");
  const [role, setRole] = useState("TOUS");
  const [status, setStatus] = useState("TOUS");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditError, setAuditError] = useState<string | null>(null);
  const [pending, setPending] = useState<string | null>(null);
  const selectionRequest = useRef(0);

  const select = useCallback(async (item: UtilisateurAdmin) => {
    const requestId = selectionRequest.current + 1;
    selectionRequest.current = requestId;
    setSelectedId(item.id);
    setSelectedDetail(null);
    setHistory([]);
    setDetailError(null);
    setAuditError(null);
    setDetailLoading(true);
    setAuditLoading(true);

    void detailUtilisateurAdmin(item.id)
      .then((detail) => {
        if (selectionRequest.current === requestId) setSelectedDetail(detail);
      })
      .catch(() => {
        if (selectionRequest.current === requestId) setDetailError("Le dossier détaillé de cet utilisateur est indisponible.");
      })
      .finally(() => {
        if (selectionRequest.current === requestId) setDetailLoading(false);
      });

    void historiqueUtilisateurAdmin(item.id)
      .then((audit) => {
        if (selectionRequest.current === requestId) setHistory(audit);
      })
      .catch(() => {
        if (selectionRequest.current === requestId) setAuditError("L’historique administratif de cet utilisateur est indisponible.");
      })
      .finally(() => {
        if (selectionRequest.current === requestId) setAuditLoading(false);
      });
  }, []);

  useEffect(() => {
    let mounted = true;
    void listerUtilisateursAdmin("")
      .then((loaded) => {
        if (!mounted) return;
        setItems(loaded);
        if (loaded[0]) void select(loaded[0]);
      })
      .catch(() => {
        if (mounted) setError("Impossible de charger les utilisateurs.");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [select]);

  const visible = useMemo(
    () => items.filter((item) => `${item.pseudo} ${item.email}`.toLocaleLowerCase().includes(query.toLocaleLowerCase())
      && (role === "TOUS" || item.role === role)
      && (status === "TOUS" || (status === "ACTIF" ? item.actif : !item.actif))),
    [items, query, role, status],
  );
  const active = items.filter((item) => item.actif).length;
  const admins = items.filter((item) => item.role === "ADMIN").length;

  async function toggle(item: UtilisateurAdmin) {
    setPending(item.id);
    setError(null);
    try {
      const result = await modifierStatutUtilisateurAdmin(item.id, !item.actif);
      setItems((all) => all.map((current) => current.id === result.id ? { ...current, actif: result.actif } : current));
      setSelectedDetail((current) => current?.id === result.id ? { ...current, actif: result.actif } : current);
      setAuditError(null);
      setAuditLoading(true);
      const audit = await historiqueUtilisateurAdmin(item.id);
      setHistory(audit);
    } catch {
      setError("Modification du statut impossible.");
    } finally {
      setAuditLoading(false);
      setPending(null);
    }
  }

  return (
    <Shell section="users">
      <div className="skuup-users-admin-v3">
        <section className="skuup-users-heading">
          <div>
            <p className="skuup-kicker">Accès et comptes</p>
            <h2>Utilisateurs et sécurité</h2>
            <p>Surveillez les comptes et appliquez les actions autorisées par le contrat administrateur.</p>
          </div>
          <span className="skuup-admin-contract-note">Données détaillées chargées à la demande</span>
        </section>

        <div className="skuup-users-kpis">
          <article><span>Utilisateurs chargés</span><strong>{items.length}</strong></article>
          <article><span>Comptes actifs</span><strong>{active}</strong><small>{items.length ? Math.round(active / items.length * 100) : 0}% du résultat</small></article>
          <article><span>Administrateurs</span><strong>{admins}</strong></article>
          <article><span>Sessions observées</span><strong>{items.reduce((sum, item) => sum + item._count.watchSessions, 0)}</strong></article>
        </div>

        {error && <p role="alert" className="skuup-admin-alert skuup-admin-alert-error">{error}</p>}

        <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1.25fr)_minmax(20rem,.75fr)]">
          <section className="skuup-premium-panel skuup-users-table-panel" aria-labelledby="users-list-title">
            <div className="skuup-admin-panel-heading">
              <div><p className="skuup-kicker">File des comptes</p><h3 id="users-list-title">Utilisateurs</h3></div>
              {!loading && <span className="skuup-admin-count">{visible.length} / {items.length}</span>}
            </div>
            <div className="skuup-admin-toolbar">
              <label className="skuup-admin-search">Rechercher<input aria-label="Rechercher un utilisateur" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Pseudo ou email" /></label>
              <label className="skuup-admin-filter">Rôle<select aria-label="Filtrer par rôle" value={role} onChange={(event) => setRole(event.target.value)}><option value="TOUS">Tous les rôles</option><option value="ADMIN">Administrateur</option><option value="VIEWER">Membre</option></select></label>
              <label className="skuup-admin-filter">Statut<select aria-label="Filtrer par statut" value={status} onChange={(event) => setStatus(event.target.value)}><option value="TOUS">Tous</option><option value="ACTIF">Actifs</option><option value="INACTIF">Désactivés</option></select></label>
            </div>
            <div className="skuup-users-table-wrap">
              {loading && <p className="skuup-admin-inline-empty" role="status">Chargement des utilisateurs…</p>}
              {!loading && !error && !items.length && <p className="skuup-admin-inline-empty">Aucun utilisateur administrable.</p>}
              {!loading && !!items.length && <table><caption className="sr-only">Liste des utilisateurs administrables</caption><thead><tr><th scope="col">Utilisateur</th><th scope="col">Rôle</th><th scope="col">Activité</th><th scope="col">Points</th><th scope="col">Statut</th><th scope="col">Action</th></tr></thead><tbody>{visible.map((item) => <tr key={item.id} aria-selected={selectedId === item.id}><td><button type="button" className="flex w-full min-w-0 flex-col gap-1 text-left" aria-label={`Ouvrir le dossier de ${item.pseudo}`} onClick={() => void select(item)}><strong>{item.pseudo}</strong><small>{maskEmail(item.email)}</small><small>Inscrit le {new Date(item.createdAt).toLocaleDateString("fr-FR")}</small></button></td><td><span className="skuup-status-badge">{item.role}</span></td><td>{item._count.watchSessions} sessions · {item._count.raffleTickets} participations</td><td>{item.soldePoints}</td><td><span className={item.actif ? "skuup-users-status-active" : "skuup-users-status-off"}>{item.actif ? "ACTIF" : "DÉSACTIVÉ"}</span></td><td><button type="button" className="skuup-button skuup-button-outline" disabled={pending === item.id} onClick={() => void toggle(item)}>{pending === item.id ? "Mise à jour…" : item.actif ? "Désactiver" : "Activer"}</button></td></tr>)}</tbody></table>}
              {!loading && !!items.length && !visible.length && <p className="skuup-admin-inline-empty">Aucun utilisateur ne correspond aux filtres.</p>}
            </div>
          </section>

          <aside className="skuup-premium-panel min-w-0" aria-labelledby="user-detail-title">
            {detailLoading && <p className="skuup-admin-inline-empty" role="status">Chargement du dossier…</p>}
            {!detailLoading && detailError && <p role="alert" className="skuup-admin-alert skuup-admin-alert-error">{detailError}</p>}
            {!detailLoading && !detailError && !selectedDetail && <div className="skuup-admin-empty"><p className="skuup-kicker">Dossier utilisateur</p><h3 id="user-detail-title">Sélectionnez un utilisateur</h3><p>Le détail et l’historique seront chargés depuis les contrats administrateur.</p></div>}
            {!detailLoading && selectedDetail && <div className="grid min-w-0 gap-5">
              <div className="flex min-w-0 items-start justify-between gap-3"><div className="min-w-0"><p className="skuup-kicker">Dossier utilisateur</p><h3 id="user-detail-title" className="break-words text-xl font-semibold">{selectedDetail.pseudo}</h3><p className="break-all text-sm text-foreground-muted">{maskEmail(selectedDetail.email)}</p></div><span className={selectedDetail.actif ? "skuup-users-status-active" : "skuup-users-status-off"}>{selectedDetail.actif ? "ACTIF" : "DÉSACTIVÉ"}</span></div>
              <dl className="grid grid-cols-2 gap-3 text-sm"><div><dt className="text-xs text-foreground-muted">Rôle</dt><dd>{selectedDetail.role}</dd></div><div><dt className="text-xs text-foreground-muted">Inscription</dt><dd>{formatDate(selectedDetail.createdAt)}</dd></div><div><dt className="text-xs text-foreground-muted">Dernière activité</dt><dd>{formatDate(selectedDetail.derniereVisiteAt)}</dd></div><div><dt className="text-xs text-foreground-muted">Points</dt><dd>{selectedDetail.soldePoints}</dd></div><div><dt className="text-xs text-foreground-muted">Streak actuel</dt><dd>{selectedDetail.streakActuel} jours</dd></div><div><dt className="text-xs text-foreground-muted">Meilleur streak</dt><dd>{selectedDetail.streakMax} jours</dd></div><div><dt className="text-xs text-foreground-muted">Sessions</dt><dd>{selectedDetail._count.watchSessions}</dd></div><div><dt className="text-xs text-foreground-muted">Tickets</dt><dd>{selectedDetail._count.raffleTickets}</dd></div><div><dt className="text-xs text-foreground-muted">Transactions points</dt><dd>{selectedDetail._count.pointsTransactions}</dd></div></dl>
              <section className="border-t border-border-subtle pt-4"><div className="skuup-admin-panel-heading"><div><p className="skuup-kicker">Traçabilité</p><h4>Historique administrateur</h4></div>{!auditLoading && <span className="skuup-admin-count">{history.length}</span>}</div>{auditLoading && <p className="skuup-admin-inline-empty" role="status">Chargement de l’historique…</p>}{!auditLoading && auditError && <p role="alert" className="skuup-admin-alert skuup-admin-alert-error">{auditError}</p>}{!auditLoading && !auditError && (history.length ? <ol className="mt-3 grid gap-2">{history.map((event) => <li className="rounded-xl border border-border-subtle p-3 text-sm" key={event.id}><strong>{event.action}</strong><span className="mt-1 block text-xs text-foreground-muted">{formatDate(event.createdAt)} · acteur interne</span></li>)}</ol> : <p className="skuup-admin-inline-empty">Aucun événement administratif pour ce compte.</p>)}</section>
              <button type="button" className="skuup-button skuup-button-outline w-full" disabled={pending === selectedDetail.id} onClick={() => void toggle(selectedDetail)}>{pending === selectedDetail.id ? "Mise à jour…" : selectedDetail.actif ? "Désactiver ce compte" : "Réactiver ce compte"}</button>
            </div>}
          </aside>
        </div>
      </div>
    </Shell>
  );
}

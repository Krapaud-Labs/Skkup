"use client";

import { useEffect, useMemo, useState } from "react";
import { ErreurApi } from "@/lib/api";
import {
  listerUtilisateursAdmin,
  modifierStatutUtilisateurAdmin,
  type UtilisateurAdmin,
} from "@/lib/admin";
import { Shell } from "@/components/admin/AdminSectionPage";
import { useLanguage } from "@/components/i18n/LanguageProvider";

export function UsersAdminV3() {
  const { langue } = useLanguage();
  const en = langue === "en";
  const text = {
    title: en ? "Users and security" : "Utilisateurs et sécurité",
    disable: en ? "Disable" : "Désactiver",
    enable: en ? "Enable" : "Activer",
    empty: en
      ? "No user matches the filters."
      : "Aucun utilisateur ne correspond aux filtres.",
    sessionCount: en ? "sessions" : "sessions",
    participations: en ? "entries" : "participations",
    search: en ? "Search a user" : "Rechercher un utilisateur",
    searchPlaceholder: en ? "Username or email" : "Pseudo ou email",
    role: en ? "Role" : "Rôle",
    status: en ? "Status" : "Statut",
    all: en ? "All" : "Tous",
    allRoles: en ? "All roles" : "Tous les rôles",
    admin: en ? "Administrator" : "Administrateur",
    member: en ? "Member" : "Membre",
    active: en ? "Active" : "Actifs",
    disabled: en ? "Disabled" : "Désactivés",
    user: en ? "User" : "Utilisateur",
    activity: en ? "Activity" : "Activité",
    points: "Points",
    action: "Action",
    view: en ? "View" : "Voir",
    detail: en ? "User detail" : "Détail utilisateur",
    overview: en ? "Overview" : "Vue d’ensemble",
    activityTab: en ? "Activity" : "Activité",
    account: en ? "Account profile" : "Fiche compte",
    select: en ? "Select a user" : "Sélectionnez un utilisateur",
    detailText: en
      ? "The detail only shows information returned by the API."
      : "Le détail affichera uniquement les informations retournées par l’API",
    loadError: en
      ? "Unable to load users."
      : "Impossible de charger les utilisateurs.",
    statusError: en
      ? "Unable to update the status."
      : "Modification du statut impossible.",
    forbidden: en
      ? "This action is restricted to authorised administrators."
      : "Cette action est réservée aux administrateurs autorisés.",
    locale: en ? "en-US" : "fr-FR",
    roleLabel: (role: UtilisateurAdmin["role"]) => en ? ({ USER: "Member", ADMIN: "Administrator", VIEWER: "Viewer" }[role] ?? role) : role,
    registered: en ? "Registered on" : "Inscrit le",
    activeStatus: en ? "ACTIVE" : "ACTIF",
    disabledStatus: en ? "DISABLED" : "DÉSACTIVÉ",
    confirm: (action: string, pseudo: string) =>
      en
        ? `Confirm: ${action} account ${pseudo}?`
        : `Confirmer : ${action} le compte ${pseudo} ?`,
  };
  const [items, setItems] = useState<UtilisateurAdmin[]>([]);
  const [query, setQuery] = useState("");
  const [role, setRole] = useState("TOUS");
  const [status, setStatus] = useState("TOUS");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  useEffect(() => {
    void listerUtilisateursAdmin("")
      .then(setItems)
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
          `${item.pseudo} ${item.email}`
            .toLocaleLowerCase()
            .includes(query.toLocaleLowerCase()) &&
          (role === "TOUS" || item.role === role) &&
          (status === "TOUS" ||
            (status === "ACTIF" ? item.actif : !item.actif)),
      ),
    [items, query, role, status],
  );
  const active = items.filter((item) => item.actif).length;
  const admins = items.filter((item) => item.role === "ADMIN").length;
  const selected = visible.find((item) => item.id === selectedId) ?? null;
  async function toggle(item: UtilisateurAdmin) {
    const action = item.actif
      ? en
        ? "disable"
        : "désactiver"
      : en
        ? "enable"
        : "réactiver";
    if (!window.confirm(text.confirm(action, item.pseudo))) return;
    setPending(item.id);
    setError(null);
    try {
      const result = await modifierStatutUtilisateurAdmin(item.id, !item.actif);
      setItems((all) =>
        all.map((current) =>
          current.id === result.id
            ? { ...current, actif: result.actif }
            : current,
        ),
      );
    } catch (exception: unknown) {
      setError(
        exception instanceof ErreurApi && exception.statut === 403
          ? text.forbidden
          : exception instanceof ErreurApi
            ? exception.message
            : text.statusError,
      );
    } finally {
      setPending(null);
    }
  }
  return (
    <Shell section="users">
      <div className="skuup-users-admin-v3">
        <section className="skuup-users-heading">
          <div>
            <p className="skuup-kicker">
              {en ? "Access and accounts" : "Accès et comptes"}
            </p>
            <h2>{text.title}</h2>
            <p>
              {en
                ? "Monitor accounts and apply actions allowed by the administration contract."
                : "Surveillez les comptes et appliquez les actions autorisées par le contrat administrateur."}
            </p>
          </div>
          <span className="skuup-admin-contract-note">
            {en
              ? "Data anonymised by the API"
              : "Données anonymisées par l’API"}
          </span>
        </section>
        <div className="skuup-users-kpis">
          <article>
            <span>{en ? "Loaded users" : "Utilisateurs chargés"}</span>
            <strong>{items.length}</strong>
          </article>
          <article>
            <span>{en ? "Active accounts" : "Comptes actifs"}</span>
            <strong>{active}</strong>
            <small>
              {items.length ? Math.round((active / items.length) * 100) : 0}% {en ? "of result" : "du résultat"}
            </small>
          </article>
          <article>
            <span>{en ? "Administrators" : "Administrateurs"}</span>
            <strong>{admins}</strong>
          </article>
          <article>
            <span>{en ? "Observed sessions" : "Sessions observées"}</span>
            <strong>
              {items.reduce((sum, item) => sum + item._count.watchSessions, 0)}
            </strong>
          </article>
        </div>
        <div className="skuup-users-master-detail">
          <section className="skuup-premium-panel skuup-users-table-panel">
            <div className="skuup-admin-toolbar">
              <label className="skuup-admin-search">
                {text.search}
                <input
                  aria-label={text.search}
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={text.searchPlaceholder}
                />
              </label>
              <label className="skuup-admin-filter">
                {text.role}
                <select
                  aria-label={text.role}
                  value={role}
                  onChange={(event) => setRole(event.target.value)}
                >
                  <option value="TOUS">{text.allRoles}</option>
                  <option value="ADMIN">{text.admin}</option>
                  <option value="USER">{text.member}</option>
                </select>
              </label>
              <label className="skuup-admin-filter">
                {text.status}
                <select
                  aria-label={text.status}
                  value={status}
                  onChange={(event) => setStatus(event.target.value)}
                >
                  <option value="TOUS">{text.all}</option>
                  <option value="ACTIF">{text.active}</option>
                  <option value="INACTIF">{text.disabled}</option>
                </select>
              </label>
            </div>
            {error && (
              <p
                role="alert"
                className="skuup-admin-alert skuup-admin-alert-error"
              >
                {error}
              </p>
            )}
            <div className="skuup-users-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>{text.user}</th>
                    <th>{text.role}</th>
                    <th>{text.activity}</th>
                    <th>{text.points}</th>
                    <th>{text.status}</th>
                    <th>{text.action}</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((item) => (
                    <tr
                      className={
                        selectedId === item.id ? "is-selected" : undefined
                      }
                      key={item.id}
                    >
                      <td>
                        <button
                          type="button"
                          className="skuup-user-select"
                          onClick={() => setSelectedId(item.id)}
                        >
                          <strong>{item.pseudo}</strong>
                          <small>{item.email}</small>
                          <small>
                            {text.registered}{" "}
                            {new Date(item.createdAt).toLocaleDateString(
                              text.locale,
                            )}
                          </small>
                        </button>
                      </td>
                      <td>
                        <span className="skuup-status-badge">{text.roleLabel(item.role)}</span>
                      </td>
                      <td>
                        {item._count.watchSessions}{" "}
                        {en ? text.sessionCount : text.sessionCount} ·{" "}
                        {item._count.raffleTickets}{" "}
                        {en ? text.participations : text.participations}
                      </td>
                      <td>{item.soldePoints}</td>
                      <td>
                        <span
                          className={
                            item.actif
                              ? "skuup-users-status-active"
                              : "skuup-users-status-off"
                          }
                        >
                          {item.actif ? text.activeStatus : text.disabledStatus}
                        </span>
                      </td>
                      <td>
                        <button
                          className="skuup-button skuup-button-outline"
                          disabled={pending === item.id}
                          onClick={() => void toggle(item)}
                        >
                          {pending === item.id
                            ? en
                              ? "Updating…"
                              : "Mise à jour…"
                            : item.actif
                              ? text.disable
                              : text.enable}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!visible.length && (
                <p className="skuup-admin-inline-empty">{text.empty}</p>
              )}
            </div>
          </section>
          <aside
            className="skuup-premium-panel skuup-user-detail"
            aria-label={text.detail}
          >
            {selected ? (
              <>
                <p className="skuup-kicker">{text.account}</p>
                <h3>{selected.pseudo}</h3>
                <p className="skuup-user-detail-email">{selected.email}</p>
                <div
                  className="skuup-user-tabs"
                  role="tablist"
                  aria-label={text.detail}
                >
                  <button
                    id="user-tab-overview"
                    type="button"
                    role="tab"
                    aria-controls="user-detail-panel"
                    aria-selected="true"
                  >
                    {text.overview}
                  </button>
                </div>
                <dl
                  id="user-detail-panel"
                  role="tabpanel"
                  aria-labelledby="user-tab-overview"
                >
                  <div>
                    <dt>{text.role}</dt>
                    <dd>{text.roleLabel(selected.role)}</dd>
                  </div>
                  <div>
                    <dt>{text.status}</dt>
                    <dd>
                      {selected.actif ? text.activeStatus : text.disabledStatus}
                    </dd>
                  </div>
                  <div>
                    <dt>Points</dt>
                    <dd>{selected.soldePoints}</dd>
                  </div>
                  <div>
                    <dt>{en ? "Watch sessions" : "Sessions de visionnage"}</dt>
                    <dd>{selected._count.watchSessions}</dd>
                  </div>
                  <div>
                    <dt>{en ? "Entries" : "Participations"}</dt>
                    <dd>{selected._count.raffleTickets}</dd>
                  </div>
                  <div>
                    <dt>Inscription</dt>
                    <dd>
                      {text.registered}{" "}
                      {new Date(selected.createdAt).toLocaleDateString(
                        text.locale,
                      )}
                    </dd>
                  </div>
                </dl>
                <button
                  className="skuup-button skuup-button-outline"
                  disabled={pending === selected.id}
                  onClick={() => void toggle(selected)}
                >
                  {selected.actif
                    ? en
                      ? "Disable account"
                      : "Désactiver le compte"
                    : en
                      ? "Enable account"
                      : "Réactiver le compte"}
                </button>
              </>
            ) : (
              <div className="skuup-user-detail-empty">
                <p className="skuup-kicker">{text.account}</p>
                <h3>{text.select}</h3>
                <p>{text.detailText}</p>
              </div>
            )}
          </aside>
        </div>
      </div>
    </Shell>
  );
}

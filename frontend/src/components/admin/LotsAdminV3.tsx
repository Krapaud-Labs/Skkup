"use client";

/* External lot media URLs are supplied by the API contract and must remain unoptimized. */
/* eslint-disable @next/next/no-img-element */

import { useEffect, useState, type FormEvent } from "react";
import {
  creerLotAdmin,
  listerLotsAdmin,
  modifierLotAdmin,
  supprimerLotAdmin,
  type LotAdmin,
} from "@/lib/admin";
import { SkkupIcon } from "@/components/ui/SkkupIcon";

type FormState = {
  raffleId: string;
  nom: string;
  valeurEstimee: string;
  quantite: number;
  fournisseur: string;
  imageUrl: string;
};
const empty: FormState = {
  raffleId: "",
  nom: "",
  valeurEstimee: "",
  quantite: 1,
  fournisseur: "",
  imageUrl: "",
};

export function LotsAdminV3() {
  const [items, setItems] = useState<LotAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<FormState>(empty);
  const [editing, setEditing] = useState<LotAdmin | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [stock, setStock] = useState("TOUS");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  function load(search = "") {
    setError(null);
    setLoading(true);
    void listerLotsAdmin(search)
      .then(setItems)
      .catch(() => setError("Impossible de charger les lots."))
      .finally(() => setLoading(false));
  }
  useEffect(() => {
    void listerLotsAdmin()
      .then(setItems)
      .catch(() => setError("Impossible de charger les lots."))
      .finally(() => setLoading(false));
  }, []);
  function edit(lot: LotAdmin) {
    setEditing(lot);
    setForm({
      raffleId: lot.raffleId,
      nom: lot.nom,
      valeurEstimee: lot.valeurEstimee,
      quantite: lot.quantite,
      fournisseur: lot.fournisseur,
      imageUrl: lot.imageUrl ?? "",
    });
    setIsFormOpen(true);
  }
  function openCreate() {
    setEditing(null);
    setForm(empty);
    setIsFormOpen(true);
  }
  function closeForm() {
    setIsFormOpen(false);
    setEditing(null);
    setForm(empty);
  }
  useEffect(() => {
    if (!isFormOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsFormOpen(false);
        setEditing(null);
        setForm(empty);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isFormOpen]);
  async function submit(event: FormEvent): Promise<boolean> {
    event.preventDefault();
    setError(null);
    try {
      const result = editing
        ? await modifierLotAdmin(editing.id, {
            nom: form.nom,
            valeurEstimee: form.valeurEstimee,
            quantite: form.quantite,
            fournisseur: form.fournisseur,
            ...(form.imageUrl ? { imageUrl: form.imageUrl } : {}),
          })
        : await creerLotAdmin(form);
      setItems((all) =>
        editing
          ? all.map((item) => (item.id === result.id ? result : item))
          : [result, ...all],
      );
      setEditing(null);
      setForm(empty);
      setMessage(
        editing
          ? "Lot mis à jour depuis le contrat administrateur."
          : "Lot créé depuis le contrat administrateur.",
      );
      return true;
    } catch {
      setError(
        editing
          ? "Mise à jour du lot impossible."
          : "Création du lot impossible.",
      );
      return false;
    }
  }
  async function remove(lot: LotAdmin) {
    if (
      !window.confirm(
        `Supprimer le lot « ${lot.nom} » ? Cette action est irréversible.`,
      )
    )
      return;
    try {
      await supprimerLotAdmin(lot.id);
      setItems((all) => all.filter((item) => item.id !== lot.id));
      setMessage("Lot supprimé.");
    } catch {
      setError(
        "Suppression impossible : le lot peut être engagé dans un tirage.",
      );
    }
  }
  const visible = items.filter(
    (lot) =>
      stock === "TOUS" ||
      (stock === "RUPTURE"
        ? lot.quantite === 0
        : stock === "FAIBLE"
          ? lot.quantite > 0 && lot.quantite <= 3
          : lot.quantite > 3),
  );
  const stockLabel = (quantity: number) =>
    quantity === 0 ? "Rupture" : quantity <= 3 ? "Stock faible" : "Disponible";
  return (
    <div className="skuup-lots-page">
      <header className="skuup-lots-page-heading">
        <div className="skuup-lots-page-title">
          <span className="skuup-lots-page-icon" aria-hidden="true">
            <SkkupIcon name="gift" size={34} />
          </span>
          <div>
            <p className="skuup-kicker">Inventaire administrateur</p>
            <h2>Lots</h2>
            <p>Gérez les lots, leur stock et leur disponibilité pour les tirages.</p>
          </div>
        </div>
        <button
          className="skuup-button skuup-button-primary skuup-lots-add-button"
          type="button"
      onClick={openCreate}
        >
          <SkkupIcon name="gift" size={18} />
          Ajouter un lot
        </button>
      </header>
      <div className="skuup-lots-layout">
      <section
        className="skuup-premium-panel skuup-admin-inventory"
        aria-labelledby="lots-inventory-title"
      >
        <div className="skuup-admin-panel-heading">
          <div>
            <p className="skuup-kicker">Inventaire</p>
            <h2 id="lots-inventory-title">Lots et stock</h2>
          </div>
          <span className="skuup-admin-count">
            {visible.length} / {items.length}
          </span>
        </div>
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
        <section className="skuup-inventory-kpi-strip" aria-label="Indicateurs de stock">
          <div><span aria-hidden="true"><SkkupIcon name="gift" size={18} /></span><strong>{items.length}</strong><small>lots référencés</small></div>
          <div><span aria-hidden="true"><SkkupIcon name="check" size={18} /></span><strong>{items.filter((lot) => lot.quantite > 3).length}</strong><small>disponibles</small></div>
          <div><span aria-hidden="true"><SkkupIcon name="draws" size={18} /></span><strong>{items.filter((lot) => lot.quantite > 0 && lot.quantite <= 3).length}</strong><small>stocks faibles</small></div>
          <div><span aria-hidden="true"><SkkupIcon name="moderation" size={18} /></span><strong>{items.filter((lot) => lot.quantite === 0).length}</strong><small>en rupture</small></div>
        </section>
        <div className="skuup-admin-toolbar">
          <label className="skuup-admin-search">
            Rechercher
            <input
              aria-label="Rechercher un lot"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Nom, fournisseur ou tirage"
            />
          </label>
          <label className="skuup-admin-filter">
            Stock
            <select
              aria-label="Filtrer les lots par stock"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
            >
              <option value="TOUS">Tous</option>
              <option value="DISPONIBLE">Disponible</option>
              <option value="FAIBLE">Stock faible</option>
              <option value="RUPTURE">Rupture</option>
            </select>
          </label>
          <button
            className="skuup-button skuup-button-outline"
            type="button"
            onClick={() => load(query)}
            disabled={loading}
          >
            {loading ? "Chargement…" : "Rechercher"}
          </button>
        </div>
        <div
          className="skuup-admin-inventory-table"
          role="table"
          aria-label="Inventaire des lots"
        >
          <div
            className="skuup-admin-inventory-row skuup-admin-inventory-head"
            role="row"
          >
            <span>Média</span>
            <span>Lot</span>
            <span>Type</span>
            <span>Stock</span>
            <span>Statut</span>
            <span>Tirage associé</span>
            <span>Actions</span>
          </div>
          {loading ? (
            <p className="skuup-admin-inline-empty" role="status">
              Chargement de l’inventaire…
            </p>
          ) : (
            <>
              {visible.map((lot) => (
                <div
                  className="skuup-admin-inventory-row"
                  role="row"
                  key={lot.id}
                >
                  <span className="skuup-admin-lot-media" data-label="Média">
                    <span className="skuup-admin-media-placeholder">
                      {lot.imageUrl ? <img src={lot.imageUrl} alt={`Illustration du lot ${lot.nom}`} /> : <SkkupIcon name="gift" size={18} aria-hidden="true" />}
                    </span>
                  </span>
                  <span className="skuup-admin-lot-identity">
                    <strong>{lot.nom}</strong>
                    <small>{lot.fournisseur || "Fournisseur non fourni"}</small>
                  </span>
                  <span data-label="Type">Non renseigné</span>
                  <span data-label="Stock">{lot.quantite}</span>
                  <span data-label="Statut">
                    <span className={`skuup-status-badge skuup-status-badge-${lot.quantite === 0 ? "danger" : lot.quantite <= 3 ? "warning" : "success"}`}>
                      {stockLabel(lot.quantite)} · {lot.quantite}
                    </span>
                  </span>
                  <span data-label="Tirage associé">{lot.raffle.titre}</span>
                  <span className="skuup-admin-lot-actions" data-label="Actions">
                    <button
                      className="skuup-button skuup-button-outline"
                      type="button"
                      onClick={() => edit(lot)}
                    >
                      Modifier
                    </button>
                    <button
                      className="skuup-button skuup-button-outline"
                      type="button"
                      onClick={() => void remove(lot)}
                    >
                      Supprimer
                    </button>
                  </span>
                </div>
              ))}
              {!visible.length && (
                <p className="skuup-admin-inline-empty">
                  Aucun lot renvoyé par le contrat.
                </p>
              )}
            </>
          )}
        </div>
      </section>
      {isFormOpen && (
        <div className="skuup-lots-drawer-layer" aria-label="Édition d’un lot">
          <button
            className="skuup-lots-drawer-backdrop"
            type="button"
            aria-label="Fermer le panneau"
            onClick={closeForm}
          />
          <form
            className="skuup-premium-panel skuup-admin-lot-form skuup-lots-drawer"
            id="lots-create-form"
            onSubmit={async (event) => {
              if (await submit(event)) setIsFormOpen(false);
            }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="lots-form-title"
          >
            <div className="skuup-lots-drawer-heading">
              <div>
                <p className="skuup-kicker">
                  {editing ? "Édition du lot" : "Nouveau lot"}
                </p>
                <h2 id="lots-form-title">{editing ? `Modifier ${editing.nom}` : "Créer un lot"}</h2>
              </div>
              <button className="skuup-lots-drawer-close" type="button" onClick={closeForm} aria-label="Fermer le panneau">×</button>
            </div>
            <p className="skuup-lots-drawer-intro">Renseignez uniquement les informations transmises au contrat administrateur.</p>
            <div className="skuup-lots-drawer-preview" aria-live="polite">
              <p className="skuup-kicker">Aperçu média</p>
              {form.imageUrl ? (
                <img src={form.imageUrl} alt="Aperçu du média du lot" />
              ) : (
                <div className="skuup-lots-drawer-preview-empty">
                  <SkkupIcon name="gift" size={28} aria-hidden="true" />
                  <span>Aucun média fourni</span>
                </div>
              )}
            </div>
            {(
              [
                ["raffleId", "Identifiant du tirage"],
                ["nom", "Nom"],
                ["valeurEstimee", "Valeur estimée"],
                ["fournisseur", "Fournisseur"],
                ["imageUrl", "URL HTTPS de l’image réelle (optionnel)"],
              ] as const
            ).map(([key, label]) => (
              <label className="skuup-admin-field" key={key}>
                {label}
                <input
                  className="skuup-admin-input"
                  required={key !== "imageUrl"}
                  disabled={key === "raffleId" && Boolean(editing)}
                  value={form[key]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                />
              </label>
            ))}
            <label className="skuup-admin-field">
              Quantité
              <input className="skuup-admin-input" type="number" min="1" required value={form.quantite} onChange={(e) => setForm({ ...form, quantite: Number(e.target.value) })} />
            </label>
            <div className="skuup-lots-drawer-actions">
              <button className="skuup-button skuup-button-primary">
                {editing ? "Enregistrer les modifications" : "Créer le lot"}
              </button>
              <button className="skuup-button skuup-button-outline" type="button" onClick={closeForm}>Annuler</button>
            </div>
          </form>
        </div>
      )}
      </div>
    </div>
  );
}

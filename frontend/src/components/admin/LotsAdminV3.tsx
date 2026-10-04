"use client";

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
};
const empty: FormState = {
  raffleId: "",
  nom: "",
  valeurEstimee: "",
  quantite: 1,
  fournisseur: "",
};

export function LotsAdminV3() {
  const [items, setItems] = useState<LotAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<FormState>(empty);
  const [editing, setEditing] = useState<LotAdmin | null>(null);
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
    });
  }
  async function submit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    try {
      const result = editing
        ? await modifierLotAdmin(editing.id, {
            nom: form.nom,
            valeurEstimee: form.valeurEstimee,
            quantite: form.quantite,
            fournisseur: form.fournisseur,
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
    } catch {
      setError(
        editing
          ? "Mise à jour du lot impossible."
          : "Création du lot impossible.",
      );
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
          <div><span aria-hidden="true">▦</span><strong>{items.length}</strong><small>lots référencés</small></div>
          <div><span aria-hidden="true">✓</span><strong>{items.filter((lot) => lot.quantite > 3).length}</strong><small>disponibles</small></div>
          <div><span aria-hidden="true">!</span><strong>{items.filter((lot) => lot.quantite > 0 && lot.quantite <= 3).length}</strong><small>stocks faibles</small></div>
          <div><span aria-hidden="true">×</span><strong>{items.filter((lot) => lot.quantite === 0).length}</strong><small>en rupture</small></div>
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
            <span>Lot</span>
            <span>Tirage associé</span>
            <span>Valeur</span>
            <span>Stock</span>
            <span>Action</span>
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
                  <span className="skuup-admin-lot-identity">
                    <span
                      className="skuup-admin-media-placeholder"
                      aria-hidden="true"
                    >
                      <SkkupIcon name="gift" size={18} />
                    </span>
                    <strong>{lot.nom}</strong>
                    <small>{lot.fournisseur || "Fournisseur non fourni"}</small>
                  </span>
                  <span>{lot.raffle.titre}</span>
                  <span>{lot.valeurEstimee}</span>
                  <span>
                    <span className="skuup-status-badge">
                      {stockLabel(lot.quantite)} · {lot.quantite}
                    </span>
                  </span>
                  <span className="flex flex-wrap gap-2">
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
      <form
        className="skuup-premium-panel skuup-admin-lot-form"
        onSubmit={submit}
      >
        <p className="skuup-kicker">
          {editing ? "Édition contrôlée" : "Nouvelle ressource"}
        </p>
        <h2>{editing ? `Modifier ${editing.nom}` : "Créer un lot"}</h2>
        <p>
          Les champs sont envoyés au contrat administrateur. Aucun aperçu fictif
          n’est affiché.
        </p>
        {(
          [
            ["raffleId", "Identifiant du tirage"],
            ["nom", "Nom"],
            ["valeurEstimee", "Valeur estimée"],
            ["fournisseur", "Fournisseur"],
          ] as const
        ).map(([key, label]) => (
          <label className="skuup-admin-field" key={key}>
            {label}
            <input
              className="skuup-admin-input"
              required
              disabled={key === "raffleId" && Boolean(editing)}
              value={form[key]}
              onChange={(e) => setForm({ ...form, [key]: e.target.value })}
            />
          </label>
        ))}
        <label className="skuup-admin-field">
          Quantité
          <input
            className="skuup-admin-input"
            type="number"
            min="1"
            required
            value={form.quantite}
            onChange={(e) =>
              setForm({ ...form, quantite: Number(e.target.value) })
            }
          />
        </label>
        <div className="flex flex-wrap gap-2">
          <button className="skuup-button skuup-button-primary">
            {editing ? "Enregistrer les modifications" : "Créer le lot"}
          </button>
          {editing && (
            <button
              className="skuup-button skuup-button-outline"
              type="button"
              onClick={() => {
                setEditing(null);
                setForm(empty);
              }}
            >
              Annuler
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

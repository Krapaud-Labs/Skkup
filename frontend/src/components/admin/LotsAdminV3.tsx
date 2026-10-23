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
import { ErreurApi } from "@/lib/api";
import { SkkupIcon } from "@/components/ui/SkkupIcon";
import { Shell } from "@/components/admin/AdminSectionPage";
import { useLanguage } from "@/components/i18n/LanguageProvider";

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

const copy = {
  fr: { heading: "Inventaire administrateur", title: "Lots", description: "Gérez les lots, leur stock et leur disponibilité pour les tirages.", add: "Ajouter un lot", inventory: "Inventaire", inventoryTitle: "Lots et stock", metrics: "Indicateurs de stock", referenced: "lots référencés", available: "disponibles", low: "stocks faibles", out: "en rupture", search: "Rechercher", searchLabel: "Rechercher un lot", placeholder: "Nom, fournisseur ou tirage", stock: "Stock", all: "Tous", availableFilter: "Disponible", lowFilter: "Stock faible", outFilter: "Rupture", loading: "Chargement…", loadingInventory: "Chargement de l’inventaire…", media: "Média", lot: "Lot", supplier: "Fournisseur", status: "Statut", linkedDraw: "Tirage associé", actions: "Actions", noSupplier: "Fournisseur non fourni", stockLevel: (count: number) => `Niveau de stock : ${count}`, noLots: "Aucun lot renvoyé par le contrat.", edit: "Modifier", remove: "Supprimer", close: "Fermer le panneau", editKicker: "Édition du lot", newKicker: "Nouveau lot", create: "Créer un lot", intro: "Renseignez uniquement les informations transmises au contrat administrateur.", preview: "Aperçu média", noMedia: "Aucun média fourni", mediaAlt: "Aperçu du média du lot", raffleId: "Identifiant du tirage", name: "Nom", value: "Valeur estimée", imageUrl: "URL HTTPS de l’image réelle (optionnel)", quantity: "Quantité", save: "Enregistrer les modifications", cancel: "Annuler", loadError: "Impossible de charger les lots.", createError: "Création du lot impossible.", updateError: "Mise à jour du lot impossible.", removeError: "Suppression impossible : le lot peut être engagé dans un tirage.", forbidden: "Cette action est réservée aux comptes administrateurs autorisés.", created: "Lot créé depuis le contrat administrateur.", updated: "Lot mis à jour depuis le contrat administrateur.", removed: "Lot supprimé.", confirm: (name: string) => `Supprimer le lot « ${name} » ? Cette action est irréversible.`, imageProvided: (name: string) => `Illustration du lot ${name}`, noImage: (name: string) => `Aucune image fournie pour le lot ${name}` },
  en: { heading: "Administration inventory", title: "Prizes", description: "Manage prizes, stock and availability for draws.", add: "Add a prize", inventory: "Inventory", inventoryTitle: "Prizes and stock", metrics: "Stock metrics", referenced: "referenced prizes", available: "available", low: "low stock", out: "out of stock", search: "Search", searchLabel: "Search prizes", placeholder: "Name, supplier or draw", stock: "Stock", all: "All", availableFilter: "Available", lowFilter: "Low stock", outFilter: "Out of stock", loading: "Loading…", loadingInventory: "Loading inventory…", media: "Media", lot: "Prize", supplier: "Supplier", status: "Status", linkedDraw: "Linked draw", actions: "Actions", noSupplier: "Supplier not provided", stockLevel: (count: number) => `Stock level: ${count}`, noLots: "No prizes were returned by the contract.", edit: "Edit", remove: "Delete", close: "Close panel", editKicker: "Edit prize", newKicker: "New prize", create: "Create prize", intro: "Only enter information sent to the administration contract.", preview: "Media preview", noMedia: "No media provided", mediaAlt: "Prize media preview", raffleId: "Draw identifier", name: "Name", value: "Estimated value", imageUrl: "HTTPS URL of the real image (optional)", quantity: "Quantity", save: "Save changes", cancel: "Cancel", loadError: "Unable to load prizes.", createError: "Unable to create the prize.", updateError: "Unable to update the prize.", removeError: "Unable to delete the prize: it may be linked to a draw.", forbidden: "This action is limited to authorised administrator accounts.", created: "Prize created through the administration contract.", updated: "Prize updated through the administration contract.", removed: "Prize deleted.", confirm: (name: string) => `Delete prize “${name}”? This action cannot be undone.`, imageProvided: (name: string) => `Illustration of prize ${name}`, noImage: (name: string) => `No image provided for prize ${name}` },
} as const;

function LotMedia({ lot, langue }: { lot: LotAdmin; langue: "fr" | "en" }) {
  const [imageIndisponible, setImageIndisponible] = useState(false);
  const t = copy[langue];

  return (
    <span
      className="skuup-admin-media-placeholder"
      role={lot.imageUrl && !imageIndisponible ? undefined : "img"}
      aria-label={
        lot.imageUrl
          ? imageIndisponible
            ? t.noImage(lot.nom)
            : undefined
          : t.noImage(lot.nom)
      }
    >
      {lot.imageUrl && !imageIndisponible ? (
        <img
          src={lot.imageUrl}
          alt={t.imageProvided(lot.nom)}
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setImageIndisponible(true)}
        />
      ) : (
        <SkkupIcon name="gift" size={18} />
      )}
    </span>
  );
}

export function LotsAdminV3() {
  const { langue } = useLanguage();
  const t = copy[langue];
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
      .catch((exception: unknown) => setError(exception instanceof ErreurApi && exception.statut === 403 ? t.forbidden : t.loadError))
      .finally(() => setLoading(false));
  }
  useEffect(() => {
    void listerLotsAdmin()
      .then(setItems)
      .catch((exception: unknown) => setError(exception instanceof ErreurApi && exception.statut === 403 ? t.forbidden : t.loadError))
      .finally(() => setLoading(false));
  }, [t.loadError, t.forbidden]);
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
      setMessage(editing ? t.updated : t.created);
      return true;
    } catch (exception: unknown) {
      setError(exception instanceof ErreurApi && exception.statut === 403 ? t.forbidden : editing ? t.updateError : t.createError);
      return false;
    }
  }
  async function remove(lot: LotAdmin) {
    if (
      !window.confirm(
        t.confirm(lot.nom),
      )
    )
      return;
    try {
      await supprimerLotAdmin(lot.id);
      setItems((all) => all.filter((item) => item.id !== lot.id));
      setMessage(t.removed);
    } catch (exception: unknown) {
      setError(exception instanceof ErreurApi && exception.statut === 403 ? t.forbidden : t.removeError);
    }
  }
  const visible = items.filter(
    (lot) =>
      (!query.trim() || `${lot.nom} ${lot.fournisseur} ${lot.raffle.titre}`.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase())) &&
      (stock === "TOUS" ||
      (stock === "RUPTURE"
        ? lot.quantite === 0
        : stock === "FAIBLE"
          ? lot.quantite > 0 && lot.quantite <= 3
          : lot.quantite > 3)),
  );
  const stockLabel = (quantity: number) => quantity === 0 ? t.outFilter : quantity <= 3 ? t.lowFilter : t.availableFilter;
  return (
    <Shell section="lots">
      <div className="skuup-lots-page">
        <header className="skuup-lots-page-heading">
          <div className="skuup-lots-page-title">
            <span className="skuup-lots-page-icon" aria-hidden="true">
              <SkkupIcon name="gift" size={34} />
            </span>
            <div>
              <p className="skuup-kicker">{t.heading}</p>
              <h2>{t.title}</h2>
              <p>{t.description}</p>
            </div>
          </div>
          <button
            className="skuup-button skuup-button-primary skuup-lots-add-button"
            type="button"
            onClick={openCreate}
          >
            <SkkupIcon name="gift" size={18} />
            {t.add}
          </button>
        </header>
        <div className="skuup-lots-layout">
          <section
            className="skuup-premium-panel skuup-admin-inventory"
            aria-labelledby="lots-inventory-title"
          >
            <div className="skuup-admin-panel-heading">
              <div>
                <p className="skuup-kicker">{t.inventory}</p>
                <h2 id="lots-inventory-title">{t.inventoryTitle}</h2>
              </div>
              <span className="skuup-admin-count">
                {visible.length} / {items.length}
              </span>
            </div>
            {error && (
              <p
                role="alert"
                className="skuup-admin-alert skuup-admin-alert-error"
              >
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
            <section
              className="skuup-inventory-kpi-strip"
              aria-label={t.metrics}
            >
              <div>
                <span aria-hidden="true">
                  <SkkupIcon name="gift" size={18} />
                </span>
                <strong>{items.length}</strong>
                <small>{t.referenced}</small>
              </div>
              <div>
                <span aria-hidden="true">
                  <SkkupIcon name="check" size={18} />
                </span>
                <strong>
                  {items.filter((lot) => lot.quantite > 3).length}
                </strong>
                <small>{t.available}</small>
              </div>
              <div>
                <span aria-hidden="true">
                  <SkkupIcon name="draws" size={18} />
                </span>
                <strong>
                  {
                    items.filter((lot) => lot.quantite > 0 && lot.quantite <= 3)
                      .length
                  }
                </strong>
                <small>{t.low}</small>
              </div>
              <div>
                <span aria-hidden="true">
                  <SkkupIcon name="shield" size={18} />
                </span>
                <strong>
                  {items.filter((lot) => lot.quantite === 0).length}
                </strong>
                <small>{t.out}</small>
              </div>
            </section>
            <div className="skuup-admin-toolbar">
              <label className="skuup-admin-search">
                {t.search}
                <input
                  aria-label={t.searchLabel}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t.placeholder}
                />
              </label>
              <label className="skuup-admin-filter">
                {t.stock}
                <select
                  aria-label={t.stock}
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                >
                  <option value="TOUS">{t.all}</option>
                  <option value="DISPONIBLE">{t.availableFilter}</option>
                  <option value="FAIBLE">{t.lowFilter}</option>
                  <option value="RUPTURE">{t.outFilter}</option>
                </select>
              </label>
              <button
                className="skuup-button skuup-button-outline"
                type="button"
                onClick={() => load(query)}
                disabled={loading}
              >
                {loading ? t.loading : t.search}
              </button>
            </div>
            <div
              className="skuup-admin-inventory-table"
              role="table"
              aria-label={t.inventoryTitle}
            >
              <div
                className="skuup-admin-inventory-row skuup-admin-inventory-head"
                role="row"
              >
                <span role="columnheader">{t.media}</span>
                <span role="columnheader">{t.lot}</span>
                <span role="columnheader">{t.supplier}</span>
                <span role="columnheader">{t.stock}</span>
                <span role="columnheader">{t.status}</span>
                <span role="columnheader">{t.linkedDraw}</span>
                <span role="columnheader">{t.actions}</span>
              </div>
              {loading ? (
                <p className="skuup-admin-inline-empty" role="status">
                  {t.loadingInventory}
                </p>
              ) : (
                <>
                  {visible.map((lot) => (
                    <div
                      className="skuup-admin-inventory-row"
                      role="row"
                      key={lot.id}
                    >
                      <span
                        className="skuup-admin-lot-media"
                        data-label="Média"
                      >
                        <LotMedia lot={lot} langue={langue} />
                      </span>
                      <span className="skuup-admin-lot-identity">
                        <strong>{lot.nom}</strong>
                        <small>{lot.valeurEstimee}</small>
                      </span>
                      <span data-label={t.supplier}>{lot.fournisseur || t.noSupplier}</span>
                      <span data-label={t.stock}>{lot.quantite.toLocaleString(langue === "en" ? "en-US" : "fr-FR")}</span>
                      <span data-label={t.status}>
                        <span
                          className={`skuup-status-badge skuup-status-badge-${lot.quantite === 0 ? "danger" : lot.quantite <= 3 ? "warning" : "success"}`}
                        >
                          {stockLabel(lot.quantite)} · {lot.quantite}
                        </span>
                        <span
                          className={`skuup-admin-stock-meter skuup-admin-stock-meter-${lot.quantite === 0 ? "empty" : lot.quantite <= 3 ? "low" : "healthy"}`}
                          role="img"
                          aria-label={t.stockLevel(lot.quantite)}
                        >
                          <span />
                        </span>
                      </span>
                      <span data-label={t.linkedDraw}>
                        {lot.raffle.titre}
                      </span>
                      <span
                        className="skuup-admin-lot-actions"
                        data-label={t.actions}
                      >
                        <button
                          className="skuup-button skuup-button-outline"
                          type="button"
                          onClick={() => edit(lot)}
                        >
                          {t.edit}
                        </button>
                        <button
                          className="skuup-button skuup-button-outline"
                          type="button"
                          onClick={() => void remove(lot)}
                        >
                          {t.remove}
                        </button>
                      </span>
                    </div>
                  ))}
                  {!visible.length && (
                    <p className="skuup-admin-inline-empty">
                      {t.noLots}
                    </p>
                  )}
                </>
              )}
            </div>
          </section>
          {isFormOpen && (
            <div
              className="skuup-lots-drawer-layer"
              aria-label={t.editKicker}
            >
              <button
                className="skuup-lots-drawer-backdrop"
                type="button"
                aria-label={t.close}
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
                      {editing ? t.editKicker : t.newKicker}
                    </p>
                    <h2 id="lots-form-title">
                      {editing ? `${t.edit} ${editing.nom}` : t.create}
                    </h2>
                  </div>
                  <button
                    className="skuup-lots-drawer-close"
                    type="button"
                    onClick={closeForm}
                    aria-label={t.close}
                  >
                    ×
                  </button>
                </div>
                <p className="skuup-lots-drawer-intro">
                  {t.intro}
                </p>
                <div className="skuup-lots-drawer-preview" aria-live="polite">
                  <p className="skuup-kicker">{t.preview}</p>
                  {form.imageUrl ? (
                    <img src={form.imageUrl} alt={t.mediaAlt} />
                  ) : (
                    <div className="skuup-lots-drawer-preview-empty">
                      <SkkupIcon name="gift" size={28} aria-hidden="true" />
                      <span>{t.noMedia}</span>
                    </div>
                  )}
                </div>
                {(
                  [
                    ["raffleId", t.raffleId],
                    ["nom", t.name],
                    ["valeurEstimee", t.value],
                    ["fournisseur", t.supplier],
                    ["imageUrl", t.imageUrl],
                  ] as const
                ).map(([key, label]) => (
                  <label className="skuup-admin-field" key={key}>
                    {label}
                    <input
                      className="skuup-admin-input"
                      required={key !== "imageUrl"}
                      disabled={key === "raffleId" && Boolean(editing)}
                      value={form[key]}
                      onChange={(e) =>
                        setForm({ ...form, [key]: e.target.value })
                      }
                    />
                  </label>
                ))}
                <label className="skuup-admin-field">
                  {t.quantity}
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
                <div className="skuup-lots-drawer-actions">
                  <button className="skuup-button skuup-button-primary">
                    {editing ? t.save : t.create}
                  </button>
                  <button
                    className="skuup-button skuup-button-outline"
                    type="button"
                    onClick={closeForm}
                  >
                    {t.cancel}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </Shell>
  );
}

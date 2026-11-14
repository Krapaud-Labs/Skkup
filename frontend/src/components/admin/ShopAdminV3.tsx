"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Shell } from "@/components/admin/AdminSectionPage";
import { useLanguage } from "@/components/i18n/LanguageProvider";
import { ErreurApi } from "@/lib/api";
import {
  creerArticleAdmin,
  desactiverArticleAdmin,
  importerCodesAdmin,
  listerAchatsAdmin,
  listerArticlesAdmin,
  modifierArticleAdmin,
  type AdminShopItem,
  type AdminShopPurchase,
  type ShopItemInput,
  type ShopItemType,
} from "@/lib/shop";

const labels = {
  fr: {
    kicker: "Catalogue numérique", title: "Boutique", intro: "Configurez les récompenses et leur prix en points. Les codes importés ne sont jamais affichés dans l’administration.", add: "Ajouter un article", edit: "Modifier", deactivate: "Désactiver", active: "Actif", inactive: "Désactivé", type: "Type", promo: "Code promotionnel", gift: "Bon numérique", ticket: "Ticket de tirage", name: "Nom", description: "Description", image: "URL de l’image (facultatif)", cost: "Prix en points", limit: "Limite par compte", unlimited: "Aucune limite", raffle: "Identifiant du tirage", save: "Enregistrer", cancel: "Annuler", create: "Créer l’article", loading: "Chargement du catalogue…", error: "Impossible de charger la boutique.", saveError: "Enregistrement impossible.", saved: "Article enregistré.", disabled: "Article désactivé.", codes: "Importer des codes", codesHelp: "Un code par ligne. Les valeurs ne seront pas conservées dans la page après l’import.", import: "Importer", importing: "Import…", imported: (a: number, r: number) => `${a} accepté(s), ${r} refusé(s).`, stock: (n: number) => `${n} code(s) disponible(s)`, ticketNoCodes: "Offre de tickets", noItems: "Aucun article dans le catalogue.", purchases: "Achats récents", loadingPurchases: "Chargement des achats…", purchasesError: "Impossible de charger les achats.", noPurchases: "Aucun achat enregistré.", buyer: "Compte", date: "Date", item: "Article", status: "État", price: "Coût", ready: "Code attribué", fulfilled: "Ticket attribué", page: (p: number, total: number) => `Page ${p} sur ${total}`, previous: "Précédente", next: "Suivante", required: "Ce champ est obligatoire.", codeTypeError: "L’import de codes est réservé aux codes promotionnels et bons numériques.", emptyCodes: "Saisissez au moins un code.", forbidden: "Action réservée aux administrateurs.", confirmation: (name: string) => `Désactiver « ${name} » ?`, disableInfo: "La désactivation empêche les nouveaux achats et conserve l’historique.",
  },
  en: {
    kicker: "Digital catalogue", title: "Shop", intro: "Configure rewards and their points price. Imported codes are never displayed in administration.", add: "Add item", edit: "Edit", deactivate: "Deactivate", active: "Active", inactive: "Disabled", type: "Type", promo: "Promo code", gift: "Digital gift card", ticket: "Draw ticket", name: "Name", description: "Description", image: "Image URL (optional)", cost: "Price in points", limit: "Per-account limit", unlimited: "No limit", raffle: "Draw identifier", save: "Save", cancel: "Cancel", create: "Create item", loading: "Loading catalogue…", error: "Unable to load the shop.", saveError: "Unable to save the item.", saved: "Item saved.", disabled: "Item deactivated.", codes: "Import codes", codesHelp: "One code per line. Values are cleared from the page after import.", import: "Import", importing: "Importing…", imported: (a: number, r: number) => `${a} accepted, ${r} rejected.`, stock: (n: number) => `${n} code(s) available`, ticketNoCodes: "Ticket offer", noItems: "No items in the catalogue.", purchases: "Recent purchases", loadingPurchases: "Loading purchases…", purchasesError: "Unable to load purchases.", noPurchases: "No purchases recorded.", buyer: "Account", date: "Date", item: "Item", status: "Status", price: "Cost", ready: "Code assigned", fulfilled: "Ticket assigned", page: (p: number, total: number) => `Page ${p} of ${total}`, previous: "Previous", next: "Next", required: "This field is required.", codeTypeError: "Code import is available for promo codes and gift cards only.", emptyCodes: "Enter at least one code.", forbidden: "This action is limited to administrators.", confirmation: (name: string) => `Deactivate “${name}”?`, disableInfo: "Deactivation prevents new purchases and preserves purchase history.",
  },
} as const;

const emptyForm = (): ShopItemInput => ({ type: "PROMO_CODE", nom: "", description: "", imageUrl: "", costPoints: 100, active: false, maxPerUser: 1, raffleId: null });

export function ShopAdminV3() {
  const { langue } = useLanguage();
  const t = labels[langue];
  const [items, setItems] = useState<AdminShopItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [form, setForm] = useState<ShopItemInput>(emptyForm());
  const [editing, setEditing] = useState<AdminShopItem | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [codesFor, setCodesFor] = useState<AdminShopItem | null>(null);
  const [codesText, setCodesText] = useState("");
  const [importing, setImporting] = useState(false);
  const [purchases, setPurchases] = useState<AdminShopPurchase[]>([]);
  const [purchasesLoading, setPurchasesLoading] = useState(true);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);
  const [purchasePage, setPurchasePage] = useState(1);
  const [purchaseTotal, setPurchaseTotal] = useState(0);

  const loadItems = useCallback(async (requestedPage: number) => {
    setLoading(true);
    setLoadError(null);
    try {
      const result = await listerArticlesAdmin(requestedPage, 50);
      setItems(result.items);
      setTotal(result.total);
      setPage(result.page);
    } catch (cause) {
      setLoadError(cause instanceof ErreurApi && cause.statut === 403 ? t.forbidden : t.error);
    } finally {
      setLoading(false);
    }
  }, [t]);

  const loadPurchases = useCallback(async (requestedPage: number) => {
    setPurchaseError(null);
    setPurchasesLoading(true);
    try {
      const result = await listerAchatsAdmin(requestedPage, 25);
      setPurchases(result.items);
      setPurchaseTotal(result.total);
      setPurchasePage(result.page);
    } catch (cause) {
      setPurchaseError(cause instanceof ErreurApi && cause.statut === 403 ? t.forbidden : t.purchasesError);
    } finally {
      setPurchasesLoading(false);
    }
  }, [t]);

  useEffect(() => { queueMicrotask(() => void loadItems(page)); }, [loadItems, page]);
  useEffect(() => { queueMicrotask(() => void loadPurchases(purchasePage)); }, [loadPurchases, purchasePage]);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm());
    setError(null);
    setFormOpen(true);
  }
  function openEdit(item: AdminShopItem) {
    setEditing(item);
    setForm({ type: item.type, nom: item.nom, description: item.description, imageUrl: item.imageUrl, costPoints: item.costPoints, active: item.active, maxPerUser: item.maxPerUser, raffleId: item.raffleId });
    setError(null);
    setFormOpen(true);
  }
  function closeForm() {
    if (saving) return;
    setFormOpen(false);
    setEditing(null);
    setForm(emptyForm());
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);
    const payload: ShopItemInput = { ...form, nom: form.nom.trim(), description: form.description.trim(), imageUrl: form.imageUrl?.trim() || null, raffleId: form.type === "RAFFLE_TICKET" ? form.raffleId?.trim() || null : null };
    try {
      if (editing) await modifierArticleAdmin(editing.id, payload);
      else await creerArticleAdmin(payload);
      setMessage(t.saved);
      setFormOpen(false);
      setEditing(null);
      await loadItems(page);
    } catch (cause) {
      setError(cause instanceof ErreurApi && cause.statut === 403 ? t.forbidden : t.saveError);
    } finally {
      setSaving(false);
    }
  }
  async function deactivate(item: AdminShopItem) {
    if (!window.confirm(`${t.confirmation(item.nom)} ${t.disableInfo}`)) return;
    setError(null);
    try {
      await desactiverArticleAdmin(item.id);
      setMessage(t.disabled);
      await loadItems(page);
    } catch (cause) {
      setError(cause instanceof ErreurApi && cause.statut === 403 ? t.forbidden : t.saveError);
    }
  }
  async function importCodes(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const codes = [...new Set(codesText.split(/\r?\n/u).map((code) => code.trim()).filter(Boolean))];
    if (!codes.length || !codesFor || codesFor.type === "RAFFLE_TICKET") {
      setError(codesFor?.type === "RAFFLE_TICKET" ? t.codeTypeError : t.emptyCodes);
      return;
    }
    setImporting(true);
    setError(null);
    setMessage(null);
    try {
      const result = await importerCodesAdmin(codesFor.id, codes);
      setCodesText("");
      setCodesFor(null);
      setMessage(t.imported(result.accepted, result.rejected));
      await loadItems(page);
    } catch (cause) {
      setError(cause instanceof ErreurApi && cause.statut === 403 ? t.forbidden : t.saveError);
    } finally {
      setImporting(false);
    }
  }

  const pages = Math.max(1, Math.ceil(total / 50));
  const purchasePages = Math.max(1, Math.ceil(purchaseTotal / 25));
  const formatDate = (value: string) => new Date(value).toLocaleDateString(langue === "en" ? "en-US" : "fr-FR");
  const typeName = (type: ShopItemType) => type === "PROMO_CODE" ? t.promo : type === "GIFT_CARD" ? t.gift : t.ticket;

  return (
    <Shell section="shop">
      <div className="skuup-admin-shop-page">
        <AdminPageHeader kicker={t.kicker} title={t.title} icon="gift" description={t.intro} />
        <div className="skuup-admin-shop-toolbar"><p>{total} {langue === "en" ? "items" : "articles"}</p><button className="skuup-button skuup-button-primary" type="button" onClick={openCreate}>{t.add}</button></div>
        {error && <p className="skuup-admin-alert skuup-admin-alert-error" role="alert">{error}</p>}
        {message && <p className="skuup-admin-alert skuup-admin-alert-success" role="status">{message}</p>}
        {loadError && <div className="skuup-admin-alert skuup-admin-alert-error" role="alert">{loadError}<button type="button" className="skuup-button skuup-button-outline" onClick={() => void loadItems(page)}>{langue === "en" ? "Retry" : "Réessayer"}</button></div>}
        {loading ? <p role="status" className="skuup-shop-state">{t.loading}</p> : items.length === 0 ? <p className="skuup-shop-state">{t.noItems}</p> : (
          <div className="skuup-admin-shop-list">
            {items.map((item) => <article className="skuup-admin-shop-item" key={item.id}>
              <div className="skuup-admin-shop-item-main"><span className="skuup-shop-type">{typeName(item.type)}</span><h2>{item.nom}</h2><p>{item.description}</p><div className="skuup-admin-shop-facts"><span>{item.costPoints.toLocaleString()} pts</span><span>{item.maxPerUser === null ? t.unlimited : `${t.limit}: ${item.maxPerUser}`}</span><span>{item.type === "RAFFLE_TICKET" ? t.ticketNoCodes : t.stock(item.availableCodeCount ?? 0)}</span><span className={item.active ? "skuup-shop-status" : "skuup-shop-status skuup-shop-status-muted"}>{item.active ? t.active : t.inactive}</span></div></div>
              <div className="skuup-admin-shop-actions"><button className="skuup-button skuup-button-outline" type="button" onClick={() => openEdit(item)}>{t.edit}</button>{item.type !== "RAFFLE_TICKET" && <button className="skuup-button skuup-button-outline" type="button" onClick={() => { setCodesFor(item); setCodesText(""); }}>{t.codes}</button>}{item.active && <button className="skuup-button skuup-button-outline" type="button" onClick={() => void deactivate(item)}>{t.deactivate}</button>}</div>
            </article>)}
          </div>
        )}
        {!loading && total > 50 && <div className="skuup-shop-pagination"><button className="skuup-button skuup-button-outline" type="button" disabled={page <= 1} onClick={() => setPage(page - 1)}>{t.previous}</button><span>{t.page(page, pages)}</span><button className="skuup-button skuup-button-outline" type="button" disabled={page >= pages} onClick={() => setPage(page + 1)}>{t.next}</button></div>}

        <section className="skuup-admin-shop-purchases" aria-labelledby="shop-admin-purchases-title"><div className="skuup-viewer-section-heading"><div><p className="skuup-kicker">{t.kicker}</p><h2 id="shop-admin-purchases-title">{t.purchases}</h2></div><span className="skuup-shop-count">{purchaseTotal}</span></div>
          {purchasesLoading ? <p role="status" className="skuup-shop-state">{t.loadingPurchases}</p> : purchaseError ? <div role="alert" className="skuup-admin-alert skuup-admin-alert-error">{purchaseError}<button className="skuup-button skuup-button-outline" type="button" onClick={() => void loadPurchases(purchasePage)}>{langue === "en" ? "Retry" : "Réessayer"}</button></div> : purchases.length === 0 ? <p className="skuup-shop-state">{t.noPurchases}</p> : <div className="skuup-admin-shop-purchase-list">{purchases.map((purchase) => <article className="skuup-admin-shop-purchase" key={purchase.id}><strong>{purchase.itemName}</strong><span>{t.buyer}: {purchase.pseudo}</span><span>{formatDate(purchase.createdAt)}</span><span>{purchase.costPoints.toLocaleString()} pts</span><span>{purchase.status === "READY_TO_REVEAL" ? t.ready : t.fulfilled}</span></article>)}</div>}
          {purchaseTotal > 25 && <div className="skuup-shop-pagination"><button className="skuup-button skuup-button-outline" type="button" disabled={purchasePage <= 1} onClick={() => setPurchasePage(purchasePage - 1)}>{t.previous}</button><span>{t.page(purchasePage, purchasePages)}</span><button className="skuup-button skuup-button-outline" type="button" disabled={purchasePage >= purchasePages} onClick={() => setPurchasePage(purchasePage + 1)}>{t.next}</button></div>}
        </section>
      </div>

      {formOpen && <div className="skuup-shop-dialog-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) closeForm(); }}><section className="skuup-shop-dialog skuup-admin-shop-dialog" role="dialog" aria-modal="true" aria-labelledby="shop-admin-form-title"><button className="skuup-shop-dialog-close" type="button" onClick={closeForm} aria-label={t.cancel} disabled={saving}>×</button><p className="skuup-kicker">{editing ? t.edit : t.add}</p><h2 id="shop-admin-form-title">{editing ? t.edit : t.create}</h2><form onSubmit={(event) => void submit(event)} className="skuup-admin-shop-form">
        <label>{t.type}<select value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value as ShopItemType, raffleId: null })} disabled={Boolean(editing)}><option value="PROMO_CODE">{t.promo}</option><option value="GIFT_CARD">{t.gift}</option><option value="RAFFLE_TICKET">{t.ticket}</option></select></label>
        <label>{t.name}<input required maxLength={120} value={form.nom} onChange={(event) => setForm({ ...form, nom: event.target.value })} /></label>
        <label>{t.description}<textarea required maxLength={2000} rows={3} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></label>
        <label>{t.image}<input type="url" value={form.imageUrl ?? ""} onChange={(event) => setForm({ ...form, imageUrl: event.target.value })} /></label>
        <label>{t.cost}<input type="number" min={1} step={1} required value={form.costPoints} onChange={(event) => setForm({ ...form, costPoints: Number(event.target.value) })} /></label>
        <label>{t.limit}<select value={form.maxPerUser ?? ""} onChange={(event) => setForm({ ...form, maxPerUser: event.target.value ? Number(event.target.value) : null })}><option value="">{t.unlimited}</option>{[1, 2, 3, 5, 10, 25, 50].map((n) => <option key={n} value={n}>{n}</option>)}</select></label>
        {form.type === "RAFFLE_TICKET" && <label>{t.raffle}<input required value={form.raffleId ?? ""} onChange={(event) => setForm({ ...form, raffleId: event.target.value })} /></label>}
        <label className="skuup-admin-shop-checkbox"><input type="checkbox" checked={form.active} onChange={(event) => setForm({ ...form, active: event.target.checked })} />{t.active}</label>
        {error && <p className="skuup-admin-alert skuup-admin-alert-error" role="alert">{error}</p>}
        <div className="skuup-shop-dialog-actions"><button className="skuup-button skuup-button-outline" type="button" onClick={closeForm} disabled={saving}>{t.cancel}</button><button className="skuup-button skuup-button-primary" type="submit" disabled={saving}>{saving ? "…" : t.save}</button></div>
      </form></section></div>}

      {codesFor && <div className="skuup-shop-dialog-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget && !importing) setCodesFor(null); }}><section className="skuup-shop-dialog skuup-admin-shop-dialog" role="dialog" aria-modal="true" aria-labelledby="shop-code-import-title"><button className="skuup-shop-dialog-close" type="button" onClick={() => !importing && setCodesFor(null)} aria-label={t.cancel} disabled={importing}>×</button><p className="skuup-kicker">{codesFor.nom}</p><h2 id="shop-code-import-title">{t.codes}</h2><form onSubmit={(event) => void importCodes(event)} className="skuup-admin-shop-form"><p>{t.codesHelp}</p><label><span className="sr-only">{t.codes}</span><textarea required rows={8} autoComplete="off" spellCheck={false} value={codesText} onChange={(event) => setCodesText(event.target.value)} /></label>{error && <p className="skuup-admin-alert skuup-admin-alert-error" role="alert">{error}</p>}<div className="skuup-shop-dialog-actions"><button className="skuup-button skuup-button-outline" type="button" onClick={() => !importing && setCodesFor(null)} disabled={importing}>{t.cancel}</button><button className="skuup-button skuup-button-primary" type="submit" disabled={importing}>{importing ? t.importing : t.import}</button></div></form></section></div>}
    </Shell>
  );
}

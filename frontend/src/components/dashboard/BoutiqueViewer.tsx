"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ErreurApi } from "@/lib/api";
import {
  acheterArticleBoutique,
  listerArticlesBoutique,
  listerMesAchatsBoutique,
  revelerCodeAchatBoutique,
  type ShopItem,
  type ShopPurchase,
} from "@/lib/shop";
import { recupererProfil, type Profil } from "@/lib/dashboard";
import { SkkupIcon } from "@/components/ui/SkkupIcon";
import { useLanguage } from "@/components/i18n/LanguageProvider";

const PAGE_SIZE = 24;
const HISTORY_PAGE_SIZE = 10;

const copy = {
  fr: {
    kicker: "Espace personnel", title: "Boutique", description: "Échange tes points gagnés contre des récompenses numériques ou des tickets de tirage.",
    balance: "Solde disponible", points: "points", catalog: "Récompenses disponibles", loadingCatalog: "Chargement du catalogue…", retry: "Réessayer",
    loadError: "La boutique est momentanément indisponible.", authError: "Connecte-toi à nouveau pour accéder à la boutique.", forbidden: "L’accès à cette boutique est refusé.",
    empty: "Aucun article n’est disponible pour le moment.", typeCode: "Code promo", typeGift: "Bon numérique", typeTicket: "Ticket de tirage",
    stock: (count: number) => count === 1 ? "1 disponible" : `${count} disponibles`, soldOut: "Épuisé", limitReached: "Limite d’achat atteinte", noLimit: "Sans limite par compte",
    remaining: (count: number) => `${count} achat${count > 1 ? "s" : ""} restant${count > 1 ? "s" : ""} pour ton compte`, buy: "Échanger mes points", confirmTitle: "Confirmer l’échange", confirmText: (name: string, cost: number) => `Tu vas échanger ${cost} points contre « ${name} ». Le solde sera débité à la validation.`,
    cancel: "Annuler", confirmBuy: "Confirmer l’achat", purchasing: "Validation…", purchaseDone: (name: string) => `Achat confirmé : ${name}. Consulte-le dans Mes achats.`,
    pointsShort: "Ton solde de points est insuffisant.", conflict: "Cet article n’est plus disponible ou ta limite est atteinte.", unavailable: "Cet article n’est pas disponible.",
    tooMany: "Trop de tentatives. Réessaie dans un instant.", serviceError: "Le service est momentanément indisponible. Tu peux réessayer sans risque de double débit.", genericError: "L’achat n’a pas pu être confirmé. Réessaie.",
    history: "Mes achats", loadingHistory: "Chargement de tes achats…", historyError: "Impossible de charger tes achats.", noPurchases: "Tes achats confirmés apparaîtront ici.",
    purchasedOn: "Acheté le", price: "Coût", statusReady: "Code prêt à révéler", statusFulfilled: "Ticket attribué", reveal: "Afficher mon code", revealing: "Chargement du code…", hideCode: "Code attribué", revealError: "Impossible de récupérer ce code pour le moment.",
    previous: "Précédente", next: "Suivante", page: (page: number, total: number) => `Page ${page} sur ${total}`,
    ariaCatalog: "Catalogue de la boutique", ariaHistory: "Historique de mes achats", close: "Fermer la confirmation", imageAlt: (name: string) => `Illustration de ${name}`,
    typeLabel: (type: ShopItem["type"]) => type === "PROMO_CODE" ? "Code promo" : type === "GIFT_CARD" ? "Bon numérique" : "Ticket de tirage",
    stockLabel: (count: number) => count === 1 ? "1 ticket ou code disponible" : `${count} tickets ou codes disponibles`,
  },
  en: {
    kicker: "Personal space", title: "Shop", description: "Exchange the points you earn for digital rewards or draw tickets.",
    balance: "Available balance", points: "points", catalog: "Available rewards", loadingCatalog: "Loading the shop…", retry: "Try again",
    loadError: "The shop is temporarily unavailable.", authError: "Sign in again to access the shop.", forbidden: "Access to this shop is denied.",
    empty: "No items are available right now.", typeCode: "Promo code", typeGift: "Digital gift card", typeTicket: "Draw ticket",
    stock: (count: number) => `${count} available`, soldOut: "Sold out", limitReached: "Purchase limit reached", noLimit: "No per-account limit",
    remaining: (count: number) => `${count} purchase${count === 1 ? "" : "s"} remaining for your account`, buy: "Exchange points", confirmTitle: "Confirm exchange", confirmText: (name: string, cost: number) => `You are exchanging ${cost} points for “${name}”. Your balance will be debited when confirmed.`,
    cancel: "Cancel", confirmBuy: "Confirm purchase", purchasing: "Confirming…", purchaseDone: (name: string) => `Purchase confirmed: ${name}. Find it in My purchases.`,
    pointsShort: "You do not have enough points.", conflict: "This item is no longer available or your account limit was reached.", unavailable: "This item is not available.",
    tooMany: "Too many attempts. Try again in a moment.", serviceError: "The service is temporarily unavailable. You can retry without risking a duplicate debit.", genericError: "The purchase could not be confirmed. Try again.",
    history: "My purchases", loadingHistory: "Loading your purchases…", historyError: "Unable to load your purchases.", noPurchases: "Your confirmed purchases will appear here.",
    purchasedOn: "Purchased", price: "Cost", statusReady: "Code ready to reveal", statusFulfilled: "Ticket assigned", reveal: "Reveal my code", revealing: "Loading code…", hideCode: "Assigned code", revealError: "Unable to retrieve this code right now.",
    previous: "Previous", next: "Next", page: (page: number, total: number) => `Page ${page} of ${total}`,
    ariaCatalog: "Shop catalogue", ariaHistory: "My purchase history", close: "Close purchase confirmation", imageAlt: (name: string) => `Illustration of ${name}`,
    typeLabel: (type: ShopItem["type"]) => type === "PROMO_CODE" ? "Promo code" : type === "GIFT_CARD" ? "Digital gift card" : "Draw ticket",
    stockLabel: (count: number) => `${count} tickets or codes available`,
  },
} as const;
type BoutiqueCopy = (typeof copy)[keyof typeof copy];

function messageErreur(
  erreur: unknown,
  t: BoutiqueCopy,
  kind: "load" | "history" | "purchase" | "reveal",
) {
  if (kind === "reveal") return t.revealError;
  if (!(erreur instanceof ErreurApi)) return kind === "history" ? t.historyError : kind === "purchase" ? t.genericError : t.loadError;
  if (erreur.statut === 401) return t.authError;
  if (erreur.statut === 403) return t.forbidden;
  if (kind === "purchase") {
    if (erreur.statut === 422) return t.pointsShort;
    if (erreur.statut === 409 || erreur.statut === 404) return t.conflict;
    if (erreur.statut === 429) return t.tooMany;
    if (erreur.statut === 503 || erreur.statut === 0) return t.serviceError;
    return t.genericError;
  }
  return kind === "history" ? t.historyError : t.loadError;
}

function typeArticle(type: ShopItem["type"], t: BoutiqueCopy) {
  return type === "PROMO_CODE" ? t.typeCode : type === "GIFT_CARD" ? t.typeGift : t.typeTicket;
}

function cleIdempotence() {
  return globalThis.crypto.randomUUID();
}

export function BoutiqueViewer() {
  const { langue } = useLanguage();
  const t = copy[langue];
  const anglais = langue === "en";
  const [profil, setProfil] = useState<Profil | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [items, setItems] = useState<ShopItem[]>([]);
  const [catalogPage, setCatalogPage] = useState(1);
  const [catalogTotal, setCatalogTotal] = useState(0);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [purchases, setPurchases] = useState<ShopPurchase[]>([]);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [selected, setSelected] = useState<ShopItem | null>(null);
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);
  const [purchaseMessage, setPurchaseMessage] = useState<string | null>(null);
  const [buying, setBuying] = useState(false);
  const [revealingId, setRevealingId] = useState<string | null>(null);
  const [revealErrorId, setRevealErrorId] = useState<string | null>(null);
  const [revealedCodes, setRevealedCodes] = useState<Record<string, string>>({});
  const cancelButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      void recupererProfil()
        .then((value) => { if (active) setProfil(value); })
        .catch((error: unknown) => { if (active) setProfileError(messageErreur(error, t, "load")); });
    });
    return () => { active = false; };
  }, [t]);

  const chargerCatalogue = useCallback(async (page: number) => {
    setCatalogError(null);
    setCatalogLoading(true);
    try {
      const result = await listerArticlesBoutique(page, PAGE_SIZE);
      setItems(result.items);
      setCatalogTotal(result.total);
      setCatalogPage(result.page);
    } catch (error: unknown) {
      setCatalogError(messageErreur(error, t, "load"));
    } finally {
      setCatalogLoading(false);
    }
  }, [t]);

  const chargerHistorique = useCallback(async (page: number) => {
    setHistoryError(null);
    setHistoryLoading(true);
    try {
      const result = await listerMesAchatsBoutique(page, HISTORY_PAGE_SIZE);
      setPurchases(result.purchases);
      setHistoryTotal(result.total);
      setHistoryPage(result.page);
    } catch (error: unknown) {
      setHistoryError(messageErreur(error, t, "history"));
    } finally {
      setHistoryLoading(false);
    }
  }, [t]);

  useEffect(() => { queueMicrotask(() => void chargerCatalogue(catalogPage)); }, [chargerCatalogue, catalogPage]);
  useEffect(() => { queueMicrotask(() => void chargerHistorique(historyPage)); }, [chargerHistorique, historyPage]);

  useEffect(() => {
    if (!selected) return;
    cancelButton.current?.focus();
    const fermerAvecEchap = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !buying) {
        setSelected(null);
        setPendingKey(null);
        setPurchaseError(null);
      }
    };
    document.addEventListener("keydown", fermerAvecEchap);
    return () => document.removeEventListener("keydown", fermerAvecEchap);
  }, [selected, buying]);

  function ouvrirConfirmation(item: ShopItem) {
    setSelected(item);
    setPendingKey(null);
    setPurchaseError(null);
  }

  function fermerConfirmation() {
    if (buying) return;
    setSelected(null);
    setPendingKey(null);
    setPurchaseError(null);
  }

  async function confirmerAchat() {
    if (!selected || buying) return;
    setPurchaseError(null);
    setBuying(true);
    const idempotencyKey = pendingKey ?? cleIdempotence();
    setPendingKey(idempotencyKey);
    try {
      const result = await acheterArticleBoutique(selected.id, idempotencyKey);
      setProfil((current) => current ? { ...current, soldePoints: result.soldePoints } : current);
      setPurchaseMessage(t.purchaseDone(result.purchase.itemName));
      setSelected(null);
      setPendingKey(null);
      await chargerHistorique(historyPage);
      await chargerCatalogue(catalogPage);
    } catch (error: unknown) {
      setPurchaseError(messageErreur(error, t, "purchase"));
    } finally {
      setBuying(false);
    }
  }

  async function reveler(purchaseId: string) {
    if (revealedCodes[purchaseId] !== undefined || revealingId) return;
    setRevealErrorId(null);
    setRevealingId(purchaseId);
    try {
      const result = await revelerCodeAchatBoutique(purchaseId);
      setRevealedCodes((current) => ({ ...current, [purchaseId]: result.code }));
    } catch {
      setRevealErrorId(purchaseId);
    } finally {
      setRevealingId(null);
    }
  }

  const catalogPages = Math.max(1, Math.ceil(catalogTotal / PAGE_SIZE));
  const historyPages = Math.max(1, Math.ceil(historyTotal / HISTORY_PAGE_SIZE));

  return (
    <div className="skuup-viewer-page skuup-shop-page">
      <header className="skuup-dashboard-page-header">
        <p className="skuup-kicker">{t.kicker}</p>
        <h1 className="skuup-dashboard-page-title flex items-center gap-3"><SkkupIcon name="gift" size={38} />{t.title}</h1>
        <p>{t.description}</p>
      </header>

      <section className="skuup-shop-balance" aria-label={t.balance}>
        <span className="skuup-shop-balance-icon"><SkkupIcon name="points" size={28} /></span>
        <div><p className="skuup-kicker">{t.balance}</p>{profileError ? <p role="alert">{profileError}</p> : profil ? <p className="skuup-shop-balance-value"><strong>{profil.soldePoints.toLocaleString(anglais ? "en-US" : "fr-FR")}</strong> {t.points}</p> : <p role="status">{anglais ? "Loading balance…" : "Chargement du solde…"}</p>}</div>
      </section>

      {purchaseMessage && <p role="status" className="skuup-viewer-success">{purchaseMessage}</p>}

      <section className="skuup-shop-catalog" aria-labelledby="shop-catalog-title" aria-label={t.ariaCatalog}>
        <div className="skuup-viewer-section-heading"><div><p className="skuup-kicker">{anglais ? "Browse" : "Catalogue"}</p><h2 id="shop-catalog-title">{t.catalog}</h2></div><span className="skuup-shop-count">{catalogTotal}</span></div>
        {catalogError && <div className="skuup-shop-state skuup-shop-state-error"><p role="alert">{catalogError}</p><button className="skuup-button skuup-button-outline" type="button" onClick={() => void chargerCatalogue(catalogPage)}>{t.retry}</button></div>}
        {catalogLoading ? <p className="skuup-shop-state" role="status">{t.loadingCatalog}</p> : !catalogError && items.length === 0 ? <p className="skuup-shop-state">{t.empty}</p> : null}
        {!catalogLoading && !catalogError && items.length > 0 && (
          <div className="skuup-shop-grid">
            {items.map((item) => {
              const outOfStock = item.type !== "RAFFLE_TICKET" && (item.availableQuantity ?? 0) <= 0;
              const limitReached = item.remainingForUser !== null && item.remainingForUser <= 0;
              const shortOnPoints = profil !== null && profil.soldePoints < item.costPoints;
              return (
                <article className="skuup-shop-card" key={item.id}>
                  {item.imageUrl ? <img className="skuup-shop-image" src={item.imageUrl} alt={t.imageAlt(item.nom)} loading="lazy" referrerPolicy="no-referrer" onError={(event) => { event.currentTarget.hidden = true; }} /> : <div className="skuup-shop-image skuup-shop-image-placeholder" aria-hidden="true"><SkkupIcon name={item.type === "RAFFLE_TICKET" ? "draws" : "gift"} size={34} /></div>}
                  <span className="skuup-shop-type">{typeArticle(item.type, t)}</span>
                  <h3>{item.nom}</h3>
                  <p className="skuup-shop-description">{item.description}</p>
                  <div className="skuup-shop-meta"><strong><SkkupIcon name="points" size={17} />{item.costPoints.toLocaleString(anglais ? "en-US" : "fr-FR")} {t.points}</strong><span>{item.availableQuantity === null ? (item.type === "RAFFLE_TICKET" ? t.typeTicket : t.soldOut) : outOfStock ? t.soldOut : t.stock(item.availableQuantity)}</span></div>
                  {item.maxPerUser === null ? <p className="skuup-shop-limit">{t.noLimit}</p> : item.remainingForUser !== null ? <p className="skuup-shop-limit">{limitReached ? t.limitReached : t.remaining(item.remainingForUser)}</p> : null}
                  <button className="skuup-button skuup-button-primary" type="button" disabled={outOfStock || limitReached || shortOnPoints || !profil} onClick={() => ouvrirConfirmation(item)}>{t.buy}</button>
                  {shortOnPoints && <small className="skuup-shop-hint">{t.pointsShort}</small>}
                </article>
              );
            })}
          </div>
        )}
        {!catalogLoading && !catalogError && catalogTotal > PAGE_SIZE && <div className="skuup-shop-pagination"><button className="skuup-button skuup-button-outline" type="button" disabled={catalogPage <= 1} onClick={() => void chargerCatalogue(catalogPage - 1)}>{t.previous}</button><span>{t.page(catalogPage, catalogPages)}</span><button className="skuup-button skuup-button-outline" type="button" disabled={catalogPage >= catalogPages} onClick={() => void chargerCatalogue(catalogPage + 1)}>{t.next}</button></div>}
      </section>

      <section className="skuup-shop-history" aria-labelledby="shop-history-title" aria-label={t.ariaHistory}>
        <div className="skuup-viewer-section-heading"><div><p className="skuup-kicker">{anglais ? "Your account" : "Ton compte"}</p><h2 id="shop-history-title">{t.history}</h2></div><span className="skuup-shop-count">{historyTotal}</span></div>
        {historyLoading ? <p className="skuup-shop-state" role="status">{t.loadingHistory}</p> : historyError ? <div className="skuup-shop-state skuup-shop-state-error"><p role="alert">{historyError}</p><button className="skuup-button skuup-button-outline" type="button" onClick={() => void chargerHistorique(historyPage)}>{t.retry}</button></div> : purchases.length === 0 ? <p className="skuup-shop-state">{t.noPurchases}</p> : (
          <div className="skuup-shop-purchases">
            {purchases.map((purchase) => (
              <article className="skuup-shop-purchase" key={purchase.id}>
                <div className="skuup-shop-purchase-main"><span className="skuup-shop-type">{typeArticle(purchase.itemType, t)}</span><h3>{purchase.itemName}</h3><p>{t.purchasedOn} {new Date(purchase.createdAt).toLocaleDateString(anglais ? "en-US" : "fr-FR")}</p></div>
                <div className="skuup-shop-purchase-cost"><small>{t.price}</small><strong>{purchase.costPoints.toLocaleString(anglais ? "en-US" : "fr-FR")} {t.points}</strong></div>
                <div className="skuup-shop-purchase-delivery">
                  {purchase.status === "READY_TO_REVEAL" ? (
                    revealedCodes[purchase.id] !== undefined ? <div className="skuup-shop-revealed-code"><small>{t.hideCode}</small><code>{revealedCodes[purchase.id]}</code></div> : <><span className="skuup-shop-status">{t.statusReady}</span><button className="skuup-button skuup-button-outline" type="button" disabled={revealingId !== null} onClick={() => void reveler(purchase.id)}>{revealingId === purchase.id ? t.revealing : t.reveal}</button>{revealErrorId === purchase.id && <small role="alert">{t.revealError}</small>}</>
                  ) : <span className="skuup-shop-status">{t.statusFulfilled}</span>}
                </div>
              </article>
            ))}
          </div>
        )}
        {!historyLoading && !historyError && historyTotal > HISTORY_PAGE_SIZE && <div className="skuup-shop-pagination"><button className="skuup-button skuup-button-outline" type="button" disabled={historyPage <= 1} onClick={() => void chargerHistorique(historyPage - 1)}>{t.previous}</button><span>{t.page(historyPage, historyPages)}</span><button className="skuup-button skuup-button-outline" type="button" disabled={historyPage >= historyPages} onClick={() => void chargerHistorique(historyPage + 1)}>{t.next}</button></div>}
      </section>

      {selected && (
        <div className="skuup-shop-dialog-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) fermerConfirmation(); }}>
          <section className="skuup-shop-dialog" role="dialog" aria-modal="true" aria-labelledby="shop-confirm-title" aria-describedby="shop-confirm-description">
            <button className="skuup-shop-dialog-close" type="button" aria-label={t.close} onClick={fermerConfirmation} disabled={buying}>×</button>
            <p className="skuup-kicker">{t.typeLabel(selected.type)}</p>
            <h2 id="shop-confirm-title">{t.confirmTitle}</h2>
            <p id="shop-confirm-description">{t.confirmText(selected.nom, selected.costPoints)}</p>
            {purchaseError && <p className="skuup-viewer-error" role="alert">{purchaseError}</p>}
            <div className="skuup-shop-dialog-actions"><button ref={cancelButton} className="skuup-button skuup-button-outline" type="button" onClick={fermerConfirmation} disabled={buying}>{t.cancel}</button><button className="skuup-button skuup-button-primary" type="button" onClick={() => void confirmerAchat()} disabled={buying}>{buying ? t.purchasing : t.confirmBuy}</button></div>
          </section>
        </div>
      )}
    </div>
  );
}

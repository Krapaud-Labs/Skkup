import { fetchAuthentifie } from "./auth";

export type ShopItemType = "PROMO_CODE" | "GIFT_CARD" | "RAFFLE_TICKET";
export type ShopPurchaseStatus = "READY_TO_REVEAL" | "FULFILLED";

/** Contrat commun catalogue; aucun code utilisable n'est exposé dans un item. */
export interface ShopItem {
  id: string;
  type: ShopItemType;
  nom: string;
  description: string;
  imageUrl: string | null;
  costPoints: number;
  maxPerUser: number | null;
  raffleId: string | null;
  availableQuantity: number | null;
  remainingForUser: number | null;
}

export interface AdminShopItem extends Omit<ShopItem, "availableQuantity" | "remainingForUser"> {
  active: boolean;
  availableCodeCount: number;
  /** Admin catalog responses may omit viewer-only stock and per-user fields. */
  availableQuantity?: number | null;
  remainingForUser?: number | null;
}

export interface PageItems<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

export interface ShopPurchase {
  id: string;
  itemType: ShopItemType;
  itemName: string;
  costPoints: number;
  status: ShopPurchaseStatus;
  createdAt: string;
  raffleTicketId?: string | null;
}

export interface PagePurchases {
  purchases: ShopPurchase[];
  total: number;
  page: number;
  limit: number;
}

/** Métadonnées uniquement. Ce modèle n'a volontairement aucun champ de code. */
export interface AdminShopPurchase extends ShopPurchase {
  userId: string;
  pseudo: string;
}

export interface AdminShopPurchasePage {
  items: AdminShopPurchase[];
  total: number;
  page: number;
  limit: number;
}

export interface ShopItemInput {
  type: ShopItemType;
  nom: string;
  description: string;
  imageUrl?: string | null;
  costPoints: number;
  active: boolean;
  maxPerUser: number | null;
  raffleId: string | null;
}

export interface ShopPurchaseResponse {
  purchase: ShopPurchase;
  costPoints: number;
  soldePoints: number;
}

export interface ImportShopCodesResponse {
  accepted: number;
  rejected: number;
}

function query(page: number, limit: number) {
  return `page=${page}&limit=${limit}`;
}

export function listerArticlesBoutique(page = 1, limit = 24) {
  return fetchAuthentifie<PageItems<ShopItem>>(
    `/shop/items?${query(page, limit)}`,
  );
}

export function acheterArticleBoutique(itemId: string, idempotencyKey: string) {
  return fetchAuthentifie<ShopPurchaseResponse>("/shop/purchase", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ itemId, idempotencyKey }),
  });
}

export function listerMesAchatsBoutique(page = 1, limit = 10) {
  return fetchAuthentifie<PagePurchases>(
    `/me/shop/purchases?${query(page, limit)}`,
  );
}

export function revelerCodeAchatBoutique(purchaseId: string) {
  return fetchAuthentifie<{ code: string }>(
    `/me/shop/purchases/${encodeURIComponent(purchaseId)}/code`,
    { cache: "no-store" },
  );
}

export function listerArticlesAdmin(page = 1, limit = 50) {
  return fetchAuthentifie<{ items: AdminShopItem[]; total: number; page: number; limit: number }>(
    `/admin/shop/items?${query(page, limit)}`,
  );
}

export function creerArticleAdmin(input: ShopItemInput) {
  return fetchAuthentifie<AdminShopItem>("/admin/shop/items", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export function modifierArticleAdmin(id: string, input: Partial<ShopItemInput>) {
  return fetchAuthentifie<AdminShopItem>(
    `/admin/shop/items/${encodeURIComponent(id)}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    },
  );
}

export function desactiverArticleAdmin(id: string) {
  return fetchAuthentifie<void>(
    `/admin/shop/items/${encodeURIComponent(id)}`,
    { method: "DELETE" },
  );
}

export function importerCodesAdmin(itemId: string, codes: string[]) {
  return fetchAuthentifie<ImportShopCodesResponse>(
    `/admin/shop/items/${encodeURIComponent(itemId)}/codes`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ codes }),
    },
  );
}

export function listerAchatsAdmin(page = 1, limit = 25) {
  return fetchAuthentifie<AdminShopPurchasePage>(
    `/admin/shop/purchases?${query(page, limit)}`,
  );
}

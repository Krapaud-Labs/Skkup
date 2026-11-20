import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, expect, test, vi } from "vitest";

const api = vi.hoisted(() => ({
  buy: vi.fn(), reveal: vi.fn(), catalog: vi.fn(),
}));
const session = vi.hoisted(() => ({
  langue: "fr" as "fr" | "en",
  profil: vi.fn(),
  history: vi.fn(),
}));

vi.mock("@/components/i18n/LanguageProvider", () => ({ useLanguage: () => ({ langue: session.langue }) }));
vi.mock("@/components/ui/SkkupIcon", () => ({ SkkupIcon: () => <span aria-hidden="true" /> }));
vi.mock("@/lib/dashboard", () => ({ recupererProfil: session.profil }));
vi.mock("@/lib/shop", () => ({
  acheterArticleBoutique: api.buy,
  listerArticlesBoutique: api.catalog,
  listerMesAchatsBoutique: session.history,
  revelerCodeAchatBoutique: api.reveal,
}));

import { BoutiqueViewer } from "./BoutiqueViewer";

beforeEach(() => {
  vi.resetAllMocks();
  session.langue = "fr";
  session.profil.mockResolvedValue({ soldePoints: 500, role: "VIEWER" });
  session.history.mockResolvedValue({ purchases: [{ id: "purchase-1", itemType: "PROMO_CODE", itemName: "Code test", costPoints: 100, status: "READY_TO_REVEAL", createdAt: "2026-11-14T10:00:00.000Z" }], total: 1, page: 1, limit: 10 });
});

test("attend le profil avant de charger catalogue et historique", async () => {
  let resolveProfile!: (profile: { soldePoints: number; role: "VIEWER" }) => void;
  session.profil.mockReturnValue(new Promise((resolve) => { resolveProfile = resolve; }));
  api.catalog.mockResolvedValue({ items: [], total: 0, page: 1, limit: 24 });
  render(<BoutiqueViewer />);

  await waitFor(() => expect(session.profil).toHaveBeenCalledOnce());
  expect(api.catalog).not.toHaveBeenCalled();
  expect(session.history).not.toHaveBeenCalled();

  resolveProfile({ soldePoints: 500, role: "VIEWER" });
  await waitFor(() => {
    expect(api.catalog).toHaveBeenCalledOnce();
    expect(session.history).toHaveBeenCalledOnce();
  });
});

test("un Admin reçoit le lien de gestion bilingue sans appeler les endpoints boutique Viewer", async () => {
  session.profil.mockResolvedValue({ soldePoints: 500, role: "ADMIN" });
  const { rerender } = render(<BoutiqueViewer />);

  expect((await screen.findByRole("link", { name: "Ouvrir la boutique Admin" })).getAttribute("href")).toBe("/admin/shop");
  expect(screen.getByText("La boutique publique est réservée aux membres. Accède à la gestion de la boutique.")).toBeTruthy();
  session.langue = "en";
  rerender(<BoutiqueViewer />);
  expect(screen.getByRole("link", { name: "Open Admin shop" }).getAttribute("href")).toBe("/admin/shop");
  expect(screen.getByText("The public shop is for members. Go to shop management.")).toBeTruthy();
  expect(api.catalog).not.toHaveBeenCalled();
  expect(session.history).not.toHaveBeenCalled();
});

test("un profil indisponible ou sans rôle reste bloqué sans requêtes Viewer et peut être rechargé", async () => {
  session.profil
    .mockRejectedValueOnce(new Error("Profil indisponible"))
    .mockResolvedValueOnce({ soldePoints: 500 });
  render(<BoutiqueViewer />);

  expect((await screen.findByRole("alert")).textContent).toContain("Impossible de vérifier ton profil.");
  fireEvent.click(screen.getByRole("button", { name: "Réessayer" }));
  await waitFor(() => expect(session.profil).toHaveBeenCalledTimes(2));
  expect((await screen.findByRole("alert")).textContent).toContain("Impossible de vérifier ton profil.");
  expect(api.catalog).not.toHaveBeenCalled();
  expect(session.history).not.toHaveBeenCalled();
});

test("confirme un achat puis révèle le code dans Mes achats", async () => {
  api.catalog.mockResolvedValue({ items: [{ id: "item-1", type: "PROMO_CODE", nom: "Code test", description: "Récompense numérique", imageUrl: null, costPoints: 100, maxPerUser: 1, raffleId: null, availableQuantity: 2, remainingForUser: 1 }], total: 1, page: 1, limit: 24 });
  api.buy.mockResolvedValue({ purchase: { id: "purchase-1", itemName: "Code test" }, soldePoints: 400 });
  api.reveal.mockResolvedValue({ code: "SECRET-ONLY-FOR-BUYER" });
  vi.stubGlobal("crypto", { randomUUID: () => "idempotency-1" });
  render(<BoutiqueViewer />);

  fireEvent.click(await screen.findByRole("button", { name: "Échanger mes points" }));
  fireEvent.click(screen.getByRole("button", { name: "Confirmer l’achat" }));
  await waitFor(() => expect(api.buy).toHaveBeenCalledWith("item-1", "idempotency-1"));
  expect((await screen.findByRole("status")).textContent).toMatch(/Achat confirmé/);

  fireEvent.click(screen.getByRole("button", { name: "Afficher mon code" }));
  expect(await screen.findByText("SECRET-ONLY-FOR-BUYER")).toBeTruthy();
  expect(api.reveal).toHaveBeenCalledWith("purchase-1");
  vi.unstubAllGlobals();
});

test("un ticket de tirage sans stock numérique dérivé reste achetable", async () => {
  api.catalog.mockResolvedValue({ items: [{ id: "ticket-1", type: "RAFFLE_TICKET", nom: "Ticket du tirage", description: "Tirage ouvert", imageUrl: null, costPoints: 80, maxPerUser: 2, raffleId: "raffle-1", availableQuantity: null, remainingForUser: 2 }], total: 1, page: 1, limit: 24 });
  render(<BoutiqueViewer />);

  const buyButton = await screen.findByRole("button", { name: "Échanger mes points" });
  expect((buyButton as HTMLButtonElement).disabled).toBe(false);
  fireEvent.click(buyButton);
  expect(await screen.findByRole("dialog")).toBeTruthy();
  expect(screen.getAllByText("Ticket de tirage").length).toBeGreaterThan(0);
});

test("une offre numérique épuisée est désactivée et signalée", async () => {
  api.catalog.mockResolvedValue({ items: [{ id: "item-empty", type: "GIFT_CARD", nom: "Bon épuisé", description: "", imageUrl: null, costPoints: 80, maxPerUser: 2, raffleId: null, availableQuantity: 0, remainingForUser: 2 }], total: 1, page: 1, limit: 24 });
  render(<BoutiqueViewer />);

  const buyButton = await screen.findByRole("button", { name: "Échanger mes points" });
  expect((buyButton as HTMLButtonElement).disabled).toBe(true);
  expect(screen.getByText("Épuisé")).toBeTruthy();
});

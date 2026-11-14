import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { expect, test, vi } from "vitest";

const api = vi.hoisted(() => ({ importCodes: vi.fn() }));
vi.mock("@/components/i18n/LanguageProvider", () => ({ useLanguage: () => ({ langue: "fr" }) }));
vi.mock("@/components/admin/AdminSectionPage", () => ({ Shell: ({ children }: { children: React.ReactNode }) => <main>{children}</main> }));
vi.mock("@/components/admin/AdminPageHeader", () => ({ AdminPageHeader: ({ title }: { title: string }) => <h1>{title}</h1> }));
vi.mock("@/lib/shop", () => ({
  creerArticleAdmin: vi.fn(), desactiverArticleAdmin: vi.fn(), modifierArticleAdmin: vi.fn(),
  importerCodesAdmin: api.importCodes,
  listerArticlesAdmin: vi.fn(async () => ({ items: [{ id: "item-1", type: "PROMO_CODE", nom: "Code test", description: "", imageUrl: null, costPoints: 100, maxPerUser: 1, raffleId: null, active: true, availableCodeCount: 2 }], total: 1, page: 1, limit: 50 })),
  listerAchatsAdmin: vi.fn(async () => ({ items: [], total: 0, page: 1, limit: 25 })),
}));

import { ShopAdminV3 } from "./ShopAdminV3";

test("importe des codes et ne garde pas leur valeur dans l’interface Admin", async () => {
  api.importCodes.mockResolvedValue({ accepted: 1, rejected: 0 });
  render(<ShopAdminV3 />);
  fireEvent.click(await screen.findByRole("button", { name: "Importer des codes" }));
  fireEvent.change(screen.getByRole("textbox"), { target: { value: "SECRET-ADMIN-CODE" } });
  fireEvent.click(screen.getByRole("button", { name: "Importer" }));

  await waitFor(() => expect(api.importCodes).toHaveBeenCalledWith("item-1", ["SECRET-ADMIN-CODE"]));
  await screen.findByRole("status");
  expect(document.body.textContent).not.toContain("SECRET-ADMIN-CODE");
  expect(screen.getByRole("status").textContent).toContain("1 accepté");
});

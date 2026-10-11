import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  list: vi.fn(),
  language: { value: "fr" as "fr" | "en" },
  ApiError: class extends Error {
    statut: number;
    constructor(message: string, statut: number) {
      super(message);
      this.statut = statut;
    }
  },
}));
vi.mock("@/lib/admin", () => ({ listerAuditContenu: mocks.list }));
vi.mock("@/lib/api", () => ({ ErreurApi: mocks.ApiError }));
vi.mock("@/components/i18n/LanguageProvider", () => ({
  useLanguage: () => ({ langue: mocks.language.value }),
  traductions: { fr: { logout: "Déconnexion" }, en: { logout: "Log out" } },
}));
vi.mock("next/navigation", () => ({
  usePathname: () => "/admin/audit",
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

import { AuditAdminV3 } from "./AuditAdminV3";

const event = {
  id: "audit-1",
  action: "USER_STATUS_UPDATED",
  entityType: "USER",
  entityId: "user-1",
  actorId: "admin-1",
  createdAt: "2026-10-01T08:00:00.000Z",
  metadata: { active: false },
};
beforeEach(() => {
  vi.clearAllMocks();
  mocks.language.value = "fr";
  mocks.list.mockResolvedValue([event]);
});

test("localise le journal et le détail en anglais avec filtres et pagination accessibles", async () => {
  const user = userEvent.setup();
  mocks.language.value = "en";
  render(<AuditAdminV3 />);
  expect((await screen.findAllByRole("heading", { name: "Audit log" })).length).toBeGreaterThan(0);
  expect(screen.getByRole("combobox", { name: "Action" })).toBeTruthy();
  expect(screen.getByRole("textbox", { name: "Actor" })).toBeTruthy();
  expect(
    screen.getByRole("navigation", { name: "Audit log pagination" }),
  ).toBeTruthy();
  await user.click(screen.getByRole("button", { name: /User status updated/ }));
  expect(
    screen.getByRole("region", { name: "Audit event detail" }),
  ).toBeTruthy();
  expect(screen.getByText("VERIFIED")).toBeTruthy();
  expect(screen.getByText("Contract metadata")).toBeTruthy();
});

test("affiche une erreur 403 localisée au chargement", async () => {
  mocks.language.value = "en";
  mocks.list.mockRejectedValueOnce(new mocks.ApiError("forbidden", 403));
  render(<AuditAdminV3 />);
  expect((await screen.findByRole("alert")).textContent).toContain(
    "restricted to authorised administrators",
  );
});

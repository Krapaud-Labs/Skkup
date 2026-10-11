import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  lister: vi.fn(),
  detail: vi.fn(),
  modifier: vi.fn(),
  language: { value: "fr" as "fr" | "en" },
  ApiError: class extends Error {
    statut: number;
    constructor(message: string, statut: number) {
      super(message);
      this.statut = statut;
    }
  },
}));

vi.mock("@/lib/admin", () => ({
  listerSignalements: mocks.lister,
  detailSignalement: mocks.detail,
  modifierSignalement: mocks.modifier,
}));
vi.mock("@/lib/api", () => ({ ErreurApi: mocks.ApiError }));
vi.mock("@/components/i18n/LanguageProvider", () => ({
  useLanguage: () => ({ langue: mocks.language.value }),
  traductions: { fr: { logout: "Déconnexion" }, en: { logout: "Log out" } },
}));
vi.mock("next/navigation", () => ({
  usePathname: () => "/admin/moderation",
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

import { ModerationAdminV3 } from "./ModerationAdminV3";

const report = {
  id: "report-1",
  type: "fraude",
  statut: "OUVERTE",
  createdAt: "2026-10-01T08:00:00.000Z",
  user: { id: "user-1", pseudo: "Alice", email: "alice@example.com" },
};
const detail = {
  ...report,
  details: "Preuve contractuelle",
  audit: [],
  watchSession: null,
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.language.value = "fr";
  mocks.lister.mockResolvedValue([report]);
  mocks.detail.mockResolvedValue(detail);
  mocks.modifier.mockResolvedValue({ ...report, statut: "EXAMINEE" });
});

test("localise la liste, relie le master/detail et conserve les filtres", async () => {
  mocks.language.value = "en";
  render(<ModerationAdminV3 />);

  expect(await screen.findByRole("heading", { name: "Reports" })).toBeTruthy();
  const tab = screen.getByRole("tab", { name: /Reports/ });
  expect(tab.id).toBe("moderation-tab-reports");
  expect(tab.getAttribute("aria-controls")).toBe("moderation-workspace");
  expect(screen.getByRole("tabpanel").getAttribute("aria-labelledby")).toBe(
    tab.id,
  );
  expect(screen.getByRole("textbox", { name: "Search a report" })).toBeTruthy();
  expect(screen.getByText("Critical")).toBeTruthy();
  expect(screen.getAllByText("Pending").length).toBeGreaterThan(0);
});

test("affiche le détail et signale un refus 403 sur la mutation", async () => {
  const user = userEvent.setup();
  mocks.modifier.mockRejectedValueOnce(new mocks.ApiError("forbidden", 403));
  render(<ModerationAdminV3 />);

  await user.click(await screen.findByRole("button", { name: /Alice/ }));
  expect(
    await screen.findByRole("heading", { name: "Détails du signalement" }),
  ).toBeTruthy();
  await user.click(screen.getByRole("button", { name: "Marquer examinée" }));
  expect((await screen.findByRole("alert")).textContent).toContain(
    "réservée aux administrateurs",
  );
  await waitFor(() =>
    expect(mocks.modifier).toHaveBeenCalledWith("report-1", "EXAMINEE", ""),
  );
});

test("localise les libellés du détail et de la pagination en anglais", async () => {
  const user = userEvent.setup();
  mocks.language.value = "en";
  mocks.detail.mockResolvedValue({
    ...detail,
    watchSession: {
      id: "session-1",
      platform: "web",
      streamExternalId: "stream-1",
    },
  });
  render(<ModerationAdminV3 />);

  expect(await screen.findByText("View")).toBeTruthy();
  expect(screen.getByText(/1 of 1/)).toBeTruthy();
  await user.click(screen.getByRole("button", { name: /Alice/ }));
  expect(
    await screen.findByRole("heading", { name: "Report details" }),
  ).toBeTruthy();
  for (const label of [
    "User",
    "Email",
    "Reason",
    "Priority",
    "Received on",
    "Session",
    "Platform",
    "Stream",
  ]) {
    expect(screen.getAllByText(label).length).toBeGreaterThan(0);
  }
});

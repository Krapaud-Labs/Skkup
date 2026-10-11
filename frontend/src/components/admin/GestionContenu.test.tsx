import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, test, vi } from "vitest";

const { listerAuditContenu, listerContenus, publierContenu, useLanguage, ApiError } = vi.hoisted(() => ({
  listerAuditContenu: vi.fn(),
  listerContenus: vi.fn(),
  publierContenu: vi.fn(),
  useLanguage: vi.fn(),
  ApiError: class extends Error { statut: number; constructor(message: string, statut: number) { super(message); this.statut = statut; } },
}));

vi.mock("@/lib/admin", () => ({
  listerContenus,
  listerAuditContenu,
  creerContenu: vi.fn(),
  depublierContenu: vi.fn(),
  listerVersionsContenu: vi.fn(),
  modifierContenu: vi.fn(),
  publierContenu,
  restaurerVersionContenu: vi.fn(),
}));
vi.mock("@/components/i18n/LanguageProvider", () => ({
  LanguageProvider: ({ children }: { children: unknown }) => children,
  useLanguage,
  traductions: { fr: { logout: "Déconnexion" }, en: { logout: "Log out" } },
}));
vi.mock("@/lib/api", () => ({ ErreurApi: ApiError }));
vi.mock("next/navigation", () => ({
  usePathname: () => "/admin/content",
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

import { GestionContenu } from "./GestionContenu";
import { LanguageProvider } from "@/components/i18n/LanguageProvider";

beforeEach(() => {
  vi.clearAllMocks();
  useLanguage.mockReturnValue({ langue: "fr" });
  listerContenus.mockResolvedValue([]);
  listerAuditContenu.mockResolvedValue([]);
  publierContenu.mockResolvedValue({ id: "content-1", slug: "faq", type: "FAQ", locale: "fr", status: "PUBLISHED", version: 1, data: { title: "FAQ", intro: "Intro", faq: [{ question: "Q", answer: "A" }] } });
});

describe("GestionContenu", () => {
  test("ouvre un bloc dans une modale d’édition", async () => {
    const utilisateur = userEvent.setup();
    render(<GestionContenu />);

    expect(
      await screen.findByRole("heading", { name: "Pages éditoriales" }),
    ).toBeDefined();
    expect(screen.queryByText(/Données JSON|JSON data/)).toBeNull();
    await utilisateur.click(
      screen.getAllByRole("button", { name: /Modifier le bloc/ })[0],
    );
    expect(screen.getByRole("dialog")).toBeDefined();
    expect(
      screen.getByRole("button", { name: "Appliquer les changements" }),
    ).toBeDefined();
    const fermeture = screen.getByRole("button", { name: "Fermer" });
    const dialogue = screen.getByRole("dialog");
    await waitFor(() => expect(document.activeElement).toBe(fermeture));
    await utilisateur.tab();
    expect(document.activeElement).toBe(within(dialogue).getByRole("textbox"));
    await utilisateur.tab();
    expect(document.activeElement).toBe(
      screen.getByRole("button", { name: "Annuler" }),
    );
    await utilisateur.tab();
    expect(document.activeElement).toBe(
      screen.getByRole("button", { name: "Appliquer les changements" }),
    );
    await utilisateur.tab();
    expect(document.activeElement).toBe(fermeture);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  test("localise la gestion de contenu en anglais", async () => {
    useLanguage.mockReturnValue({ langue: "en" });
    render(
      <LanguageProvider>
        <GestionContenu />
      </LanguageProvider>,
    );

    expect(
      await screen.findByRole("heading", { name: "Editorial pages" }),
    ).toBeDefined();
    expect(screen.getAllByLabelText("Language").length).toBeGreaterThanOrEqual(
      1,
    );
  });

  test("relie les filtres au panneau de bibliothèque", async () => {
    useLanguage.mockReturnValue({ langue: "en" });
    listerContenus.mockResolvedValueOnce([{
      id: "content-1", slug: "faq", type: "FAQ", locale: "en", status: "PUBLISHED", version: 1,
      data: { title: "FAQ", intro: "Intro", faq: [{ question: "Q", answer: "A" }] },
    }]);
    render(<GestionContenu />);
    const tab = await screen.findByRole("tab", { name: "Published (1)" });
    expect(tab.id).toBe("content-tab-published");
    expect(tab.getAttribute("aria-controls")).toBe("content-library-panel");
    expect(screen.getByRole("tabpanel").getAttribute("aria-labelledby")).toBe("content-tab-all");
    expect(screen.getAllByText("Published").length).toBeGreaterThan(0);
  });

  test("signale une interdiction 403 pendant la publication", async () => {
    const utilisateur = userEvent.setup();
    publierContenu.mockRejectedValueOnce(new ApiError("forbidden", 403));
    listerContenus.mockResolvedValue([{
      id: "content-1", slug: "faq", type: "FAQ", locale: "fr", status: "DRAFT", version: 1,
      data: { title: "FAQ", intro: "Intro", faq: [{ question: "Q", answer: "A" }] },
    }]);
    render(<GestionContenu />);
    await utilisateur.click(await screen.findByRole("button", { name: "Publier" }));
    expect((await screen.findByRole("alert")).textContent).toContain("réservée aux administrateurs");
  });
});

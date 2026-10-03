import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, test, vi } from "vitest";

const { listerAuditContenu, listerContenus, useLanguage } = vi.hoisted(() => ({ listerAuditContenu: vi.fn(), listerContenus: vi.fn(), useLanguage: vi.fn() }));

vi.mock("@/lib/admin", () => ({
  listerContenus,
  listerAuditContenu,
  creerContenu: vi.fn(),
  depublierContenu: vi.fn(),
  listerVersionsContenu: vi.fn(),
  modifierContenu: vi.fn(),
  publierContenu: vi.fn(),
  restaurerVersionContenu: vi.fn(),
}));
vi.mock("@/components/i18n/LanguageProvider", () => ({
  LanguageProvider: ({ children }: { children: unknown }) => children,
  useLanguage,
}));

import { GestionContenu } from "./GestionContenu";
import { LanguageProvider } from "@/components/i18n/LanguageProvider";

beforeEach(() => {
  vi.clearAllMocks();
  useLanguage.mockReturnValue({ langue: "fr" });
  listerContenus.mockResolvedValue([]);
  listerAuditContenu.mockResolvedValue([]);
});

describe("GestionContenu", () => {
  test("ouvre un bloc dans une modale d’édition", async () => {
    const utilisateur = userEvent.setup();
    render(<GestionContenu />);

    expect(await screen.findByRole("heading", { name: "Pages éditoriales" })).toBeDefined();
    expect(screen.queryByText(/Données JSON|JSON data/)).toBeNull();
    await utilisateur.click(screen.getAllByRole("button", { name: /Modifier le bloc/ })[0]);
    expect(screen.getByRole("dialog")).toBeDefined();
    expect(screen.getByRole("button", { name: "Appliquer les changements" })).toBeDefined();
    await waitFor(() => expect(document.activeElement).toBe(screen.getByRole("button", { name: "Fermer" })));
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  test("localise la gestion de contenu en anglais", async () => {
    useLanguage.mockReturnValue({ langue: "en" });
    render(<LanguageProvider><GestionContenu /></LanguageProvider>);

    expect(await screen.findByRole("heading", { name: "Editorial pages" })).toBeDefined();
    expect(screen.getByLabelText("Language")).toBeDefined();
  });
});

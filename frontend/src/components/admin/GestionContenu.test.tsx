import { render, screen } from "@testing-library/react";
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
  test("affiche et masque la prévisualisation du brouillon JSON", async () => {
    const utilisateur = userEvent.setup();
    render(<GestionContenu />);

    expect(await screen.findByRole("heading", { name: "Gestion de contenu" })).toBeDefined();
    expect(screen.queryByRole("complementary", { name: "Prévisualisation du contenu" })).toBeNull();
    await utilisateur.click(screen.getByRole("button", { name: "Prévisualiser" }));
    expect(screen.getByRole("complementary", { name: "Prévisualisation du contenu" })).toBeDefined();
    await utilisateur.click(screen.getByRole("button", { name: "Masquer la prévisualisation" }));
    expect(screen.queryByRole("complementary", { name: "Prévisualisation du contenu" })).toBeNull();
  });

  test("localise la gestion de contenu en anglais", async () => {
    useLanguage.mockReturnValue({ langue: "en" });
    render(<LanguageProvider><GestionContenu /></LanguageProvider>);

    expect(await screen.findByRole("heading", { name: "Content management" })).toBeDefined();
    expect(screen.getByRole("button", { name: "Preview" })).toBeDefined();
    expect(screen.getByLabelText("Language")).toBeDefined();
  });
});

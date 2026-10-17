import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { ErreurApi } from "@/lib/api";
import { HistoriquePointsViewer } from "./HistoriquePointsViewer";

vi.mock("@/components/i18n/LanguageProvider", () => ({
  useLanguage: () => ({ langue: "fr" }),
}));

vi.mock("@/lib/dashboard", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/lib/dashboard")>();
  return {
    ...original,
    recupererHistoriquePoints: vi.fn(),
    recupererResumeDashboard: vi.fn(),
    sessionsDepuisResume: vi.fn(),
  };
});

const {
  recupererHistoriquePoints,
  recupererResumeDashboard,
  sessionsDepuisResume,
} = await import("@/lib/dashboard");

const historique = {
  transactions: [
    {
      id: "tx-1",
      userId: "user-1",
      type: "VISITE_QUOTIDIENNE" as const,
      montant: 5,
      createdAt: "2026-10-10T10:00:00.000Z",
    },
    {
      id: "tx-2",
      userId: "user-1",
      type: "CARTE_A_GRATTER" as const,
      montant: 20,
      createdAt: "2026-10-11T10:00:00.000Z",
    },
  ],
  page: 1,
  limit: 10,
  total: 12,
  totalPages: 2,
};

const resume = {
  profil: {
    id: "user-1",
    pseudo: "Viewer",
    soldePoints: 25,
    streakActuel: 2,
    streakMax: 4,
    derniereVisiteAt: "2026-10-11T10:00:00.000Z",
  },
  visionnage: { secondesValidees: 0, sessions: 0 },
  activite: { ticketsTirage: 0, cartesAGratterDisponibles: 0 },
  transactionsRecentes: [],
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(recupererHistoriquePoints).mockResolvedValue(historique);
  vi.mocked(recupererResumeDashboard).mockResolvedValue(resume);
  vi.mocked(sessionsDepuisResume).mockReturnValue([]);
});

describe("HistoriquePointsViewer", () => {
  test("affiche les mouvements, le détail sélectionné et les sessions vides", async () => {
    render(<HistoriquePointsViewer />);

    expect(await screen.findByRole("heading", { name: "Historique des points" })).toBeDefined();
    expect(screen.getByRole("row", { name: /Visite quotidienne/ })).toHaveTextContent("+5 pts");
    expect(screen.getByRole("row", { name: /Carte à gratter/ })).toHaveTextContent("+20 pts");
    expect(screen.getByRole("heading", { name: "Visite quotidienne" })).toBeDefined();
    expect(screen.getByText(/Aucune session de visionnage/)).toBeDefined();
    expect(screen.getByRole("button", { name: "Précédente" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Suivante" })).toBeEnabled();
  });

  test("filtre les mouvements par type et met à jour le total affiché", async () => {
    const user = userEvent.setup();
    render(<HistoriquePointsViewer />);
    await screen.findByRole("row", { name: /Visite quotidienne/ });

    await user.selectOptions(screen.getByLabelText("Type"), "CARTE_A_GRATTER");

    expect(screen.queryByRole("row", { name: /Visite quotidienne/ })).toBeNull();
    expect(screen.getByRole("row", { name: /Carte à gratter/ })).toHaveTextContent("+20 pts");
    expect(screen.getByText("+20 pts", { selector: "strong" })).toBeDefined();
  });

  test("exporte uniquement les mouvements filtrés en CSV", async () => {
    const user = userEvent.setup();
    const createObjectURL = vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:test");
    const revokeObjectURL = vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => undefined);
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined);

    render(<HistoriquePointsViewer />);
    await screen.findByRole("row", { name: /Visite quotidienne/ });
    await user.selectOptions(screen.getByLabelText("Type"), "CARTE_A_GRATTER");
    await user.click(screen.getByRole("button", { name: "Exporter CSV" }));

    expect(createObjectURL).toHaveBeenCalledOnce();
    const blob = createObjectURL.mock.calls[0]?.[0];
    expect(blob).toBeInstanceOf(Blob);
    expect(await (blob as Blob).text()).toContain("CARTE_A_GRATTER");
    expect(await (blob as Blob).text()).not.toContain("VISITE_QUOTIDIENNE");
    expect(click).toHaveBeenCalledOnce();
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:test");
    expect(document.querySelector('a[download="skkup-historique-points.csv"]')).toBeNull();
  });

  test("charge la page suivante avec la pagination", async () => {
    const user = userEvent.setup();
    vi.mocked(recupererHistoriquePoints)
      .mockResolvedValueOnce(historique)
      .mockResolvedValueOnce({ ...historique, page: 2, transactions: [] });

    render(<HistoriquePointsViewer />);
    await screen.findByRole("row", { name: /Visite quotidienne/ });
    await user.click(screen.getByRole("button", { name: "Suivante" }));

    await waitFor(() => expect(recupererHistoriquePoints).toHaveBeenCalledWith(2));
    expect(screen.getByText("Aucun mouvement ne correspond à ces filtres.")).toBeDefined();
    expect(screen.getByRole("button", { name: "Précédente" })).toBeEnabled();
  });

  test("affiche l'erreur API et relance le chargement avec Réessayer", async () => {
    const user = userEvent.setup();
    vi.mocked(recupererHistoriquePoints)
      .mockRejectedValueOnce(new ErreurApi("Service indisponible", 503))
      .mockResolvedValueOnce(historique);

    render(<HistoriquePointsViewer />);
    expect(await screen.findByRole("alert")).toHaveTextContent("Service indisponible");

    await user.click(screen.getByRole("button", { name: "Réessayer" }));
    await waitFor(() => expect(screen.getByRole("row", { name: /Visite quotidienne/ })).toBeDefined());
    expect(recupererHistoriquePoints).toHaveBeenCalledTimes(2);
  });
});

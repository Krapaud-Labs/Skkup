import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { ErreurApi } from "@/lib/api";
import { ListeTirages } from "./ListeTirages";

vi.mock("@/lib/raffles", () => ({
  listerTirages: vi.fn(),
  recupererResultat: vi.fn(),
}));
vi.mock("@/lib/dashboard", () => ({ inscrireTirage: vi.fn(), recupererTicketsTirage: vi.fn() }));

const { listerTirages, recupererResultat } = await import("@/lib/raffles");
const { inscrireTirage, recupererTicketsTirage } = await import("@/lib/dashboard");

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(recupererTicketsTirage).mockResolvedValue({ tickets: [], page: 1, limit: 1, total: 0, totalPages: 1 });
});

describe("ListeTirages", () => {
  test("affiche les tirages et les gagnants publiés", async () => {
    vi.mocked(listerTirages).mockResolvedValue([
      {
        id: "tirage-1",
        titre: "Tirage hebdomadaire",
        description: "Une chance de gagner.",
        dateOuverture: "2026-08-15T18:00:00.000Z",
        dateTirage: "2026-08-20T18:00:00.000Z",
        statut: "TIRE",
        resultatPublieAt: "2026-08-20T18:01:00.000Z",
        ticketsDistribues: 12,
        lots: [{ id: "lot-1", nom: "Carte cadeau", valeurEstimee: 50, quantite: 1, fournisseur: null }],
      },
    ]);
    vi.mocked(recupererResultat).mockResolvedValue({
      id: "tirage-1",
      gagnants: [{ lotId: "lot-1", lotNom: "Carte cadeau", ticketId: "ticket-1", pseudo: "Ada" }],
    });

    render(<ListeTirages />);

    expect((await screen.findAllByText("Tirage hebdomadaire")).length).toBe(2);
    expect(await screen.findByText(/Ada/)).toBeDefined();
    expect(screen.getAllByText(/Carte cadeau/)).toHaveLength(3);
  });

  test("affiche un état vide", async () => {
    vi.mocked(listerTirages).mockResolvedValue([]);
    render(<ListeTirages />);
    expect(await screen.findByText(/Aucun tirage/)).toBeDefined();
  });

  test("affiche le nombre réel de tickets du viewer", async () => {
    vi.mocked(listerTirages).mockResolvedValue([{
      id: "tirage-ouvert", titre: "Tirage ouvert", description: "", dateOuverture: "2026-08-15T18:00:00.000Z", dateTirage: "2026-08-20T18:00:00.000Z", statut: "OUVERT", resultatPublieAt: null, ticketsDistribues: 4, lots: [],
    }]);
    vi.mocked(recupererTicketsTirage).mockResolvedValue({ tickets: [], page: 1, limit: 1, total: 3, totalPages: 3 });

    render(<ListeTirages />);

    const resume = await screen.findByLabelText("Résumé du compte viewer");
    expect(within(resume).getByText("Mes tickets")).toBeDefined();
    expect(within(resume).getByText("3")).toBeDefined();
    expect(within(resume).getByText("Tirages ouverts")).toBeDefined();
    expect(within(resume).getByText("1")).toBeDefined();
    expect(recupererTicketsTirage).toHaveBeenCalledWith(1, 1);
  });

  test("conserve un état explicite si les tickets du viewer sont indisponibles", async () => {
    vi.mocked(listerTirages).mockResolvedValue([]);
    vi.mocked(recupererTicketsTirage).mockRejectedValue(new ErreurApi("Tickets indisponibles.", 503));

    render(<ListeTirages />);

    const resume = await screen.findByLabelText("Résumé du compte viewer");
    expect(within(resume).getByText("Indisponible")).toBeDefined();
    expect(within(resume).getByRole("status").textContent).toBe("Tickets indisponibles.");
    expect(within(resume).getByRole("button", { name: "Réessayer" })).toBeDefined();
  });

  test("affiche l'erreur de l'API", async () => {
    vi.mocked(listerTirages).mockRejectedValue(new ErreurApi("Service indisponible.", 503));
    render(<ListeTirages />);
    await waitFor(() => expect(screen.getByRole("alert").textContent).toBe("Service indisponible."));
  });

  test("permet de participer à un tirage ouvert et confirme le ticket", async () => {
    vi.mocked(listerTirages).mockResolvedValue([{
      id: "tirage-ouvert", titre: "Tirage ouvert", description: "", dateOuverture: "2026-08-15T18:00:00.000Z", dateTirage: "2026-08-20T18:00:00.000Z", statut: "OUVERT", resultatPublieAt: null, ticketsDistribues: 4, lots: [],
    }]);
    vi.mocked(inscrireTirage).mockResolvedValue({ ticketId: "abc", raffleId: "tirage-ouvert" });

    render(<ListeTirages />);

    await userEvent.click(await screen.findByRole("button", { name: "Participer au tirage" }));
    expect(await screen.findByText("Participation enregistrée. Ton ticket est prêt.")).toBeDefined();
    expect(inscrireTirage).toHaveBeenCalledWith("tirage-ouvert");
  });

  test("isole une erreur de résultat et permet de relancer ce résultat", async () => {
    vi.mocked(listerTirages).mockResolvedValue([{
      id: "tirage-1", titre: "Tirage publié", description: "", dateOuverture: "2026-08-15T18:00:00.000Z", dateTirage: "2026-08-20T18:00:00.000Z", statut: "TIRE", resultatPublieAt: "2026-08-20T18:01:00.000Z", ticketsDistribues: 1, lots: [],
    }]);
    vi.mocked(recupererResultat)
      .mockRejectedValueOnce(new ErreurApi("Résultat indisponible.", 503))
      .mockResolvedValueOnce({ id: "tirage-1", gagnants: [] });

    render(<ListeTirages />);

    expect(await screen.findByText("Résultat indisponible.")).toBeDefined();
    await userEvent.click(screen.getByRole("button", { name: "Réessayer" }));
    expect(await screen.findByText(/Aucun gagnant/)).toBeDefined();
    expect(recupererResultat).toHaveBeenCalledTimes(2);
  });
});

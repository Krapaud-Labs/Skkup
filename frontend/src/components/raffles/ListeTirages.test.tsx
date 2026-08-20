import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { ErreurApi } from "@/lib/api";
import { ListeTirages } from "./ListeTirages";

vi.mock("@/lib/raffles", () => ({
  listerTirages: vi.fn(),
  recupererResultat: vi.fn(),
}));

const { listerTirages, recupererResultat } = await import("@/lib/raffles");

beforeEach(() => vi.clearAllMocks());

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

    expect(await screen.findByText("Tirage hebdomadaire")).toBeDefined();
    expect(await screen.findByText(/Ada/)).toBeDefined();
    expect(screen.getAllByText(/Carte cadeau/)).toHaveLength(2);
  });

  test("affiche un état vide", async () => {
    vi.mocked(listerTirages).mockResolvedValue([]);
    render(<ListeTirages />);
    expect(await screen.findByText(/Aucun tirage/)).toBeDefined();
  });

  test("affiche l'erreur de l'API", async () => {
    vi.mocked(listerTirages).mockRejectedValue(new ErreurApi("Service indisponible.", 503));
    render(<ListeTirages />);
    await waitFor(() => expect(screen.getByRole("alert").textContent).toBe("Service indisponible."));
  });
});

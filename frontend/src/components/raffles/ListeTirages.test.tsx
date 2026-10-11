import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { ErreurApi } from "@/lib/api";
import { ListeTirages } from "./ListeTirages";

vi.mock("@/lib/raffles", () => ({
  listerTirages: vi.fn(),
  recupererResultat: vi.fn(),
}));
vi.mock("@/lib/dashboard", () => ({ inscrireTirage: vi.fn() }));

const { listerTirages, recupererResultat } = await import("@/lib/raffles");
const { inscrireTirage } = await import("@/lib/dashboard");
const push = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

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

    expect((await screen.findAllByText("Tirage hebdomadaire")).length).toBe(2);
    expect(await screen.findByText(/Ada/)).toBeDefined();
    expect(screen.getAllByText(/Carte cadeau/)).toHaveLength(3);
    expect(screen.queryByRole("tablist")).toBeNull();
    expect(screen.getByRole("group", { name: "Statut des tirages" })).toBeDefined();
    const selection = screen.getByRole("button", { name: /Tirage hebdomadaire/ });
    expect(selection.getAttribute("aria-pressed")).toBe("true");
    expect(selection.getAttribute("aria-controls")).toBe("raffle-detail-tirage-1");
    expect(screen.getByText("1 résultat")).toBeDefined();
    const detail = document.getElementById("raffle-detail-tirage-1");
    expect(detail?.getAttribute("aria-labelledby")).toBe("raffle-detail-title-tirage-1");
    expect(detail?.getAttribute("aria-live")).toBe("polite");
    expect(screen.getByRole("heading", { name: "Tirage hebdomadaire" }).id).toBe("raffle-detail-title-tirage-1");
  });

  test("affiche un état vide", async () => {
    vi.mocked(listerTirages).mockResolvedValue([]);
    render(<ListeTirages />);
    expect(await screen.findByText(/Aucun tirage/)).toBeDefined();
    expect(screen.getByRole("link", { name: "Lire le règlement" }).getAttribute("href")).toBe("/reglement");
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

  test("redirige vers la connexion uniquement quand la participation renvoie 401", async () => {
    vi.mocked(listerTirages).mockResolvedValue([{
      id: "tirage-auth", titre: "Tirage authentifié", description: "", dateOuverture: "2026-08-15T18:00:00.000Z", dateTirage: "2026-08-20T18:00:00.000Z", statut: "OUVERT", resultatPublieAt: null, ticketsDistribues: 4, lots: [],
    }]);
    vi.mocked(inscrireTirage).mockRejectedValue(new ErreurApi("Connexion requise.", 401));

    render(<ListeTirages />);

    await userEvent.click(await screen.findByRole("button", { name: "Participer au tirage" }));
    await waitFor(() => expect(push).toHaveBeenCalledWith("/connexion"));
    expect(screen.queryByRole("alert")).toBeNull();
  });

  test("conserve une erreur métier sans redirection", async () => {
    vi.mocked(listerTirages).mockResolvedValue([{
      id: "tirage-metier", titre: "Tirage métier", description: "", dateOuverture: "2026-08-15T18:00:00.000Z", dateTirage: "2026-08-20T18:00:00.000Z", statut: "OUVERT", resultatPublieAt: null, ticketsDistribues: 4, lots: [],
    }]);
    vi.mocked(inscrireTirage).mockRejectedValue(new ErreurApi("Solde insuffisant.", 403));

    render(<ListeTirages />);

    await userEvent.click(await screen.findByRole("button", { name: "Participer au tirage" }));
    expect(await screen.findByText("Solde insuffisant.")).toBeDefined();
    expect(push).not.toHaveBeenCalled();
  });

  test("calcule le temps restant depuis la date contractuelle du tirage ouvert", async () => {
    vi.mocked(listerTirages).mockResolvedValue([{
      id: "tirage-futur", titre: "Tirage futur", description: "", dateOuverture: "2026-08-15T18:00:00.000Z", dateTirage: "2030-08-20T18:00:00.000Z", statut: "OUVERT", resultatPublieAt: null, ticketsDistribues: 4, lots: [],
    }]);

    render(<ListeTirages />);

    expect(await screen.findByText("avant le tirage")).toBeDefined();
    expect(screen.getAllByText(/j .* h|h .* min/)).toHaveLength(2);
    const annonces = screen.getAllByRole("status", { name: "Temps restant avant le tirage" });
    expect(annonces).toHaveLength(2);
    expect(annonces.every((annonce) => annonce.getAttribute("aria-live") === "polite")).toBe(true);
    expect(annonces.find((annonce) => annonce.getAttribute("aria-atomic") === "true")).toBeDefined();
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

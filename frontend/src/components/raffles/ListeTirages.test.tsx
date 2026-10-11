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
const langueActive = vi.hoisted(() => ({ value: "fr" as "fr" | "en" }));

vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
vi.mock("@/components/i18n/LanguageProvider", async () => {
  const actual = await vi.importActual<typeof import("@/components/i18n/LanguageProvider")>("@/components/i18n/LanguageProvider");
  return { ...actual, useLanguage: () => ({ langue: langueActive.value, definirLangue: () => undefined }) };
});

beforeEach(() => {
  langueActive.value = "fr";
  vi.clearAllMocks();
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

  test("normalise les lots absents sans masquer le tirage", async () => {
    vi.mocked(listerTirages).mockResolvedValue([{
      id: "tirage-lots-invalides", titre: "Tirage robuste", description: "", dateOuverture: "2026-08-15T18:00:00.000Z", dateTirage: "2026-08-20T18:00:00.000Z", statut: "CLOTURE", resultatPublieAt: null, ticketsDistribues: 1, lots: null as never,
    }]);

    render(<ListeTirages />);

    expect((await screen.findAllByText("Tirage robuste")).length).toBeGreaterThan(0);
    expect(document.querySelector(".skuup-raffle-summary")?.textContent).toContain("0lot à gagner");
    expect(screen.getByText("Aucun lot n’est publié pour ce tirage.")).toBeDefined();
  });

  test("signale une réponse racine invalide comme erreur globale", async () => {
    vi.mocked(listerTirages).mockResolvedValue(null as never);
    render(<ListeTirages />);

    expect((await screen.findByRole("alert")).textContent).toBe("Impossible de charger les tirages pour le moment.");
  });

  test("affiche un libellé traduit pour les dates invalides", async () => {
    vi.mocked(listerTirages).mockResolvedValue([{
      id: "tirage-date-invalide", titre: "Tirage date invalide", description: "", dateOuverture: "date-invalide", dateTirage: "date-invalide", statut: "OUVERT", resultatPublieAt: null, ticketsDistribues: 1, lots: [],
    }]);

    render(<ListeTirages />);

    expect(await screen.findAllByText("Date indisponible")).toHaveLength(4);
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

  test("utilise la langue courante quand une participation se termine après un changement de langue", async () => {
    vi.mocked(listerTirages).mockResolvedValue([{
      id: "tirage-langue", titre: "Tirage langue", description: "", dateOuverture: "2026-08-15T18:00:00.000Z", dateTirage: "2026-08-20T18:00:00.000Z", statut: "OUVERT", resultatPublieAt: null, ticketsDistribues: 4, lots: [],
    }]);
    let rejeter!: (raison: unknown) => void;
    vi.mocked(inscrireTirage).mockReturnValue(new Promise((_, reject) => { rejeter = reject; }));

    const rendu = render(<ListeTirages />);
    await userEvent.click(await screen.findByRole("button", { name: "Participer au tirage" }));
    langueActive.value = "en";
    rendu.rerender(<ListeTirages />);
    rejeter(new Error("network"));

    expect(await screen.findByText("Entry is temporarily unavailable.")).toBeDefined();
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

  test("affiche une erreur de conflit 409 sans redirection lors de la participation", async () => {
    vi.mocked(listerTirages).mockResolvedValue([{
      id: "tirage-conflit", titre: "Tirage déjà joué", description: "", dateOuverture: "2026-08-15T18:00:00.000Z", dateTirage: "2026-08-20T18:00:00.000Z", statut: "OUVERT", resultatPublieAt: null, ticketsDistribues: 4, lots: [],
    }]);
    vi.mocked(inscrireTirage).mockRejectedValue(new ErreurApi("Participation déjà enregistrée.", 409));

    render(<ListeTirages />);

    await userEvent.click(await screen.findByRole("button", { name: "Participer au tirage" }));
    expect(await screen.findByText("Participation déjà enregistrée.")).toBeDefined();
    expect(push).not.toHaveBeenCalled();
  });

  test("affiche le message de repli quand la participation échoue sur le réseau", async () => {
    vi.mocked(listerTirages).mockResolvedValue([{
      id: "tirage-reseau", titre: "Tirage réseau", description: "", dateOuverture: "2026-08-15T18:00:00.000Z", dateTirage: "2026-08-20T18:00:00.000Z", statut: "OUVERT", resultatPublieAt: null, ticketsDistribues: 4, lots: [],
    }]);
    vi.mocked(inscrireTirage).mockRejectedValue(new Error("network failure"));

    render(<ListeTirages />);

    await userEvent.click(await screen.findByRole("button", { name: "Participer au tirage" }));
    expect(await screen.findByText("Participation indisponible pour le moment.")).toBeDefined();
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

  test.each([
    [404, "Résultat introuvable."],
    [500, "Erreur temporaire du résultat."],
  ])("permet de relancer un résultat en erreur %s", async (statut, message) => {
    vi.mocked(listerTirages).mockResolvedValue([{
      id: `tirage-${statut}`, titre: `Tirage erreur ${statut}`, description: "", dateOuverture: "2026-08-15T18:00:00.000Z", dateTirage: "2026-08-20T18:00:00.000Z", statut: "TIRE", resultatPublieAt: "2026-08-20T18:01:00.000Z", ticketsDistribues: 1, lots: [],
    }]);
    vi.mocked(recupererResultat)
      .mockRejectedValueOnce(new ErreurApi(message, statut))
      .mockResolvedValueOnce({ id: `tirage-${statut}`, gagnants: [] });

    render(<ListeTirages />);

    expect(await screen.findByText(message)).toBeDefined();
    await userEvent.click(screen.getByRole("button", { name: "Réessayer" }));
    expect(await screen.findByText("Aucun gagnant pour ce tirage.")).toBeDefined();
    expect(recupererResultat).toHaveBeenCalledTimes(2);
  });

  test("isole les résultats de plusieurs tirages publiés", async () => {
    vi.mocked(listerTirages).mockResolvedValue([
      {
        id: "tirage-publie-a", titre: "Tirage publié A", description: "", dateOuverture: "2026-08-15T18:00:00.000Z", dateTirage: "2026-08-20T18:00:00.000Z", statut: "TIRE", resultatPublieAt: "2026-08-20T18:01:00.000Z", ticketsDistribues: 1, lots: [{ id: "lot-a", nom: "Lot A", valeurEstimee: null, quantite: 1, fournisseur: null }],
      },
      {
        id: "tirage-publie-b", titre: "Tirage publié B", description: "", dateOuverture: "2026-08-15T18:00:00.000Z", dateTirage: "2026-08-21T18:00:00.000Z", statut: "TIRE", resultatPublieAt: "2026-08-21T18:01:00.000Z", ticketsDistribues: 2, lots: [{ id: "lot-b", nom: "Lot B", valeurEstimee: 25, quantite: 1, fournisseur: null }],
      },
    ]);
    vi.mocked(recupererResultat).mockImplementation(async (id) => id === "tirage-publie-a"
      ? { id, gagnants: [{ lotId: "lot-a", lotNom: "Lot A", ticketId: "ticket-a", pseudo: "Ada" }] }
      : { id, gagnants: [{ lotId: "lot-b", lotNom: "Lot B", ticketId: "ticket-b", pseudo: "Grace" }] });

    render(<ListeTirages />);

    expect(await screen.findByText("Ada")).toBeDefined();
    await userEvent.click(screen.getByRole("button", { name: /Tirage publié B/ }));
    expect(await screen.findByText("Grace")).toBeDefined();
    expect(screen.getAllByText("Lot B").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Lot B").length).toBeGreaterThan(0);
    expect(screen.queryByText("25 €")).toBeDefined();
  });

  test("affiche un lot sans image et sans valeur estimée", async () => {
    vi.mocked(listerTirages).mockResolvedValue([{
      id: "tirage-lot-sans-image", titre: "Tirage lot sans image", description: "", dateOuverture: "2026-08-15T18:00:00.000Z", dateTirage: "2026-08-20T18:00:00.000Z", statut: "TIRE", resultatPublieAt: "2026-08-20T18:01:00.000Z", ticketsDistribues: 1, lots: [{ id: "lot-sans-image", nom: "Lot sans valeur", valeurEstimee: null, quantite: 1, fournisseur: null, imageUrl: null }],
    }]);
    vi.mocked(recupererResultat).mockResolvedValue({ id: "tirage-lot-sans-image", gagnants: [] });

    render(<ListeTirages />);

    expect(await screen.findByText("Lot sans valeur")).toBeDefined();
    expect(screen.queryByText(/€/)).toBeNull();
    expect(screen.getByRole("heading", { name: "Lots" })).toBeDefined();
  });

  test("filtre correctement un ensemble mixte ouvert, clôturé et publié", async () => {
    vi.mocked(listerTirages).mockResolvedValue([
      { id: "tirage-ouvert-mixte", titre: "Tirage ouvert mixte", description: "", dateOuverture: "2026-08-15T18:00:00.000Z", dateTirage: "2030-08-20T18:00:00.000Z", statut: "OUVERT", resultatPublieAt: null, ticketsDistribues: 1, lots: [] },
      { id: "tirage-ferme-mixte", titre: "Tirage fermé mixte", description: "", dateOuverture: "2026-08-15T18:00:00.000Z", dateTirage: "2026-08-20T18:00:00.000Z", statut: "CLOTURE", resultatPublieAt: null, ticketsDistribues: 2, lots: [] },
      { id: "tirage-tire-mixte", titre: "Tirage tiré mixte", description: "", dateOuverture: "2026-08-15T18:00:00.000Z", dateTirage: "2026-08-20T18:00:00.000Z", statut: "TIRE", resultatPublieAt: "2026-08-20T18:01:00.000Z", ticketsDistribues: 3, lots: [] },
    ]);
    vi.mocked(recupererResultat).mockResolvedValue({ id: "tirage-tire-mixte", gagnants: [] });

    render(<ListeTirages />);

    expect(await screen.findByText("3 résultats")).toBeDefined();
    const filtreCloture = screen.getAllByRole("button").find((button) => button.textContent?.startsWith("Clôturé"));
    expect(filtreCloture).toBeDefined();
    await userEvent.click(filtreCloture!);
    expect(await screen.findByText("1 résultat")).toBeDefined();
    expect(screen.getAllByText("Tirage fermé mixte").length).toBeGreaterThan(0);
    expect(screen.queryByText("Tirage ouvert mixte")).toBeNull();
    const filtreTire = screen.getAllByRole("button").find((button) => button.textContent?.startsWith("Résultat publié"));
    expect(filtreTire).toBeDefined();
    await userEvent.click(filtreTire!);
    expect((await screen.findAllByText("Tirage tiré mixte")).length).toBeGreaterThan(0);
    expect(screen.queryByText("Tirage fermé mixte")).toBeNull();
  });
});

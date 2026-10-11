import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { ErreurApi } from "@/lib/api";
import { CentreRecompenses, progressionPalier } from "./CentreRecompenses";

vi.mock("@/components/i18n/LanguageProvider", () => ({ useLanguage: () => ({ langue: "fr" }) }));
vi.mock("@/lib/dashboard", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/lib/dashboard")>();
  return { ...original, recupererCartesAGratter: vi.fn(), recupererProfil: vi.fn(), recupererTicketsTirage: vi.fn(), gratterCarte: vi.fn() };
});

const { recupererCartesAGratter, recupererProfil, recupererTicketsTirage } = await import("@/lib/dashboard");
const carte = (streakPalier: number) => ({ id: "card-1", userId: "user-1", streakPalier, grattee: false, gainType: "POINTS", gainMontant: 25, createdAt: "2026-10-01T00:00:00.000Z", gratteeAt: null });

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(recupererProfil).mockResolvedValue({ id: "user-1", email: "qa@example.com", pseudo: "QA", soldePoints: 100, streakActuel: 3, streakMax: 4, derniereVisiteAt: null, createdAt: "2026-01-01T00:00:00.000Z" });
  vi.mocked(recupererTicketsTirage).mockResolvedValue({ tickets: [], page: 1, limit: 6, total: 0, totalPages: 1 });
});

describe("CentreRecompenses - preuve de rendu contractuel", () => {
  test("conserve l'état loading tant que les trois réponses contractuelles ne sont pas disponibles", () => {
    vi.mocked(recupererCartesAGratter).mockImplementation(() => new Promise(() => undefined));
    vi.mocked(recupererProfil).mockImplementation(() => new Promise(() => undefined));
    vi.mocked(recupererTicketsTirage).mockImplementation(() => new Promise(() => undefined));
    render(<CentreRecompenses />);

    expect(screen.getByRole("status").getAttribute("aria-busy")).toBe("true");
  });

  test("affiche l'état vide quand le contrat renvoie une collection sans cartes", async () => {
    vi.mocked(recupererCartesAGratter).mockResolvedValue([]);
    render(<CentreRecompenses />);

    expect(await screen.findByText("Aucune récompense ne correspond à ce filtre.")).toBeDefined();
    expect(screen.getByText("Sélectionne une carte récompense.")).toBeDefined();
  });

  test("rend la progression normale du palier de la carte sélectionnée", async () => {
    vi.mocked(recupererCartesAGratter).mockResolvedValue([carte(7)]);
    render(<CentreRecompenses />);
    const progress = await screen.findByRole("progressbar", { name: "Progression vers le palier de 7 jours" });
    expect(progress.getAttribute("max")).toBe("7");
    expect(progress.getAttribute("value")).toBe("3");
  });

  test("n'affiche pas de progression lorsque le palier contractuel est nul", async () => {
    vi.mocked(recupererCartesAGratter).mockResolvedValue([carte(0)]);
    render(<CentreRecompenses />);
    await screen.findAllByRole("heading", { name: "Carte classique" });
    expect(screen.queryByRole("progressbar")).toBeNull();
  });

  test("annonce l'erreur contractuelle quand les données sont absentes", async () => {
    vi.mocked(recupererCartesAGratter).mockRejectedValue(new ErreurApi("Récompenses indisponibles.", 503));
    render(<CentreRecompenses />);
    await waitFor(() => expect(screen.getByRole("alert").textContent).toContain("Récompenses indisponibles."));
  });

  test("permet de relancer le chargement après une erreur API", async () => {
    vi.mocked(recupererCartesAGratter)
      .mockRejectedValueOnce(new ErreurApi("Récompenses indisponibles.", 503))
      .mockResolvedValueOnce([carte(7)]);
    render(<CentreRecompenses />);

    await screen.findByRole("alert");
    await userEvent.click(screen.getByRole("button", { name: "Réessayer" }));
    expect(await screen.findByRole("progressbar", { name: "Progression vers le palier de 7 jours" })).toBeDefined();
    expect(recupererCartesAGratter).toHaveBeenCalledTimes(2);
  });

  test("borne la progression aux limites du palier", () => {
    expect(progressionPalier(3, 7)).toBe(3);
    expect(progressionPalier(9, 7)).toBe(7);
    expect(progressionPalier(-1, 7)).toBe(0);
  });
});

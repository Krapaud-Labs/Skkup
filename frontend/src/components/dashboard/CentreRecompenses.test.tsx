import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { ErreurApi } from "@/lib/api";
import { CentreRecompenses, progressionPalier } from "./CentreRecompenses";
import { imagesForSource } from "@/test-utils/next-image";

const mockLanguage = vi.hoisted(() => ({ langue: "fr" as "fr" | "en" }));
vi.mock("@/components/i18n/LanguageProvider", () => ({ useLanguage: () => mockLanguage }));
vi.mock("@/lib/dashboard", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/lib/dashboard")>();
  return { ...original, recupererCartesAGratter: vi.fn(), recupererProfil: vi.fn(), recupererTicketsTirage: vi.fn(), gratterCarte: vi.fn() };
});

const { recupererCartesAGratter, recupererProfil, recupererTicketsTirage } = await import("@/lib/dashboard");
const carte = (streakPalier: number) => ({ id: "card-1", userId: "user-1", streakPalier, grattee: false, gainType: "POINTS", gainMontant: 25, createdAt: "2026-10-01T00:00:00.000Z", gratteeAt: null });

beforeEach(() => {
  vi.clearAllMocks();
  mockLanguage.langue = "fr";
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
    expect(imagesForSource(document, "/assets/icons/ui/sparkle.png")).not.toHaveLength(0);
    expect(screen.getByText("Sélectionne une carte récompense.")).toBeDefined();
    expect(imagesForSource(document, "/assets/icons/ui/scratchCard.png")).not.toHaveLength(0);
    expect(document.querySelector(".skuup-rewards-selected-art")).toBeNull();
  });

  test("rend la progression normale du palier de la carte sélectionnée", async () => {
    vi.mocked(recupererCartesAGratter).mockResolvedValue([carte(7)]);
    render(<CentreRecompenses />);
    const progress = await screen.findByRole("progressbar", { name: "Progression vers le palier de 7 jours" });
    expect(progress.getAttribute("max")).toBe("7");
    expect(progress.getAttribute("value")).toBe("3");
    const selected = document.querySelector(".skuup-rewards-selected");
    const content = selected?.querySelector(".skuup-rewards-selected-content");
    expect(content?.querySelector(".skuup-rewards-selected-art")).not.toBeNull();
    expect(content?.querySelector(".skuup-rewards-selected-heading h2")?.textContent).toBeTruthy();
    expect(content?.querySelector(".skuup-rewards-selected-facts")).not.toBeNull();
    expect(content?.querySelector(".skuup-rewards-progress progress")).toBe(progress);
    expect(selected?.querySelector(".skuup-button-primary")).not.toBeNull();
    const illustration = document.querySelector<HTMLElement>(".skuup-rewards-selected-art");
    expect(illustration?.style.backgroundImage).toContain("scratch-tier-07.png");
    expect(screen.queryByText("Cette carte est disponible selon le contrat de ton compte.")).toBeNull();
  });

  test("garde le message indiquant qu’une carte sélectionnée a déjà été utilisée", async () => {
    vi.mocked(recupererCartesAGratter).mockResolvedValue([{ ...carte(7), grattee: true }]);
    render(<CentreRecompenses />);

    expect(await screen.findByText("Cette carte a déjà été utilisée.")).toBeDefined();
    expect(screen.queryByText("Cette carte est disponible selon le contrat de ton compte.")).toBeNull();
  });

  test("n'affiche pas de progression lorsque le palier contractuel est nul", async () => {
    vi.mocked(recupererCartesAGratter).mockResolvedValue([carte(0)]);
    render(<CentreRecompenses />);
    await screen.findAllByRole("heading", { name: "Carte classique" });
    expect(screen.queryByRole("progressbar")).toBeNull();
  });

  test("masque le badge de disponibilité des cartes intactes et garde celui des cartes utilisées", async () => {
    vi.mocked(recupererCartesAGratter).mockResolvedValue([
      carte(0),
      { ...carte(0), id: "used-card", grattee: true, gratteeAt: "2026-11-08T00:00:00.000Z" },
    ]);
    render(<CentreRecompenses />);

    await screen.findAllByRole("article");
    expect(screen.queryByText("DISPONIBLE")).toBeNull();
    expect(screen.getByText("UTILISÉE")).toBeDefined();
    expect(screen.getByRole("tab", { name: /Disponibles/ })).toBeDefined();
    expect(screen.getByRole("tab", { name: /Utilisées/ })).toBeDefined();
  });

  test("keeps the same available/used badge behavior in English", async () => {
    mockLanguage.langue = "en";
    vi.mocked(recupererCartesAGratter).mockResolvedValue([
      carte(0),
      { ...carte(0), id: "used-card", grattee: true, gratteeAt: "2026-11-08T00:00:00.000Z" },
    ]);
    render(<CentreRecompenses />);

    await screen.findAllByRole("article");
    expect(screen.queryByText("AVAILABLE")).toBeNull();
    expect(screen.getByText("USED")).toBeDefined();
    expect(screen.getByRole("tab", { name: /Available/ })).toBeDefined();
    expect(screen.getByRole("tab", { name: /Used/ })).toBeDefined();
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

  test("distingue le dernier ticket, les états exacts et le lot réel du gagnant", async () => {
    vi.mocked(recupererCartesAGratter).mockResolvedValue([carte(0)]);
    vi.mocked(recupererTicketsTirage).mockResolvedValue({
      tickets: [
        { ticketId: "latest", raffleId: "r1", raffleTitre: "Tirage récent", raffleStatut: "TIRE", obtenuLe: "2026-11-08T10:15:00.000Z", gagnant: true, lot: { id: "prize-1", nom: "Console réelle" } },
        { ticketId: "closed", raffleId: "r2", raffleTitre: "Tirage clôturé", raffleStatut: "CLOTURE", obtenuLe: "2026-11-07T10:15:00.000Z", gagnant: false, lot: null },
        { ticketId: "open", raffleId: "r3", raffleTitre: "Tirage ouvert", raffleStatut: "OUVERT", obtenuLe: "2026-11-06T10:15:00.000Z", gagnant: false, lot: null },
        { ticketId: "lost", raffleId: "r4", raffleTitre: "Tirage perdu", raffleStatut: "TIRE", obtenuLe: "2026-11-05T10:15:00.000Z", gagnant: false, lot: null },
      ],
      page: 1,
      limit: 6,
      total: 4,
      totalPages: 1,
    });

    render(<CentreRecompenses />);

    const liste = await screen.findByRole("list", { name: "Derniers tickets" });
    const lignes = [...liste.querySelectorAll("li")];
    expect(lignes).toHaveLength(4);
    expect(lignes[0].querySelector(".skuup-rewards-ticket-status")).not.toBeNull();
    expect(lignes[0].querySelector(".skuup-rewards-latest-label")).toBeNull();
    expect(lignes[0].querySelector("time")?.getAttribute("dateTime")).toBe("2026-11-08T10:15:00.000Z");
    expect(lignes[0].textContent).toContain("Gagnant");
    expect(lignes[0].textContent).toContain("Console réelle");
    expect(lignes[1].textContent).toContain("Tirage clôturé · résultat en attente");
    expect(lignes[2].textContent).toContain("Tirage en cours");
    expect(lignes[3].textContent).toContain("Non gagnant");
    expect(lignes.slice(1).some((ligne) => ligne.textContent?.includes("Dernier ticket"))).toBe(false);
    expect(lignes.every((ligne) => ligne.querySelector(".skuup-rewards-ticket-status") !== null)).toBe(true);
  });

  test("n'affiche aucun lot sans résultat gagnant confirmé par le contrat", async () => {
    vi.mocked(recupererCartesAGratter).mockResolvedValue([carte(0)]);
    vi.mocked(recupererTicketsTirage).mockResolvedValue({
      tickets: [{ ticketId: "open", raffleId: "r1", raffleTitre: "Tirage ouvert", raffleStatut: "OUVERT", obtenuLe: "2026-11-08T10:15:00.000Z", gagnant: false, lot: { id: "unconfirmed", nom: "Lot non confirmé" } }],
      page: 1,
      limit: 6,
      total: 1,
      totalPages: 1,
    });
    render(<CentreRecompenses />);

    const liste = await screen.findByRole("list", { name: "Derniers tickets" });
    const ligne = liste.querySelector("li");
    if (!ligne) throw new Error("La liste des tickets attendait une ligne.");
    expect(ligne.textContent).toContain("Tirage en cours");
    expect(ligne.textContent).not.toContain("Lot non confirmé");
  });

  test("borne la progression aux limites du palier", () => {
    expect(progressionPalier(3, 7)).toBe(3);
    expect(progressionPalier(9, 7)).toBe(7);
    expect(progressionPalier(-1, 7)).toBe(0);
  });
});

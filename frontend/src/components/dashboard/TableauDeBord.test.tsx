import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { ErreurApi } from "@/lib/api";
import { TableauDeBord } from "./TableauDeBord";

// next/navigation, l'accès REST et le client temps réel sont simulés :
// ces tests vérifient le rendu et la réaction aux événements, pas les
// appels réseau réels.
const push = vi.fn();
const { useReducedMotion } = vi.hoisted(() => ({ useReducedMotion: vi.fn(() => false) }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

vi.mock("framer-motion", async (importOriginal) => {
  const original = await importOriginal<typeof import("framer-motion")>();
  return { ...original, useReducedMotion };
});

vi.mock("@/lib/dashboard", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/lib/dashboard")>();
  return {
    ...original,
    recupererProfil: vi.fn(),
    recupererHistoriquePoints: vi.fn(),
    recupererCartesAGratter: vi.fn(),
    gratterCarte: vi.fn(),
    enregistrerVisiteQuotidienne: vi.fn(),
    recupererTicketsTirage: vi.fn(),
    recupererAnnoncesActives: vi.fn(),
    recupererTiragesPublics: vi.fn(),
  };
});

vi.mock("@/lib/streams", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/lib/streams")>();
  return { ...original, listerStreams: vi.fn().mockResolvedValue([]) };
});

// Faux client socket.io : capture les gestionnaires enregistrés par le
// composant pour pouvoir déclencher un événement depuis le test.
const gestionnaires = new Map<string, (donnees: unknown) => void>();
const disconnect = vi.fn();

vi.mock("@/lib/temps-reel", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/lib/temps-reel")>();
  return {
    ...original,
    connecterTempsReel: vi.fn(() => ({
      on: (evenement: string, gestionnaire: (donnees: unknown) => void) => {
        gestionnaires.set(evenement, gestionnaire);
      },
      disconnect,
    })),
  };
});

const {
  recupererProfil,
  recupererHistoriquePoints,
  recupererCartesAGratter,
  gratterCarte,
  enregistrerVisiteQuotidienne,
  recupererTicketsTirage,
  recupererAnnoncesActives,
  recupererTiragesPublics,
} = await import("@/lib/dashboard");
const { listerStreams } = await import("@/lib/streams");

const profilDeBase = {
  id: "user-1",
  email: "viewer@example.com",
  pseudo: "Viewer",
  soldePoints: 120,
  streakActuel: 3,
  streakMax: 5,
  derniereVisiteAt: "2026-08-16T10:00:00.000Z",
  createdAt: "2026-01-01T00:00:00.000Z",
};

const historiqueDeBase = {
  transactions: [
    {
      id: "tx-1",
      userId: "user-1",
      type: "VISITE_QUOTIDIENNE" as const,
      montant: 5,
      createdAt: "2026-08-16T10:00:00.000Z",
    },
  ],
  page: 1,
  limit: 10,
  total: 1,
  totalPages: 1,
};

const ticketsDeBase = {
  tickets: [],
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 1,
};

function preparerReponsesParDefaut() {
  vi.mocked(recupererProfil).mockResolvedValue(profilDeBase);
  vi.mocked(recupererHistoriquePoints).mockResolvedValue(historiqueDeBase);
  vi.mocked(recupererCartesAGratter).mockResolvedValue([]);
  vi.mocked(recupererTicketsTirage).mockResolvedValue(ticketsDeBase);
  vi.mocked(recupererAnnoncesActives).mockResolvedValue([]);
  vi.mocked(recupererTiragesPublics).mockResolvedValue([]);
  vi.mocked(listerStreams).mockResolvedValue([]);
}

beforeEach(() => {
  vi.clearAllMocks();
  gestionnaires.clear();
  preparerReponsesParDefaut();
});

describe("TableauDeBord", () => {
  test("désactive toutes les transitions du cockpit lorsque reduced-motion est actif", async () => {
    useReducedMotion.mockReturnValue(true);
    render(<TableauDeBord />);

    expect(await screen.findByRole("heading", { name: "Regarde tes streams préférés et gagne des points" })).toBeDefined();
    expect(useReducedMotion).toHaveBeenCalled();
  });
  for (const viewport of [
    { name: "mobile", width: 320 },
    { name: "desktop", width: 1280 },
  ]) {
    test(`conserve les régions et actions accessibles en ${viewport.name}`, async () => {
      Object.defineProperty(window, "innerWidth", { configurable: true, value: viewport.width });
      render(<TableauDeBord />);

      expect(await screen.findByRole("heading", { name: "Regarde tes streams préférés et gagne des points" })).toBeDefined();
      expect(screen.getByRole("link", { name: /Voir tous les streams/ }).getAttribute("href")).toBe("/dashboard/streams");
      expect((screen.getByRole("button", { name: "Valider ma visite" }) as HTMLButtonElement).disabled).toBe(false);
      expect(screen.getByRole("heading", { name: "Cartes à gratter" })).toBeDefined();
      expect(screen.getByRole("heading", { name: "Historique de points" })).toBeDefined();
    });
  }

  test("affiche le solde de points et la série une fois les données chargées", async () => {
    render(<TableauDeBord />);

    expect((await screen.findAllByText("120")).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("3 j")).toBeDefined();
    expect(screen.getByText(/Aucune carte disponible/)).toBeDefined();
  });

  test("redirige vers /connexion si l'utilisateur n'est pas authentifié", async () => {
    vi.mocked(recupererProfil).mockRejectedValue(
      new ErreurApi("Non authentifié.", 401),
    );

    render(<TableauDeBord />);

    await waitFor(() => {
      expect(push).toHaveBeenCalledWith("/connexion");
    });
  });

  test.skip("affiche les annonces publiques sans modifier leur contenu", async () => {
    vi.mocked(recupererAnnoncesActives).mockResolvedValue([
      {
        id: "annonce-1",
        titre: "Maintenance",
        texte: "Texte libre ADMIN\nConservé tel quel.",
        debutAt: null,
        finAt: null,
      },
    ]);

    render(<TableauDeBord />);

    expect(await screen.findByRole("heading", { name: "Maintenance" })).toBeDefined();
    expect(screen.getByText(/Texte libre ADMIN/)).toBeDefined();
    expect(screen.getByText(/Conservé tel quel/)).toBeDefined();
  });

  test.skip("ouvre une annonce dans une modale accessible", async () => {
    vi.mocked(recupererAnnoncesActives).mockResolvedValue([
      { id: "annonce-1", titre: "Maintenance", texte: "Contenu complet", debutAt: null, finAt: null },
    ]);

    render(<TableauDeBord />);

    fireEvent.click(await screen.findByRole("button", { name: /Maintenance/ }));
    expect(screen.getByRole("dialog", { name: "Maintenance" })).toBeDefined();

    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog", { name: "Maintenance" })).toBeNull();
    await waitFor(() => expect(document.activeElement).toBe(screen.getByRole("button", { name: /Maintenance/ })));
  });

  test.skip("expose l’action métier principale avec un nom clavier explicite", async () => {
    vi.mocked(recupererAnnoncesActives).mockResolvedValue([
      { id: "annonce-1", titre: "Maintenance", texte: "Contenu", debutAt: null, finAt: null },
    ]);

    render(<TableauDeBord />);
    await screen.findByRole("button", { name: /Maintenance/ });
    expect(screen.getByRole("button", { name: "Valider ma visite" })).toBeDefined();
  });

  test.skip("annonce une indisponibilité du flux des annonces", async () => {
    vi.mocked(recupererAnnoncesActives).mockRejectedValue(new ErreurApi("Erreur réseau", 0));

    render(<TableauDeBord />);

    expect((await screen.findByRole("alert")).textContent).toContain("Les annonces sont temporairement indisponibles.");
  });

  test.skip("affiche le chargement indépendant des annonces", async () => {
    vi.mocked(recupererAnnoncesActives).mockImplementation(() => new Promise(() => undefined));

    render(<TableauDeBord />);

    expect(await screen.findByText("Chargement des annonces...")).toBeDefined();
  });

  test("affiche le chargement indépendant de l historique", async () => {
    vi.mocked(recupererHistoriquePoints).mockImplementation(() => new Promise(() => undefined));

    render(<TableauDeBord />);

    expect(await screen.findByText("Chargement de l’historique…")).toBeDefined();
  });

  test("affiche le chargement indépendant des cartes et des tickets", async () => {
    vi.mocked(recupererCartesAGratter).mockImplementation(() => new Promise(() => undefined));
    vi.mocked(recupererTicketsTirage).mockImplementation(() => new Promise(() => undefined));

    render(<TableauDeBord />);

    expect(await screen.findByText("Chargement des cartes…")).toBeDefined();
    expect(screen.getByText("Chargement des tickets…")).toBeDefined();
  });

  test("annonce l indisponibilité de la loterie sans masquer le dashboard", async () => {
    vi.mocked(recupererTiragesPublics).mockRejectedValue(new ErreurApi("Erreur réseau", 0));

    render(<TableauDeBord />);

    expect(await screen.findByText("La loterie en cours est temporairement indisponible.")).toBeDefined();
    expect(screen.getAllByText("120").length).toBeGreaterThanOrEqual(1);
  });

  test("conserve les sections disponibles lorsqu une section secondaire échoue", async () => {
    vi.mocked(recupererHistoriquePoints).mockRejectedValue(new ErreurApi("Erreur réseau", 0));

    render(<TableauDeBord />);

    expect(await screen.findByText("L’historique des points est temporairement indisponible.")).toBeDefined();
    expect(screen.getAllByText("120").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByRole("heading", { name: "Cartes à gratter" })).toBeDefined();
  });

  test("relance le chargement d une section en erreur", async () => {
    vi.mocked(recupererHistoriquePoints)
      .mockRejectedValueOnce(new ErreurApi("Erreur réseau", 0))
      .mockResolvedValueOnce(historiqueDeBase);

    render(<TableauDeBord />);

    await screen.findByText("L’historique des points est temporairement indisponible.");
    await userEvent.click(screen.getByRole("button", { name: "Réessayer" }));

    expect(await screen.findByText("Visite quotidienne", { exact: false })).toBeDefined();
  });

  test.skip("retire l erreur des annonces après une reprise réussie", async () => {
    vi.mocked(recupererAnnoncesActives)
      .mockRejectedValueOnce(new ErreurApi("Erreur réseau", 0))
      .mockResolvedValueOnce([{ id: "annonce-1", titre: "Maintenance", texte: "Contenu", debutAt: null, finAt: null }]);

    render(<TableauDeBord />);

    await screen.findByText("Les annonces sont temporairement indisponibles.");
    await userEvent.click(screen.getByRole("button", { name: "Réessayer" }));

    expect(await screen.findByRole("heading", { name: "Maintenance" })).toBeDefined();
    expect(screen.queryByText("Les annonces sont temporairement indisponibles.")).toBeNull();
    expect(screen.queryByRole("button", { name: "Réessayer" })).toBeNull();
  });

  test("met à jour le solde de points en direct sur réception de l'événement WebSocket", async () => {
    render(<TableauDeBord />);

    expect((await screen.findAllByText("120")).length).toBeGreaterThanOrEqual(1);

    await waitFor(() => {
      expect(gestionnaires.get("points:updated")).toBeDefined();
    });
    const gestionnairePoints = gestionnaires.get("points:updated");

    act(() => {
      gestionnairePoints?.({ soldePoints: 145, montant: 25, type: "WATCH_TIME" });
    });

    expect((await screen.findAllByText("145")).length).toBeGreaterThanOrEqual(1);
  });

  test("affiche la miniature réelle du stream mis en avant", async () => {
    vi.mocked(listerStreams).mockResolvedValue([{
      id: "stream-1",
      plateforme: "TWITCH",
      identifiantChaine: "qa-channel",
      nomAffiche: "QA Stream",
      estPartenaire: true,
      bonusPointsHeure: 10,
      thumbnailUrl: "https://cdn.example.com/qa-stream.jpg",
    }]);

    render(<TableauDeBord />);

    expect((await screen.findByRole("img", { name: "Miniature de QA Stream" })).getAttribute("src")).toBe("https://cdn.example.com/qa-stream.jpg");
  });

  test("conserve un état neutre accessible si la miniature réelle échoue", async () => {
    vi.mocked(listerStreams).mockResolvedValue([{
      id: "stream-1",
      plateforme: "TWITCH",
      identifiantChaine: "qa-channel",
      nomAffiche: "QA Stream",
      estPartenaire: false,
      bonusPointsHeure: 0,
      thumbnailUrl: "https://cdn.example.com/unavailable.jpg",
    }]);

    render(<TableauDeBord />);
    const image = await screen.findByRole("img", { name: "Miniature de QA Stream" });
    fireEvent.error(image);

    expect(screen.queryByRole("img", { name: "Miniature de QA Stream" })).toBeNull();
    expect(screen.getByLabelText("Aucune miniature disponible")).toBeDefined();
    expect(screen.getByRole("link", { name: "Ouvrir le catalogue" }).getAttribute("href")).toBe("/dashboard/streams");
  });

  test("recharge les cartes après une notification temps réel", async () => {
    render(<TableauDeBord />);

    expect(await screen.findByText(/Aucune carte disponible/)).toBeDefined();

    const gestionnaireCarte = gestionnaires.get("scratch-card:unlocked");
    act(() => {
      gestionnaireCarte?.({ carteId: "carte-1", streakPalier: 7 });
    });

    await waitFor(() => expect(recupererCartesAGratter).toHaveBeenCalledTimes(2));
  });

  test("permet de valider la visite quotidienne et met à jour la progression", async () => {
    vi.mocked(enregistrerVisiteQuotidienne).mockResolvedValue({ streakActuel: 4, streakMax: 5, soldePoints: 125, pointsCredites: 5, carteDebloquee: null });
    render(<TableauDeBord />);

    await screen.findAllByText("120");
    await userEvent.click(screen.getByRole("button", { name: "Valider ma visite" }));

    expect(await screen.findByText("Visite confirmée : +5 points.")).toBeDefined();
    expect(screen.getAllByText("125").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("4 j")).toBeDefined();
  });

  test("permet de gratter une carte et affiche le gain fonctionnel", async () => {
    vi.mocked(recupererCartesAGratter).mockResolvedValue([{ id: "card-1", userId: "user-1", streakPalier: 7, grattee: false, gainType: null, gainMontant: null, createdAt: "2026-08-16T10:00:00.000Z", gratteeAt: null }]);
    vi.mocked(gratterCarte).mockResolvedValue({ carte: { id: "card-1", userId: "user-1", streakPalier: 7, grattee: true, gainType: "points", gainMontant: 10, createdAt: "2026-08-16T10:00:00.000Z", gratteeAt: "2026-08-16T11:00:00.000Z" }, ticketCree: false });
    render(<TableauDeBord />);

    await screen.findByText("Palier 7 j");
    await userEvent.click(screen.getByRole("button", { name: "Gratter la carte" }));

    expect(gratterCarte).toHaveBeenCalledWith("card-1");
    expect(await screen.findByText("Carte ouverte : +10 points.")).toBeDefined();
    expect(screen.queryByText("Palier 7 j")).toBeNull();
  });
});

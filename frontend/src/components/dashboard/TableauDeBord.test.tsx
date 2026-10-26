import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
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
  derniereVisiteAt: new Date().toISOString(),
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

    expect(await screen.findByRole("heading", { name: "Ton espace de progression" })).toBeDefined();
    expect(useReducedMotion).toHaveBeenCalled();
  });
  for (const viewport of [
    { name: "mobile", width: 320 },
    { name: "desktop", width: 1280 },
  ]) {
    test(`conserve les régions et actions accessibles en ${viewport.name}`, async () => {
      Object.defineProperty(window, "innerWidth", { configurable: true, value: viewport.width });
      render(<TableauDeBord />);

      expect(await screen.findByRole("heading", { name: "Ton espace de progression" })).toBeDefined();
      expect(screen.queryByRole("region", { name: "Extension à associer" })).toBeNull();
      expect(screen.getByRole("heading", { name: "Cartes à gratter" })).toBeDefined();
      expect(screen.getByRole("heading", { name: "Historique de points" })).toBeDefined();
    });
  }

  test("affiche le solde de points et la série une fois les données chargées", async () => {
    render(<TableauDeBord />);

    expect((await screen.findAllByText("120")).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("3 j")).toBeDefined();
    expect(screen.getByText(/Aucune carte disponible/)).toBeDefined();
    const hero = screen.getByRole("banner", { name: "Ton espace de progression" });
    const kpis = hero.closest(".skuup-viewer-v3-overview-shell")?.querySelector(".skuup-viewer-v3-kpis");
    const pointsIcon = [...(kpis?.querySelectorAll<HTMLImageElement>("img.skuup-generated-icon") ?? [])].find(
      (image) => new URL(image.getAttribute("src") ?? "", "http://localhost").searchParams.get("url")?.replace(/#.*$/, "") === "/assets/icons/ui/points.png",
    );
    expect(new URL(pointsIcon?.getAttribute("src") ?? "", "http://localhost").searchParams.get("url")).toBe("/assets/icons/ui/points.png#v=211758f7");
    const streakIcon = [...(kpis?.querySelectorAll<HTMLImageElement>("img.skuup-generated-icon") ?? [])].find(
      (image) => new URL(image.getAttribute("src") ?? "", "http://localhost").searchParams.get("url") === "/assets/icons/ui/flame.png",
    );
    expect(new URL(streakIcon?.getAttribute("src") ?? "", "http://localhost").searchParams.get("url")).toBe("/assets/icons/ui/flame.png");
    expect(kpis?.innerHTML).toContain("ticket.png");
    expect(kpis?.querySelector("img[src*='skkup-icon-ticket-s.png']")).toBeNull();
    const scratchHeading = screen.getByRole("heading", { name: "Cartes à gratter" });
    const rewardPanel = scratchHeading.closest(".skuup-dashboard-panel");
    expect(rewardPanel?.querySelector("img[src*='scratchCard.png']")).not.toBeNull();
    expect(rewardPanel?.querySelector("img[src*='skkup-icon-reward.png']")).toBeNull();
  });

  test("affiche l’icône pièce devant chaque montant de l’activité récente", async () => {
    render(<TableauDeBord />);

    const historique = await screen.findByRole("heading", { name: "Historique de points" });
    const lignes = historique.closest(".skuup-dashboard-panel")?.querySelectorAll(".skuup-viewer-v3-activity-item");

    expect(lignes).toHaveLength(1);
    const pointsIcon = lignes?.[0].querySelector<HTMLImageElement>("img[data-icon='points'].skuup-generated-icon");
    expect(new URL(pointsIcon?.getAttribute("src") ?? "", "http://localhost").searchParams.get("url")).toBe("/assets/icons/ui/points.png#v=211758f7");
    expect(lignes?.[0].textContent).toContain("+5");
  });

  test("n’affiche ni compteur ni raccourci dans le bloc des cartes à gratter", async () => {
    render(<TableauDeBord />);

    const titre = await screen.findByRole("heading", { name: "Cartes à gratter" });
    const bloc = titre.closest(".skuup-dashboard-panel");

    expect(bloc?.querySelector(".skuup-dashboard-count")).toBeNull();
    expect(within(bloc as HTMLElement).queryByRole("link", { name: "Voir toutes les cartes" })).toBeNull();
  });

  test("affiche le logo S transparent dans le hero sans la pièce dorée", async () => {
    render(<TableauDeBord />);

    const hero = await screen.findByRole("banner", { name: "Ton espace de progression" });
    const logo = hero.querySelector("img");

    expect(logo?.getAttribute("src")).toContain("/assets/brand/marks/skkup-s-favicon.png");
    expect(hero.querySelector("img[src*='coin-points-transparent']")).toBeNull();
  });

  test("regroupe le hero et les indicateurs dans un même conteneur", async () => {
    render(<TableauDeBord />);

    const hero = await screen.findByRole("banner", { name: "Ton espace de progression" });
    const overview = hero.closest(".skuup-viewer-v3-overview-shell");

    expect(overview).not.toBeNull();
    expect(overview?.querySelector(".skuup-viewer-v3-hero")).toBe(hero);

    const kpis = overview?.querySelector(".skuup-viewer-v3-kpis");
    expect(kpis).not.toBeNull();
    expect(kpis?.querySelectorAll(".skuup-stat-card")).toHaveLength(3);
    expect(overview?.querySelector(".skuup-viewer-v3-hero")?.compareDocumentPosition(kpis as Node) ?? 0).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
  });

  test("ne rend pas la carte extension sur le dashboard principal", async () => {
    render(<TableauDeBord />);

    await screen.findByRole("heading", { name: "Cartes à gratter" });
    expect(screen.queryByRole("region", { name: "Extension à associer" })).toBeNull();
    expect(screen.queryByRole("link", { name: "Gérer l’extension" })).toBeNull();
    expect(document.querySelector(".skuup-viewer-v3-extension")).toBeNull();
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

    expect(await screen.findByText("Visite quotidienne", { exact: true })).toBeDefined();
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

  test("ne présente plus le bloc Temps de visionnage et ne charge pas les streams", async () => {
    render(<TableauDeBord />);

    await screen.findByRole("heading", { name: "Ton espace de progression" });

    expect(screen.queryByRole("region", { name: "Regarde tes streams préférés et gagne des points" })).toBeNull();
    expect(screen.queryByText("Temps de visionnage")).toBeNull();
    expect(screen.queryByRole("link", { name: "Voir tous les streams" })).toBeNull();
    expect(screen.queryByRole("link", { name: "Ouvrir le catalogue" })).toBeNull();
    expect(screen.queryByText("Les points sont validés automatiquement par l’extension pendant le visionnage.")).toBeNull();
    expect(listerStreams).not.toHaveBeenCalled();
  });

  test("recharge les cartes après une notification temps réel", async () => {
    render(<TableauDeBord />);

    expect(await screen.findByText(/Aucune carte disponible/)).toBeDefined();

    await waitFor(() => {
      expect(gestionnaires.get("scratch-card:unlocked")).toBeDefined();
    });
    const gestionnaireCarte = gestionnaires.get("scratch-card:unlocked");
    act(() => {
      gestionnaireCarte?.({ carteId: "carte-1", streakPalier: 7 });
    });

    await waitFor(() => expect(recupererCartesAGratter).toHaveBeenCalledTimes(2));
  });

  test("valide automatiquement la visite quotidienne à la connexion", async () => {
    vi.mocked(enregistrerVisiteQuotidienne).mockResolvedValue({ streakActuel: 4, streakMax: 5, soldePoints: 125, pointsCredites: 5, carteDebloquee: null });
    vi.mocked(recupererProfil).mockResolvedValue({ ...profilDeBase, derniereVisiteAt: "2026-08-16T10:00:00.000Z" });
    render(<TableauDeBord />);

    await waitFor(() => expect(enregistrerVisiteQuotidienne).toHaveBeenCalledTimes(1));
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

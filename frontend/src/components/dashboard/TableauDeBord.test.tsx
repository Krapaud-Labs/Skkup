import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import sharp from "sharp";
import { ErreurApi } from "@/lib/api";
import { TopbarDashboard } from "@/components/dashboard/TopbarDashboard";
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
    recupererResumeDashboard: vi.fn(),
    recupererCartesAGratter: vi.fn(),
    preparerCarteAGratter: vi.fn(),
    gratterCarte: vi.fn(),
    enregistrerVisiteQuotidienne: vi.fn(),
    recupererTicketsTirage: vi.fn(),
    recupererAnnoncesActives: vi.fn(),
    recupererAnnoncesViewer: vi.fn().mockResolvedValue({ items: [], nextCursor: null }),
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
  recupererResumeDashboard,
  recupererCartesAGratter,
  preparerCarteAGratter,
  gratterCarte,
  enregistrerVisiteQuotidienne,
  recupererTicketsTirage,
  recupererAnnoncesActives,
  recupererAnnoncesViewer,
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

const resumeDashboardDeBase = {
  profil: { id: "user-1", pseudo: "Viewer", soldePoints: 120, streakActuel: 3, streakMax: 5, derniereVisiteAt: "2026-08-16T10:00:00.000Z" },
  visionnage: { secondesValidees: 0, sessions: 0 },
  activite: { ticketsTirage: 0, cartesAGratterDisponibles: 0 },
  transactionsRecentes: [{ id: "tx-1", type: "VISITE_QUOTIDIENNE" as const, montant: 5, createdAt: "2026-08-16T10:00:00.000Z", session: null }],
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
  vi.mocked(recupererResumeDashboard).mockResolvedValue(resumeDashboardDeBase);
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

afterEach(() => {
  vi.restoreAllMocks();
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
      expect(screen.getByRole("heading", { name: "Activité récente" })).toBeDefined();
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

    await screen.findByRole("heading", { name: "Activité récente" });
    const listeActivite = screen.getByRole("list", { name: "Activité récente" });
    const lignes = listeActivite.querySelectorAll(".skuup-viewer-v3-activity-item");

    expect(lignes).toHaveLength(1);
    const pointsIcon = lignes?.[0].querySelector<HTMLImageElement>("img[data-icon='points'].skuup-generated-icon");
    expect(new URL(pointsIcon?.getAttribute("src") ?? "", "http://localhost").searchParams.get("url")).toBe("/assets/icons/ui/points.png#v=211758f7");
    expect(lignes?.[0].textContent).toContain("+5");
    const valeur = lignes?.[0].querySelector<HTMLElement>(".skuup-viewer-v3-activity-value");
    expect(valeur?.getAttribute("role")).toBe("group");
    expect(valeur?.getAttribute("aria-label")).toBe("+5 points");
    expect(valeur?.classList.contains("is-neutral")).toBe(false);
    expect(pointsIcon?.closest(".skuup-viewer-v3-activity-value")).toBe(valeur);
  });

  test("présente une activité à zéro point avec un libellé neutre et accessible", async () => {
    vi.mocked(recupererResumeDashboard).mockResolvedValue({
      ...resumeDashboardDeBase,
      transactionsRecentes: [{
        id: "watch-session:session-1",
        type: "WATCH_TIME",
        montant: 0,
        createdAt: "2026-08-16T10:00:00.000Z",
        session: { platform: "TWITCH", streamExternalId: "channel-1", dureeValideeSecondes: 600 },
      }],
    });
    render(<TableauDeBord />);

    await screen.findByRole("heading", { name: "Activité récente" });
    const ligne = screen.getByRole("list", { name: "Activité récente" }).querySelector(".skuup-viewer-v3-activity-item");
    const valeur = ligne?.querySelector<HTMLElement>(".skuup-viewer-v3-activity-value");

    expect(ligne).not.toBeNull();
    expect(ligne?.querySelector(".skuup-viewer-v3-activity-copy strong")?.textContent).toBe("Temps de visionnage");
    expect(ligne?.querySelector(".skuup-viewer-v3-activity-copy small")?.textContent).toContain("Twitch · 10 min validées");
    expect(valeur?.textContent).toBe("0 point");
    expect(valeur?.getAttribute("role")).toBe("group");
    expect(valeur?.getAttribute("aria-label")).toBe("0 point, aucun point crédité");
    expect(valeur?.classList.contains("is-neutral")).toBe(true);
    expect(valeur?.querySelector("img[data-icon='points']")).not.toBeNull();
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

  test("affiche le chargement indépendant de l’activité récente", async () => {
    vi.mocked(recupererResumeDashboard).mockImplementation(() => new Promise(() => undefined));

    render(<TableauDeBord />);

    expect(await screen.findByText("Chargement de l’activité…")).toBeDefined();
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

  test("présente uniquement le tirage courant et sa participation", async () => {
    vi.mocked(recupererTicketsTirage).mockResolvedValue({
      tickets: [
        { ticketId: "ticket-current", raffleId: "draw-current", raffleTitre: "Tirage octobre · simulation", raffleStatut: "OUVERT", obtenuLe: "2026-10-02T10:00:00.000Z", gagnant: false, lot: null },
        { ticketId: "ticket-archive", raffleId: "draw-archive", raffleTitre: "Tirage septembre · archive", raffleStatut: "TIRE", obtenuLe: "2026-09-02T10:00:00.000Z", gagnant: false, lot: null },
      ], page: 1, limit: 10, total: 4, totalPages: 1,
    });
    vi.mocked(recupererTiragesPublics).mockResolvedValue([{
      id: "draw-current", titre: "Tirage octobre · simulation", description: "Un lot à gagner ce mois-ci.",
      dateOuverture: "2026-10-01T00:00:00.000Z", dateTirage: "2026-10-31T00:00:00.000Z", statut: "OUVERT",
      lots: [{ id: "prize-1", nom: "Carte cadeau", valeurEstimee: "50 €", quantite: 1, fournisseur: "Skkup" }], ticketsDistribues: 12,
    }]);

    render(<TableauDeBord />);

    expect(await screen.findByRole("heading", { name: "Tirage octobre · simulation" })).toBeDefined();
    expect(screen.queryByText(/1 ticket pour ce tirage/)).toBeNull();
    expect(screen.queryByText("Tirage septembre · archive")).toBeNull();
    expect(screen.queryByText(/tickets? disponible/i)).toBeNull();
    expect(screen.getByRole("button", { name: "S’inscrire" })).toBeDefined();
  });

  test("garde un aperçu de deux lots et renvoie vers le détail sans faire défiler la carte", async () => {
    vi.mocked(recupererTiragesPublics).mockResolvedValue([{
      id: "draw-current", titre: "Tirage octobre · simulation", description: "Description longue masquée dans l’aperçu.",
      dateOuverture: "2026-10-01T00:00:00.000Z", dateTirage: "2026-10-31T00:00:00.000Z", statut: "OUVERT",
      lots: Array.from({ length: 5 }, (_, index) => ({
        id: `prize-${index + 1}`, nom: `Lot ${index + 1}`, valeurEstimee: `${50 + index} €`, quantite: 1, fournisseur: "Skkup",
      })), ticketsDistribues: 12,
    }]);

    render(<TableauDeBord />);

    expect(await screen.findByText("Lot 1")).toBeDefined();
    expect(screen.getByText("Lot 2")).toBeDefined();
    expect(screen.queryByText("Lot 3")).toBeNull();
    expect(screen.getByRole("link", { name: "Voir les 5 lots" }).getAttribute("href")).toBe("/dashboard/tirages");
    expect(screen.queryByText("Description longue masquée dans l’aperçu.")).toBeNull();
    expect(screen.getByRole("button", { name: "S’inscrire" })).toBeDefined();
  });

  test("conserve les sections disponibles lorsqu une section secondaire échoue", async () => {
    vi.mocked(recupererResumeDashboard).mockRejectedValue(new ErreurApi("Erreur réseau", 0));

    render(<TableauDeBord />);

    expect(await screen.findByText("L’activité récente est temporairement indisponible.")).toBeDefined();
    expect(screen.getAllByText("120").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByRole("heading", { name: "Cartes à gratter" })).toBeDefined();
  });

  test("relance le chargement d une section en erreur", async () => {
    vi.mocked(recupererResumeDashboard)
      .mockRejectedValueOnce(new ErreurApi("Erreur réseau", 0))
      .mockResolvedValueOnce(resumeDashboardDeBase);

    render(<TableauDeBord />);

    await screen.findByText("L’activité récente est temporairement indisponible.");
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
    render(<><TopbarDashboard profil={{ ...profilDeBase, role: "VIEWER" }} /><TableauDeBord /></>);

    await waitFor(() => expect(enregistrerVisiteQuotidienne).toHaveBeenCalledTimes(1));
    const confirmation = await screen.findByText("Visite confirmée : +5 points.");
    const toast = confirmation.closest(".skuup-viewer-notification-toast");
    expect(toast?.getAttribute("role")).toBe("status");
    expect(toast?.getAttribute("aria-live")).toBe("polite");
    expect(document.querySelector(".skuup-viewer-v3-hero-copy")?.textContent).not.toContain("Visite confirmée");
    fireEvent.click(screen.getByRole("button", { name: "Notifications" }));
    await waitFor(() => expect(recupererAnnoncesViewer).toHaveBeenCalled());
    expect(document.querySelector(".skuup-viewer-realtime-notification")?.textContent).toContain("Visite confirmée : +5 points.");
    await waitFor(() => expect(document.querySelector(".skuup-viewer-notification-toast")).toBeNull(), { timeout: 6000 });
    expect(screen.getAllByText("125").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("4 j")).toBeDefined();
  }, 8000);

  test("permet de gratter une carte et affiche le gain fonctionnel", async () => {
    const carte = { id: "card-1", userId: "user-1", streakPalier: 7, grattee: false, gainType: "points", gainMontant: 10, createdAt: "2026-08-16T10:00:00.000Z", gratteeAt: null };
    vi.mocked(recupererCartesAGratter).mockResolvedValue([carte]);
    vi.mocked(preparerCarteAGratter).mockResolvedValue({ carte });
    vi.mocked(gratterCarte).mockResolvedValue({ carte: { id: "card-1", userId: "user-1", streakPalier: 7, grattee: true, gainType: "points", gainMontant: 10, createdAt: "2026-08-16T10:00:00.000Z", gratteeAt: "2026-08-16T11:00:00.000Z" }, ticketCree: false });
    let efface = false;
    const gradient = { addColorStop: vi.fn() };
    const contexteVoile = {
      setTransform: vi.fn(),
      createLinearGradient: vi.fn(() => gradient),
      fillRect: vi.fn(() => { efface = false; }),
      strokeStyle: "",
      lineWidth: 1,
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      stroke: vi.fn(),
      globalCompositeOperation: "source-over",
      fillStyle: "",
      textAlign: "center",
      textBaseline: "middle",
      font: "",
      fillText: vi.fn(),
      getImageData: vi.fn((_x: number, _y: number, width: number, height: number) => {
        const data = new Uint8ClampedArray(width * height * 4);
        for (let i = 3; i < data.length; i += 4) data[i] = efface ? 0 : 255;
        return { data } as ImageData;
      }),
      arc: vi.fn(),
      fill: vi.fn(() => { efface = true; }),
    };
    const fichierMasque = `${process.cwd()}/../asset/dashboard/rewards/scratch-tier-07-foil-mask.png`;
    const { data: alphaMasque } = await sharp(fichierMasque).resize(300, 150, { fit: "fill" }).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const contexteMasque = {
      clearRect: vi.fn(),
      drawImage: vi.fn(),
      getImageData: vi.fn(() => ({ data: alphaMasque } as unknown as ImageData)),
    };
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(function (this: HTMLCanvasElement) {
      return (this.closest(".skuup-scratch-canvas-wrap") ? contexteVoile : contexteMasque) as unknown as CanvasRenderingContext2D;
    });
    vi.spyOn(HTMLImageElement.prototype, "complete", "get").mockReturnValue(true);
    vi.spyOn(HTMLImageElement.prototype, "naturalWidth", "get").mockReturnValue(1671);
    const rectOriginal = HTMLElement.prototype.getBoundingClientRect;
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function (this: HTMLElement) {
      if (this.classList.contains("skuup-scratch-canvas-wrap") || this instanceof HTMLCanvasElement) {
        return { x: 0, y: 0, left: 0, top: 0, right: 300, bottom: 150, width: 300, height: 150, toJSON: () => ({}) } as DOMRect;
      }
      return rectOriginal.call(this);
    });
    render(<><TopbarDashboard profil={{ ...profilDeBase, role: "VIEWER" }} /><TableauDeBord /></>);

    await screen.findByText("Palier 7 j");
    await userEvent.click(screen.getByRole("button", { name: "Gratter la carte" }));

    expect(await screen.findByRole("dialog", { name: "Gratte pour découvrir" })).toBeDefined();
    const imageMasque = document.querySelector<HTMLImageElement>(".skuup-scratch-modal-mask-source");
    expect(imageMasque).not.toBeNull();
    fireEvent.load(imageMasque!);
    expect(preparerCarteAGratter).toHaveBeenCalledWith("card-1");
    expect(await screen.findByText("+10 points")).toBeDefined();
    expect(gratterCarte).not.toHaveBeenCalled();

    const boutonAuto = screen.getByRole("button", { name: "Gratter automatiquement" });
    await waitFor(() => expect(boutonAuto.hasAttribute("disabled")).toBe(false));
    await userEvent.click(boutonAuto);
    await waitFor(() => expect(gratterCarte).toHaveBeenCalledWith("card-1"));
    const confirmation = await screen.findByText("+10 points", { selector: ".skuup-viewer-notification-toast" });
    expect(confirmation.closest(".skuup-viewer-notification-toast")?.textContent).toContain("Carte à gratter");
    expect(document.querySelector(".skuup-viewer-v3-hero-copy")?.textContent).not.toContain("+10 points");
    expect(screen.queryByText("Palier 7 j")).toBeNull();
  });
});

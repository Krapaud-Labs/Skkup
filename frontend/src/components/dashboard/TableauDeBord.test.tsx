import { act, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { ErreurApi } from "@/lib/api";
import { TableauDeBord } from "./TableauDeBord";
import { LanguageProvider } from "@/components/i18n/LanguageProvider";

// next/navigation, l'accès REST et le client temps réel sont simulés :
// ces tests vérifient le rendu et la réaction aux événements, pas les
// appels réseau réels.
const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

vi.mock("@/lib/dashboard", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/lib/dashboard")>();
  return {
    ...original,
    recupererProfil: vi.fn(),
    recupererHistoriquePoints: vi.fn(),
    recupererCartesAGratter: vi.fn(),
    recupererTicketsTirage: vi.fn(),
  };
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
  recupererTicketsTirage,
} = await import("@/lib/dashboard");

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
}

beforeEach(() => {
  vi.clearAllMocks();
  window.localStorage.clear();
  gestionnaires.clear();
  preparerReponsesParDefaut();
});

describe("TableauDeBord", () => {
  test("affiche le solde de points et la série une fois les données chargées", async () => {
    render(<TableauDeBord />);

    expect(await screen.findByText("120")).toBeDefined();
    expect(screen.getByText("3 j")).toBeDefined();
    expect(screen.getByText(/Aucune carte disponible/)).toBeDefined();
  });

  test("localise les unités et statuts du dashboard en anglais", async () => {
    window.localStorage.setItem("skkup-language", "en");
    vi.mocked(recupererTicketsTirage).mockResolvedValue({
      ...ticketsDeBase,
      tickets: [{ ticketId: "ticket-1", raffleId: "raffle-1", raffleTitre: "Weekly draw", raffleStatut: "OUVERT", obtenuLe: "2026-08-16T10:00:00.000Z", gagnant: false, lot: null }],
    });

    render(<LanguageProvider><TableauDeBord /></LanguageProvider>);

    expect(await screen.findByText("3 d")).toBeDefined();
    expect(screen.getAllByText((_, element) => element?.textContent?.startsWith("Daily visit") ?? false).some((element) => element.tagName === "SPAN")).toBe(true);
    expect(screen.getByText("Open")).toBeDefined();
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

  test("met à jour le solde de points en direct sur réception de l'événement WebSocket", async () => {
    render(<TableauDeBord />);

    expect(await screen.findByText("120")).toBeDefined();

    await waitFor(() => {
      expect(gestionnaires.get("points:updated")).toBeDefined();
    });
    const gestionnairePoints = gestionnaires.get("points:updated");

    act(() => {
      gestionnairePoints?.({ soldePoints: 145, montant: 25, type: "WATCH_TIME" });
    });

    expect(await screen.findByText("145")).toBeDefined();
    expect(screen.getByRole("status").textContent).toContain("Points mis à jour : 145 points.");
  });

  test("localise le message de notification temps réel en anglais", async () => {
    window.localStorage.setItem("skkup-language", "en");
    render(<LanguageProvider><TableauDeBord /></LanguageProvider>);

    expect(await screen.findByText("120")).toBeDefined();
    const gestionnairePoints = gestionnaires.get("points:updated");
    act(() => {
      gestionnairePoints?.({ soldePoints: 145, montant: 25, type: "WATCH_TIME" });
    });

    expect((await screen.findByRole("status")).textContent).toContain("Points updated: 145 points.");
  });

  test("ajoute une carte à gratter reçue en direct sans nouvel appel REST", async () => {
    render(<TableauDeBord />);

    expect(await screen.findByText(/Aucune carte disponible/)).toBeDefined();

    const gestionnaireCarte = gestionnaires.get("scratch-card:unlocked");
    act(() => {
      gestionnaireCarte?.({ carteId: "carte-1", streakPalier: 7 });
    });

    expect(await screen.findByText("Palier 7 j")).toBeDefined();
    expect(recupererCartesAGratter).toHaveBeenCalled();
  });
});

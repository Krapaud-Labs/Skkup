import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ErreurApi } from "@/lib/api";
import { CodeAppariement } from "./CodeAppariement";

// ─── Doubles de navigation et d'API ──────────────────────────────────────────

const pousser = vi.fn();
const routeur = { push: pousser };
vi.mock("next/navigation", () => ({
  useRouter: () => routeur,
}));

const genererCodeAppariement = vi.hoisted(() => vi.fn());
const listerAppareilsApparies = vi.hoisted(() => vi.fn());
const revoquerAppareil = vi.hoisted(() => vi.fn());
vi.mock("@/lib/extension", () => ({ genererCodeAppariement, listerAppareilsApparies, revoquerAppareil }));

beforeEach(() => {
  vi.clearAllMocks();
  listerAppareilsApparies.mockResolvedValue({ appareils: [] });
});

afterEach(() => {
  vi.useRealTimers();
});

describe("CodeAppariement", () => {
  // ─── Génération et expiration du code ──────────────────────────────────────

  it("n'affiche aucun code avant que l'utilisateur en demande un", () => {
    render(<CodeAppariement />);

    expect(genererCodeAppariement).not.toHaveBeenCalled();
    expect(
      screen.getByRole("button", { name: "Générer un code" }),
    ).toBeDefined();
  });

  it("affiche le code généré et son temps restant", async () => {
    genererCodeAppariement.mockResolvedValue({
      code: "H4T7-K9MP-2XQZ",
      expireAt: new Date(Date.now() + 5 * 60_000).toISOString(),
    });

    render(<CodeAppariement />);
    await userEvent.click(screen.getByRole("button", { name: "Générer un code" }));

    expect(await screen.findByText("H4T7-K9MP-2XQZ")).toBeDefined();
    expect(screen.getByText(/Valable encore [45]:\d\d/)).toBeDefined();
  });

  it("affiche les appareils exposés par le contrat et permet leur révocation", async () => {
    listerAppareilsApparies.mockResolvedValue({ appareils: [{ id: "pair-1", pairedAt: "2026-10-01T10:00:00.000Z", expireAt: "2026-10-31T10:00:00.000Z", statut: "ACTIF" }] });
    revoquerAppareil.mockResolvedValue(undefined);

    render(<CodeAppariement />);
    expect(await screen.findByText("Appareil associé")).toBeDefined();
    await userEvent.click(screen.getByRole("button", { name: "Révoquer" }));

    await waitFor(() => expect(revoquerAppareil).toHaveBeenCalledWith("pair-1"));
  });

  it("permet de relire l'état après une association dans l'extension", async () => {
    listerAppareilsApparies
      .mockResolvedValueOnce({ appareils: [] })
      .mockResolvedValueOnce({ appareils: [{ id: "pair-2", pairedAt: "2026-10-01T10:00:00.000Z", expireAt: "2026-10-31T10:00:00.000Z", statut: "ACTIF" }] });

    render(<CodeAppariement />);
    await screen.findByText("Aucun appareil associé.");
    await userEvent.click(screen.getByRole("button", { name: "Actualiser l'état" }));

    expect(await screen.findByText("Appareil associé")).toBeDefined();
    expect(listerAppareilsApparies).toHaveBeenCalledTimes(2);
  });

  it("signale un code périmé sans le réafficher comme valable", async () => {
    genererCodeAppariement.mockResolvedValue({
      code: "H4T7-K9MP-2XQZ",
      expireAt: new Date(Date.now() - 1_000).toISOString(),
    });

    render(<CodeAppariement />);
    await userEvent.click(screen.getByRole("button", { name: "Générer un code" }));

    expect(
      await screen.findByText("Code expiré, génère-en un nouveau."),
    ).toBeDefined();
  });

  // ─── Erreurs d'authentification et de débit ────────────────────────────────

  it("renvoie vers la connexion quand la session a expiré", async () => {
    genererCodeAppariement.mockRejectedValue(new ErreurApi("Non autorisé", 401));

    render(<CodeAppariement />);
    await userEvent.click(screen.getByRole("button", { name: "Générer un code" }));

    await waitFor(() => expect(pousser).toHaveBeenCalledWith("/connexion"));
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("affiche le message du serveur en cas de refus", async () => {
    genererCodeAppariement.mockRejectedValue(
      new ErreurApi("Trop de demandes, réessaie plus tard.", 429),
    );

    render(<CodeAppariement />);
    await userEvent.click(screen.getByRole("button", { name: "Générer un code" }));

    expect(await screen.findByRole("alert")).toHaveProperty(
      "textContent",
      "Trop de demandes, réessaie plus tard.",
    );
  });
});

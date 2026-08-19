import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ErreurApi } from "@/lib/api";
import { CodeAppariement } from "./CodeAppariement";

// ─── Doubles de navigation et d'API ──────────────────────────────────────────

const pousser = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pousser }),
}));

const genererCodeAppariement = vi.hoisted(() => vi.fn());
vi.mock("@/lib/extension", () => ({ genererCodeAppariement }));

beforeEach(() => {
  vi.clearAllMocks();
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

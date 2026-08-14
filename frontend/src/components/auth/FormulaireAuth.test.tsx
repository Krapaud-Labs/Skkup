import { beforeEach, describe, expect, test, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ErreurApi } from "@/lib/api";
import { FormulaireAuth } from "./FormulaireAuth";

// next/navigation et le module d'authentification sont simulés : le test
// vérifie le comportement du formulaire, pas l'appel réseau réel.
const push = vi.fn();
const refresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, refresh }),
}));

vi.mock("@/lib/auth", () => ({
  connexion: vi.fn(),
  inscription: vi.fn(),
}));

const { connexion, inscription } = await import("@/lib/auth");

beforeEach(() => {
  vi.clearAllMocks();
});

describe("mode connexion", () => {
  test("n'affiche pas de champ pseudo", () => {
    render(<FormulaireAuth mode="connexion" />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Connexion" }),
    ).toBeDefined();
    expect(screen.queryByLabelText("Pseudo")).toBeNull();
  });

  test("soumet les identifiants puis redirige vers l'accueil", async () => {
    vi.mocked(connexion).mockResolvedValue({ pseudo: "Lyra" });
    const utilisateur = userEvent.setup();
    render(<FormulaireAuth mode="connexion" />);

    await utilisateur.type(
      screen.getByLabelText("Adresse email"),
      "lyra@example.com",
    );
    await utilisateur.type(
      screen.getByLabelText("Mot de passe"),
      "motdepasse123",
    );
    await utilisateur.click(
      screen.getByRole("button", { name: "Je me connecte" }),
    );

    await waitFor(() => {
      expect(connexion).toHaveBeenCalledWith({
        email: "lyra@example.com",
        motDePasse: "motdepasse123",
      });
    });
    expect(push).toHaveBeenCalledWith("/");
  });

  test("affiche le message d'erreur du backend en cas d'échec", async () => {
    vi.mocked(connexion).mockRejectedValue(
      new ErreurApi("Identifiants invalides.", 401),
    );
    const utilisateur = userEvent.setup();
    render(<FormulaireAuth mode="connexion" />);

    await utilisateur.type(
      screen.getByLabelText("Adresse email"),
      "lyra@example.com",
    );
    await utilisateur.type(screen.getByLabelText("Mot de passe"), "mauvais");
    await utilisateur.click(
      screen.getByRole("button", { name: "Je me connecte" }),
    );

    const alerte = await screen.findByRole("alert");
    expect(alerte.textContent).toBe("Identifiants invalides.");
    expect(push).not.toHaveBeenCalled();
  });
});

describe("mode inscription", () => {
  test("soumet le pseudo avec les identifiants", async () => {
    vi.mocked(inscription).mockResolvedValue({ pseudo: "Lyra" });
    const utilisateur = userEvent.setup();
    render(<FormulaireAuth mode="inscription" />);

    await utilisateur.type(screen.getByLabelText("Pseudo"), "Lyra");
    await utilisateur.type(
      screen.getByLabelText("Adresse email"),
      "lyra@example.com",
    );
    await utilisateur.type(
      screen.getByLabelText("Mot de passe"),
      "motdepasse123",
    );
    await utilisateur.click(
      screen.getByRole("button", { name: "Je crée mon compte" }),
    );

    await waitFor(() => {
      expect(inscription).toHaveBeenCalledWith({
        email: "lyra@example.com",
        motDePasse: "motdepasse123",
        pseudo: "Lyra",
      });
    });
    expect(push).toHaveBeenCalledWith("/");
  });

  test("le champ mot de passe demande un nouveau mot de passe au gestionnaire", () => {
    render(<FormulaireAuth mode="inscription" />);

    expect(
      screen.getByLabelText("Mot de passe").getAttribute("autocomplete"),
    ).toBe("new-password");
  });
});

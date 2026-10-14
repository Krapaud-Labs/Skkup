import { beforeEach, describe, expect, test, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ErreurApi } from "@/lib/api";
import { FormulaireAuth } from "./FormulaireAuth";
import { LanguageProvider } from "@/components/i18n/LanguageProvider";

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

async function accepterLeReglement(utilisateur: ReturnType<typeof userEvent.setup>) {
  await utilisateur.click(screen.getByRole("checkbox", { name: "J’ai lu et j’accepte le règlement du jeu." }));
  await utilisateur.click(screen.getByRole("button", { name: "J’accepte le règlement et je continue" }));
}

async function accepterLeReglementAnglais(utilisateur: ReturnType<typeof userEvent.setup>) {
  await utilisateur.click(await screen.findByRole("checkbox", { name: "I have read and accept the game rules." }));
  await utilisateur.click(await screen.findByRole("button", { name: "I accept the rules and continue" }));
}

describe("mode connexion", () => {
  test("n'affiche pas de champ pseudo", () => {
    render(<FormulaireAuth mode="connexion" />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Connexion" }),
    ).toBeDefined();
    expect(screen.queryByLabelText("Pseudo")).toBeNull();
    expect(screen.queryByRole("link", { name: /Continuer avec Twitch/i })).toBeNull();
    expect(screen.queryByRole("link", { name: /Continuer avec Google/i })).toBeNull();
    expect(screen.queryByRole("link", { name: /Continuer avec Facebook/i })).toBeNull();
  });

  test("soumet les identifiants puis redirige vers le tableau de bord", async () => {
    vi.mocked(connexion).mockResolvedValue({ pseudo: "Lyra" });
    const utilisateur = userEvent.setup();
    render(<FormulaireAuth mode="connexion" />);

    await utilisateur.type(
      screen.getByLabelText("Adresse email"),
      "lyra@example.com",
    );
    await utilisateur.type(
      screen.getByLabelText("Mot de passe"),
      "Motdepasse123!",
    );
    await utilisateur.click(
      screen.getByRole("button", { name: "Je me connecte" }),
    );

    await waitFor(() => {
      expect(connexion).toHaveBeenCalledWith({
        email: "lyra@example.com",
      motDePasse: "Motdepasse123!",
      });
    });
    expect(push).toHaveBeenCalledWith("/dashboard");
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

  test("affiche une erreur traduite quand le réseau échoue", async () => {
    vi.mocked(connexion).mockRejectedValue(new Error("network failure"));
    const utilisateur = userEvent.setup();
    render(<FormulaireAuth mode="connexion" />);

    await utilisateur.type(screen.getByLabelText("Adresse email"), "lyra@example.com");
    await utilisateur.type(screen.getByLabelText("Mot de passe"), "mauvais");
    await utilisateur.click(screen.getByRole("button", { name: "Je me connecte" }));

    expect((await screen.findByRole("alert")).textContent).toBe(
      "Une erreur est survenue. Merci de réessayer.",
    );
    expect(screen.getByRole("button", { name: "Je me connecte" }).hasAttribute("disabled")).toBe(false);
  });
});

describe("mode inscription", () => {
  test("soumet le pseudo avec les identifiants", async () => {
    vi.mocked(inscription).mockResolvedValue({ pseudo: "Lyra" });
    const utilisateur = userEvent.setup();
    render(<FormulaireAuth mode="inscription" />);

    await accepterLeReglement(utilisateur);
    await utilisateur.type(screen.getByLabelText("Pseudo"), "Lyra");
    await utilisateur.type(
      screen.getByLabelText("Adresse email"),
      "lyra@example.com",
    );
    await utilisateur.type(
      screen.getByLabelText("Mot de passe"),
      "Motdepasse123!",
    );
    await utilisateur.type(
      screen.getByLabelText("Confirmer le mot de passe"),
      "Motdepasse123!",
    );
    await utilisateur.click(
      screen.getByRole("button", { name: "Je crée mon compte" }),
    );

    await waitFor(() => {
      expect(inscription).toHaveBeenCalledWith({
        email: "lyra@example.com",
        motDePasse: "Motdepasse123!",
        pseudo: "Lyra",
        accepteReglement: true,
      });
    });
    expect(push).toHaveBeenCalledWith("/dashboard");
  });

  test("le champ mot de passe demande un nouveau mot de passe au gestionnaire", async () => {
    const utilisateur = userEvent.setup();
    render(<FormulaireAuth mode="inscription" />);

    await accepterLeReglement(utilisateur);
    const champ = screen.getByLabelText("Mot de passe");
    expect(champ.getAttribute("autocomplete")).toBe("new-password");
    expect(champ.getAttribute("minlength")).toBe("12");
    expect(champ.getAttribute("pattern")).toBe("(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9]).{12,}");
  });

  test("affiche le règlement dans un modal et révèle le formulaire après acceptation", async () => {
    const utilisateur = userEvent.setup();
    render(<FormulaireAuth mode="inscription" />);

    expect(screen.getByRole("dialog", { name: "Règlement du jeu" })).toBeDefined();
    expect(screen.getByText("Article 1. Organisateur")).toBeDefined();
    const acceptation = screen.getByRole("checkbox", { name: "J’ai lu et j’accepte le règlement du jeu." });
    const continuer = screen.getByRole("button", { name: "J’accepte le règlement et je continue" });
    expect(continuer.hasAttribute("disabled")).toBe(true);
    expect(screen.queryByLabelText("Adresse email")).toBeNull();

    await utilisateur.click(acceptation);
    expect(continuer.hasAttribute("disabled")).toBe(false);
    await utilisateur.click(continuer);

    expect(screen.queryByRole("dialog")).toBeNull();
    expect(screen.getByLabelText("Adresse email")).toBeDefined();
  });

  test("refuse l'accès au formulaire si le règlement est fermé", async () => {
    const utilisateur = userEvent.setup();
    render(<FormulaireAuth mode="inscription" />);

    await utilisateur.click(screen.getByRole("button", { name: "Fermer le règlement" }));

    expect(push).toHaveBeenCalledWith("/");
    expect(screen.queryByLabelText("Adresse email")).toBeNull();
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  test("ferme ou refuse le modal sans révéler le formulaire", async () => {
    const utilisateur = userEvent.setup();
    const rendu = render(<FormulaireAuth mode="inscription" />);

    await utilisateur.click(screen.getByRole("button", { name: "Fermer le règlement" }));
    expect(push).toHaveBeenCalledWith("/");
    expect(screen.queryByLabelText("Adresse email")).toBeNull();

    vi.clearAllMocks();
    rendu.unmount();
    render(<FormulaireAuth mode="inscription" />);
    const dialog = screen.getByRole("dialog", { name: "Règlement du jeu" });
    fireEvent.keyDown(dialog, { key: "Escape" });
    expect(push).toHaveBeenCalledWith("/");
    expect(screen.queryByLabelText("Adresse email")).toBeNull();
  });

  test("refuse l'inscription si les mots de passe ne correspondent pas", async () => {
    const utilisateur = userEvent.setup();
    render(<FormulaireAuth mode="inscription" />);

    await accepterLeReglement(utilisateur);
    await utilisateur.type(screen.getByLabelText("Pseudo"), "Lyra");
    await utilisateur.type(screen.getByLabelText("Adresse email"), "lyra@example.com");
    await utilisateur.type(screen.getByLabelText("Mot de passe"), "Motdepasse123!");
    await utilisateur.type(screen.getByLabelText("Confirmer le mot de passe"), "Motdepasse456!");
    await utilisateur.click(screen.getByRole("button", { name: "Je crée mon compte" }));

    expect((await screen.findByRole("alert")).textContent).toBe(
      "Les mots de passe ne correspondent pas.",
    );
    expect(inscription).not.toHaveBeenCalled();
  });

  test("affiche les cinq contraintes en français et bloque un mot de passe incomplet", async () => {
    const utilisateur = userEvent.setup();
    render(<FormulaireAuth mode="inscription" />);

    await accepterLeReglement(utilisateur);
    expect(screen.getByText(/Un symbole/)).toBeDefined();
    await utilisateur.type(screen.getByLabelText("Pseudo"), "Lyra");
    await utilisateur.type(screen.getByLabelText("Adresse email"), "lyra@example.com");
    await utilisateur.type(screen.getByLabelText("Mot de passe"), "Motdepasse123");
    await utilisateur.type(screen.getByLabelText("Confirmer le mot de passe"), "Motdepasse123");
    fireEvent.submit(screen.getByRole("button", { name: "Je crée mon compte" }).closest("form")!);

    expect((await screen.findByRole("alert")).textContent).toContain("contraintes");
    expect(inscription).not.toHaveBeenCalled();
  });

  test("affiche les contraintes en anglais", async () => {
    const stockage = { getItem: () => "en", setItem: () => undefined };
    Object.defineProperty(window, "localStorage", { configurable: true, value: stockage });
    const utilisateur = userEvent.setup();
    render(<LanguageProvider><FormulaireAuth mode="inscription" /></LanguageProvider>);
    await accepterLeReglementAnglais(utilisateur);
    expect((await screen.findAllByText(/At least 12 characters/)).length).toBeGreaterThan(0);
    expect(await screen.findByText(/One symbol/)).toBeDefined();
  });
});

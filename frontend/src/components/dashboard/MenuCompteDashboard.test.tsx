import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, test, vi } from "vitest";
import { MenuCompteDashboard } from "./MenuCompteDashboard";

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  refresh: vi.fn(),
  deconnexion: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mocks.push, refresh: mocks.refresh }),
}));
vi.mock("@/lib/auth", async () => {
  const actual = await vi.importActual<typeof import("@/lib/auth")>("@/lib/auth");
  return { ...actual, deconnexion: mocks.deconnexion };
});

const profil = {
  id: "user-1",
  email: "ada@example.com",
  pseudo: "Ada",
  soldePoints: 120,
  streakActuel: 3,
  streakMax: 7,
  derniereVisiteAt: null,
  createdAt: "2026-01-01T00:00:00.000Z",
  role: "VIEWER" as const,
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.deconnexion.mockResolvedValue(undefined);
});

test("ouvre le menu du compte et la fenêtre de sécurité", async () => {
  render(<MenuCompteDashboard profil={profil} />);

  const declencheur = screen.getByRole("button", { name: "Ouvrir le menu de Ada" });
  fireEvent.click(declencheur);
  fireEvent.click(screen.getByRole("menuitem", { name: "Modifier le mot de passe" }));

  expect(screen.getByRole("dialog", { name: "Modifier le mot de passe" })).not.toBeNull();
  await waitFor(() => expect(document.activeElement).toBe(screen.getByRole("button", { name: "Fermer la fenêtre de modification du mot de passe" })));
  expect(screen.getByLabelText("Mot de passe actuel")).not.toBeNull();
  const utilisateur = userEvent.setup();
  const fermeture = screen.getByRole("button", { name: "Fermer la fenêtre de modification du mot de passe" });
  await utilisateur.tab();
  expect(document.activeElement).toBe(screen.getByLabelText("Mot de passe actuel"));
  await utilisateur.tab();
  expect(document.activeElement).toBe(screen.getByLabelText("Nouveau mot de passe"));
  await utilisateur.tab();
  expect(document.activeElement).toBe(screen.getByLabelText("Confirmer le nouveau mot de passe"));
  await utilisateur.tab();
  expect(document.activeElement).toBe(screen.getByRole("button", { name: "Changer le mot de passe" }));
  await utilisateur.tab();
  expect(document.activeElement).toBe(fermeture);
  await utilisateur.tab({ shift: true });
  expect(document.activeElement).toBe(screen.getByRole("button", { name: "Changer le mot de passe" }));
  await utilisateur.tab({ shift: true });
  expect(document.activeElement).toBe(screen.getByLabelText("Confirmer le nouveau mot de passe"));
  await utilisateur.tab({ shift: true });
  expect(document.activeElement).toBe(screen.getByLabelText("Nouveau mot de passe"));
  await utilisateur.tab({ shift: true });
  expect(document.activeElement).toBe(screen.getByLabelText("Mot de passe actuel"));
  await utilisateur.tab({ shift: true });
  expect(document.activeElement).toBe(fermeture);
  fireEvent.keyDown(document, { key: "Escape" });
  expect(screen.queryByRole("dialog", { name: "Modifier le mot de passe" })).toBeNull();
  await waitFor(() => expect(document.activeElement).toBe(declencheur));
  fireEvent.click(declencheur);
  fireEvent.click(screen.getByRole("menuitem", { name: "Modifier le mot de passe" }));
  await waitFor(() => expect(document.activeElement).toBe(screen.getByRole("button", { name: "Fermer la fenêtre de modification du mot de passe" })));
  fireEvent.click(screen.getByRole("button", { name: "Fermer la fenêtre de modification du mot de passe" }));
  expect(screen.queryByRole("dialog", { name: "Modifier le mot de passe" })).toBeNull();
  await waitFor(() => expect(document.activeElement).toBe(declencheur));
});

test("ferme le menu avec Escape et restitue le focus au déclencheur", async () => {
  render(<MenuCompteDashboard profil={profil} />);

  const declencheur = screen.getByRole("button", { name: "Ouvrir le menu de Ada" });
  fireEvent.click(declencheur);
  fireEvent.keyDown(document, { key: "Escape" });

  expect(screen.queryByRole("menu")).toBeNull();
  await waitFor(() => expect(document.activeElement).toBe(declencheur));
});

test("conserve un ordre de tabulation complet dans le menu administrateur", async () => {
  const utilisateur = userEvent.setup();
  render(<MenuCompteDashboard profil={{ ...profil, role: "ADMIN" }} />);

  const declencheur = screen.getByRole("button", { name: "Ouvrir le menu de Ada" });
  await utilisateur.click(declencheur);
  const elements = [
    screen.getByRole("menuitem", { name: "Modifier le mot de passe" }),
    screen.getByRole("menuitem", { name: "Changer de langue" }),
    screen.getByRole("menuitem", { name: "Dashboard" }),
    screen.getByRole("menuitem", { name: "Mon compte" }),
    screen.getByRole("menuitem", { name: "Administration" }),
    screen.getByRole("menuitem", { name: "Déconnexion" }),
  ];

  for (const element of elements) {
    await utilisateur.tab();
    expect(document.activeElement).toBe(element);
  }
  await utilisateur.tab();
  expect(document.activeElement).toBe(elements[0]);
  await utilisateur.tab({ shift: true });
  expect(document.activeElement).toBe(elements[elements.length - 1]);
});

test("déconnecte le compte depuis le menu", async () => {
  render(<MenuCompteDashboard profil={profil} />);

  fireEvent.click(screen.getByRole("button", { name: "Ouvrir le menu de Ada" }));
  fireEvent.click(screen.getByRole("menuitem", { name: "Déconnexion" }));

  await waitFor(() => expect(mocks.deconnexion).toHaveBeenCalledOnce());
  expect(mocks.push).toHaveBeenCalledWith("/");
  expect(mocks.refresh).toHaveBeenCalledOnce();
});

test("propose le dashboard dans le menu du compte", () => {
  render(<MenuCompteDashboard profil={profil} />);

  fireEvent.click(screen.getByRole("button", { name: "Ouvrir le menu de Ada" }));

  expect(screen.getByRole("menuitem", { name: "Dashboard" }).getAttribute("href")).toBe("/dashboard");
});

test("ouvre le choix des langues dans une petite fenêtre", async () => {
  render(<MenuCompteDashboard profil={profil} />);

  const declencheur = screen.getByRole("button", { name: "Ouvrir le menu de Ada" });
  fireEvent.click(declencheur);
  fireEvent.click(screen.getByRole("menuitem", { name: "Changer de langue" }));

  expect(screen.getByRole("dialog", { name: "Changer de langue" })).not.toBeNull();
  expect(screen.getByRole("button", { name: "Français" })).not.toBeNull();
  expect(screen.getByRole("button", { name: "English" })).not.toBeNull();
  const fermeture = screen.getByRole("button", { name: "Fermer la fenêtre de langue" });
  await waitFor(() => expect(document.activeElement).toBe(fermeture));
  const utilisateur = userEvent.setup();
  await utilisateur.tab();
  expect(document.activeElement).toBe(screen.getByRole("button", { name: "Français" }));
  await utilisateur.tab();
  expect(document.activeElement).toBe(screen.getByRole("button", { name: "English" }));
  await utilisateur.tab();
  expect(document.activeElement).toBe(fermeture);
  fireEvent.click(screen.getByRole("button", { name: "Fermer la fenêtre de langue" }));
  expect(screen.queryByRole("dialog", { name: "Changer de langue" })).toBeNull();
  return waitFor(() => expect(document.activeElement).toBe(declencheur));
});

test("propose l’administration aux comptes administrateurs", () => {
  render(<MenuCompteDashboard profil={{ ...profil, role: "ADMIN" }} />);

  fireEvent.click(screen.getByRole("button", { name: "Ouvrir le menu de Ada" }));

  expect(screen.getByRole("menuitem", { name: "Administration" }).getAttribute("href")).toBe("/admin");
});

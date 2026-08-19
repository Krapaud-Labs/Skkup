import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";

const push = vi.fn();
const refresh = vi.fn();
const recupererProfil = vi.fn();
const deconnexion = vi.fn();

vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard",
  useRouter: () => ({ push, refresh }),
}));
vi.mock("@/lib/dashboard", () => ({ recupererProfil }));
vi.mock("@/lib/auth", () => ({ deconnexion }));

const { NavigationGlobale } = await import("./NavigationGlobale");

describe("NavigationGlobale", () => {
  test("affiche les liens authentifiés et admin", async () => {
    recupererProfil.mockResolvedValue({ pseudo: "Ada", role: "ADMIN" });
    render(<NavigationGlobale />);
    await waitFor(() => expect(screen.getByText("Administration")).not.toBeNull());
    expect(screen.queryByRole("link", { name: "Tableau de bord" })).not.toBeNull();
    expect(screen.queryByRole("button", { name: "Déconnexion" })).not.toBeNull();
  });

  test("affiche la connexion si le profil est absent", async () => {
    recupererProfil.mockRejectedValue(new Error("401"));
    render(<NavigationGlobale />);
    await waitFor(() => expect(screen.getByRole("link", { name: "Connexion" })).not.toBeNull());
    expect(screen.queryByRole("button", { name: "Déconnexion" })).toBeNull();
  });
});

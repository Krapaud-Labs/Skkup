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
  test("affiche le Dashboard sans exposer les parcours internes", async () => {
    recupererProfil.mockResolvedValue({ pseudo: "Ada", role: "ADMIN" });
    render(<NavigationGlobale />);
    await waitFor(() => expect(screen.getByRole("link", { name: "Dashboard" })).not.toBeNull());
    expect(screen.queryByRole("link", { name: "Dashboard" })).not.toBeNull();
    expect(screen.queryByRole("link", { name: "Streams" })).toBeNull();
    expect(screen.queryByRole("link", { name: "Tirages" })).toBeNull();
    expect(screen.queryByRole("link", { name: "Extension" })).toBeNull();
    expect(screen.queryByRole("link", { name: "Administration" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Déconnexion" })).not.toBeNull();
  });

  test("affiche la connexion si le profil est absent", async () => {
    recupererProfil.mockRejectedValue(new Error("401"));
    render(<NavigationGlobale />);
    await waitFor(() => expect(screen.getByRole("link", { name: "Connexion" })).not.toBeNull());
    expect(screen.queryByRole("button", { name: "Déconnexion" })).toBeNull();
  });
});

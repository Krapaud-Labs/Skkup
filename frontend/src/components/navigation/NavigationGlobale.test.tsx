import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";

const push = vi.fn();
const refresh = vi.fn();
const recupererProfil = vi.fn();
const deconnexion = vi.fn();
let pathname = "/dashboard";

vi.mock("next/navigation", () => ({
  usePathname: () => pathname,
  useRouter: () => ({ push, refresh }),
}));
vi.mock("@/lib/dashboard", () => ({ recupererProfil }));
vi.mock("@/lib/auth", () => ({ deconnexion }));

const { NavigationGlobale } = await import("./NavigationGlobale");

describe("NavigationGlobale", () => {
  beforeEach(() => {
    pathname = "/dashboard";
    vi.clearAllMocks();
  });

  test("réduit le Dashboard au logo de retour vers la vitrine", () => {
    render(<NavigationGlobale />);

    expect(screen.getByRole("link", { name: "Retourner à la vitrine Skkup" }).getAttribute("href")).toBe("/");
    expect(screen.queryByRole("link", { name: "Dashboard" })).toBeNull();
    expect(screen.queryByRole("link", { name: "Comment ça marche" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Déconnexion" })).toBeNull();
    expect(recupererProfil).not.toHaveBeenCalled();
  });

  test("conserve la navigation globale hors du Dashboard", async () => {
    pathname = "/admin";
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
    pathname = "/admin";
    recupererProfil.mockRejectedValue(new Error("401"));
    render(<NavigationGlobale />);
    await waitFor(() => expect(screen.getByRole("link", { name: "Connexion" })).not.toBeNull());
    expect(screen.queryByRole("button", { name: "Déconnexion" })).toBeNull();
  });
});

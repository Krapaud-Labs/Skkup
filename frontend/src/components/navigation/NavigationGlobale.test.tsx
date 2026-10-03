import { render, screen } from "@testing-library/react";
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

  test("laisse le shell premium du Dashboard gérer la navigation privée", async () => {
    render(<NavigationGlobale />);
    expect(screen.queryByRole("banner")).toBeNull();
  });

  test("utilise le sas privé pour le back-office", async () => {
    pathname = "/admin";
    render(<NavigationGlobale />);
    expect(screen.queryByRole("banner")).toBeNull();
  });

  test("affiche la connexion si le profil est absent", async () => {
    pathname = "/admin";
    render(<NavigationGlobale />);
    expect(screen.queryByRole("banner")).toBeNull();
  });
});

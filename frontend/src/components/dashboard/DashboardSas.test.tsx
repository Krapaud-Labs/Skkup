import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, expect, test, vi } from "vitest";
import { ErreurApi } from "@/lib/api";
import { DashboardSas } from "./DashboardSas";

const { remplacer, recupererProfil } = vi.hoisted(() => ({
  remplacer: vi.fn(),
  recupererProfil: vi.fn(),
}));

vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: remplacer }) }));
vi.mock("@/lib/dashboard", () => ({ recupererProfil }));

beforeEach(() => vi.clearAllMocks());

test("redirige une session 401 vers la vitrine et ne rend pas le contenu protégé", async () => {
  recupererProfil.mockRejectedValue(new ErreurApi("Session expirée.", 401));

  render(<DashboardSas><div>Contenu protégé</div></DashboardSas>);

  await waitFor(() => expect(remplacer).toHaveBeenCalledWith("/"));
  expect(screen.queryByText("Contenu protégé")).toBeNull();
});

test("affiche un chargement accessible et contextualisé", () => {
  recupererProfil.mockReturnValue(new Promise(() => undefined));

  render(<DashboardSas><div>Contenu protégé</div></DashboardSas>);

  expect(screen.getByRole("status")).toHaveAttribute("aria-busy", "true");
  expect(screen.getByText("Chargement de ton espace Skkup")).toBeTruthy();
  expect(screen.getByText("Préparation de tes points, récompenses et activités.")).toBeTruthy();
});

test("conserve l’état d’erreur pour une erreur non liée à la session", async () => {
  recupererProfil.mockRejectedValue(new ErreurApi("Service indisponible.", 503));

  render(<DashboardSas><div>Contenu protégé</div></DashboardSas>);

  expect((await screen.findByRole("alert")).textContent).toBe("Impossible de charger ton espace Skkup.");
  expect(remplacer).not.toHaveBeenCalled();
});

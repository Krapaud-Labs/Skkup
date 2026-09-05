import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { ErreurApi } from "@/lib/api";
import { ListeStreams } from "./ListeStreams";

// ─── Double du catalogue ────────────────────────────────────────────────────

vi.mock("@/lib/streams", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/lib/streams")>();
  return { ...original, listerStreams: vi.fn() };
});

const { listerStreams } = await import("@/lib/streams");

beforeEach(() => {
  vi.clearAllMocks();
});

describe("ListeStreams", () => {
  // ─── Sélection, catalogue vide et erreur API ───────────────────────────────

  test("sélectionne la première chaîne puis permet d'en changer", async () => {
    vi.mocked(listerStreams).mockResolvedValue([
      {
        id: "1",
        plateforme: "YOUTUBE",
        identifiantChaine: "UC1",
        nomAffiche: "Chaîne Alpha",
      },
      {
        id: "2",
        plateforme: "TWITCH",
        identifiantChaine: "beta",
        nomAffiche: "Chaîne Beta",
      },
    ]);
    const utilisateur = userEvent.setup();

    render(<ListeStreams />);

    expect(await screen.findByText("Regarde ce stream avec l'extension")).toBeDefined();
    await utilisateur.click(screen.getByRole("button", { name: /Chaîne Beta/ }));
    expect(screen.getByRole("button", { name: /Chaîne Beta/ }).getAttribute("aria-current")).toBe("true");
  });

  test("affiche un état vide sans monter de lecteur", async () => {
    vi.mocked(listerStreams).mockResolvedValue([]);

    render(<ListeStreams />);

    expect(await screen.findByText(/Aucun stream disponible/)).toBeDefined();
    expect(screen.queryByText(/Regarde ce stream/)).toBeNull();
  });

  test("affiche l'erreur renvoyée par l'API", async () => {
    vi.mocked(listerStreams).mockRejectedValue(
      new ErreurApi("Catalogue indisponible.", 503),
    );

    render(<ListeStreams />);

    await waitFor(() => {
      expect(screen.getByRole("alert").textContent).toBe(
        "Catalogue indisponible.",
      );
    });
  });

  test("permet d'ajouter un stream libre", async () => {
    vi.mocked(listerStreams).mockResolvedValue([
      {
        id: "1",
        plateforme: "YOUTUBE",
        identifiantChaine: "UC1",
        nomAffiche: "Chaîne Alpha",
      },
    ]);
    const utilisateur = userEvent.setup();

    render(<ListeStreams />);

    await utilisateur.type(
      await screen.findByLabelText("Identifiant de chaîne"),
      "UC-LIBRE",
    );
    await utilisateur.type(screen.getByLabelText("Nom affiché"), "Ma chaîne");
    await utilisateur.click(screen.getByRole("button", { name: "Regarder" }));

    expect((await screen.findByRole("button", { name: /Ma chaîne/ })).getAttribute("aria-current")).toBe("true");
  });
});

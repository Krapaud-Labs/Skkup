import { render, screen, waitFor } from "@testing-library/react";
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
  // ─── Catalogue vide, liens externes et erreur API ──────────────────────────

  test("présente les chaînes sans embarquer leur lecteur", async () => {
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
    render(<ListeStreams />);

    expect(await screen.findByText("Regarde ce que tu veux")).toBeDefined();
    const liensExternes = screen.getAllByRole("link", { name: /Ouvrir le direct/ });
    expect(liensExternes).toHaveLength(2);
    expect(liensExternes.every((lien) => lien.getAttribute("target") === "_blank")).toBe(true);
    expect(screen.queryByTitle(/Lecteur/)).toBeNull();
});
  test("affiche un état vide sans monter de lecteur", async () => {
    vi.mocked(listerStreams).mockResolvedValue([]);

    render(<ListeStreams />);

    expect(await screen.findByText(/Le catalogue Skkup est vide/)).toBeDefined();
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

});

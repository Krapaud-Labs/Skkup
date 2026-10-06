import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { ErreurApi } from "@/lib/api";
import { ListeStreams } from "./ListeStreams";

vi.mock("@/lib/watch-sessions", () => ({
  ouvrirSessionVisionnage: vi.fn().mockResolvedValue({ id: "session-1" }),
}));

// ─── Double du catalogue ────────────────────────────────────────────────────

vi.mock("@/lib/streams", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/lib/streams")>();
  return { ...original, listerStreams: vi.fn() };
});

const { listerStreams } = await import("@/lib/streams");
const { ouvrirSessionVisionnage } = await import("@/lib/watch-sessions");

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

    expect(await screen.findByText("Chaînes proposées")).toBeDefined();
    const liensExternes = screen.getAllByRole("link", { name: /Ouvrir le direct/ });
    expect(liensExternes).toHaveLength(2);
    expect(liensExternes.every((lien) => lien.getAttribute("target") === "_blank")).toBe(true);
    expect(screen.queryByTitle(/Lecteur/)).toBeNull();
  });

  test("ouvre une session contractuelle avant le lien externe", async () => {
    vi.mocked(listerStreams).mockResolvedValue([{
      id: "1", plateforme: "TWITCH", identifiantChaine: "alpha", nomAffiche: "Chaîne Alpha",
    }]);
    render(<ListeStreams />);

    await userEvent.click(await screen.findByRole("link", { name: /Ouvrir le direct/ }));
    expect(ouvrirSessionVisionnage).toHaveBeenCalledWith("TWITCH", "alpha");
  });

  test("affiche uniquement la miniature réelle renvoyée par le contrat", async () => {
    vi.mocked(listerStreams).mockResolvedValue([{
      id: "with-thumbnail",
      plateforme: "TWITCH",
      identifiantChaine: "channel",
      nomAffiche: "Chaîne avec miniature",
      thumbnailUrl: "https://cdn.example.test/channel.jpg",
    }]);
    render(<ListeStreams />);

    const image = await screen.findByRole("img", { name: "Miniature de Chaîne avec miniature" });
    expect(image.getAttribute("src")).toBe("https://cdn.example.test/channel.jpg");
  });

  test("dérive la miniature publique Twitch quand le contrat ne fournit pas d'URL", async () => {
    vi.mocked(listerStreams).mockResolvedValue([{
      id: "twitch-derived",
      plateforme: "TWITCH",
      identifiantChaine: "channel-live",
      nomAffiche: "Chaîne Twitch live",
    }]);
    render(<ListeStreams />);

    const image = await screen.findByRole("img", { name: "Miniature de Chaîne Twitch live" });
    expect(image.getAttribute("src")).toBe("https://static-cdn.jtvnw.net/previews-ttv/live_user/channel-live-640x360.jpg");
  });

  test("remplace une miniature indisponible par un état neutre", async () => {
    vi.mocked(listerStreams).mockResolvedValue([{
      id: "broken-thumbnail",
      plateforme: "TWITCH",
      identifiantChaine: "channel",
      nomAffiche: "Chaîne indisponible",
      thumbnailUrl: "https://cdn.example.test/broken.jpg",
    }]);
    render(<ListeStreams />);

    const image = await screen.findByRole("img", { name: "Miniature de Chaîne indisponible" });
    fireEvent.error(image);

    expect(screen.queryByRole("img", { name: "Miniature de Chaîne indisponible" })).toBeNull();
    expect(screen.getByLabelText("Aucune miniature disponible pour Chaîne indisponible")).toBeDefined();
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

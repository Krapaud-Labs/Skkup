import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { ErreurApi } from "@/lib/api";
import { ListeStreams } from "./ListeStreams";

// ─── Double du catalogue ────────────────────────────────────────────────────

vi.mock("@/lib/streams", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/lib/streams")>();
  return { ...original, listerStreams: vi.fn() };
});

vi.mock("@/lib/extension", () => ({
  listerAppareilsApparies: vi.fn(),
}));

const { listerStreams } = await import("@/lib/streams");
const { listerAppareilsApparies } = await import("@/lib/extension");

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(listerAppareilsApparies).mockResolvedValue({ appareils: [] });
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

  test("dérive les compteurs des onglets depuis les streams API", async () => {
    vi.mocked(listerStreams).mockResolvedValue([
      { id: "tw-1", plateforme: "TWITCH", identifiantChaine: "one", nomAffiche: "One" },
      { id: "tw-2", plateforme: "TWITCH", identifiantChaine: "two", nomAffiche: "Two" },
      { id: "yt-1", plateforme: "YOUTUBE", identifiantChaine: "three", nomAffiche: "Three" },
    ]);
    render(<ListeStreams />);

    expect(await screen.findByRole("tab", { name: "Toutes 3" })).toBeDefined();
    expect(screen.getByRole("tab", { name: "Twitch 2" })).toBeDefined();
    expect(screen.getByRole("tab", { name: "YouTube 1" })).toBeDefined();
    fireEvent.click(screen.getByRole("tab", { name: "Twitch 2" }));
    expect(screen.getByText("One")).toBeDefined();
    expect(screen.queryByText("Three")).toBeNull();
  });

  test("compose chaque carte avec les informations réelles du contrat", async () => {
    vi.mocked(listerStreams).mockResolvedValue([{
      id: "partner-stream",
      plateforme: "TWITCH",
      identifiantChaine: "creator_channel",
      nomAffiche: "Creator Channel",
      estPartenaire: true,
      bonusPointsHeure: 12,
    }]);
    render(<ListeStreams />);

    const card = await screen.findByRole("article", { name: "Creator Channel" });
    expect(within(card).getByText("creator_channel")).toBeDefined();
    expect(within(card).getByText("+12 pts/h")).toBeDefined();
    expect(within(card).getByText("Partenaire vérifié")).toBeDefined();
    expect(within(card).getByRole("link", { name: /Ouvrir le direct/ }).getAttribute("href")).toBe("https://www.twitch.tv/creator_channel");
  });

  test("affiche seulement l'état confirmé de l'extension", async () => {
    vi.mocked(listerStreams).mockResolvedValue([{ id: "1", plateforme: "TWITCH", identifiantChaine: "one", nomAffiche: "One" }]);
    vi.mocked(listerAppareilsApparies).mockResolvedValue({ appareils: [{ id: "device", pairedAt: "2026-10-01T10:00:00.000Z", expireAt: "2026-10-31T10:00:00.000Z", statut: "ACTIF" }] });
    render(<ListeStreams />);

    expect(await screen.findByText("Extension connectée et prête à comptabiliser ton visionnage.")).toBeDefined();
  });

  test("signale honnêtement une erreur de vérification de l'extension", async () => {
    vi.mocked(listerStreams).mockResolvedValue([{ id: "1", plateforme: "TWITCH", identifiantChaine: "one", nomAffiche: "One" }]);
    vi.mocked(listerAppareilsApparies).mockRejectedValue(new ErreurApi("Service indisponible", 503));
    render(<ListeStreams />);

    expect(await screen.findByText("État de l’extension indisponible.")).toBeDefined();
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
    expect(screen.getByText("Miniature indisponible")).toBeDefined();
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

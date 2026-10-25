import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { ErreurApi } from "@/lib/api";
import { ListeStreams } from "./ListeStreams";

const langueTest = vi.hoisted(() => ({ value: "fr" as "fr" | "en" }));
vi.mock("@/components/i18n/LanguageProvider", async () => {
  const actual = await vi.importActual<typeof import("@/components/i18n/LanguageProvider")>("@/components/i18n/LanguageProvider");
  return { ...actual, useLanguage: () => ({ langue: langueTest.value, definirLangue: () => undefined }) };
});

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
  langueTest.value = "fr";
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
      {
        id: "3",
        plateforme: "KICK",
        identifiantChaine: "gamma",
        nomAffiche: "Chaîne Gamma",
      },
    ]);
    render(<ListeStreams />);

    expect(await screen.findByText("Chaînes proposées")).toBeDefined();
    const liensExternes = screen.getAllByRole("link", { name: /Ouvrir le direct/ });
    expect(liensExternes).toHaveLength(3);
    expect(liensExternes.every((lien) => lien.getAttribute("target") === "_blank")).toBe(true);
    expect(liensExternes.map((lien) => lien.getAttribute("href"))).toContain("https://kick.com/gamma");
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

  test("affiche les filtres et compteurs réels, puis filtre la plateforme", async () => {
    vi.mocked(listerStreams).mockResolvedValue([
      { id: "t", plateforme: "TWITCH", identifiantChaine: "twitch", nomAffiche: "Twitch", estPartenaire: true },
      { id: "y", plateforme: "YOUTUBE", identifiantChaine: "youtube", nomAffiche: "YouTube" },
    ]);
    render(<ListeStreams />);

    expect(await screen.findByRole("group", { name: "Filtrer par plateforme" })).toBeDefined();
    expect(screen.queryByRole("tablist")).toBeNull();
    const twitch = screen.getByRole("button", { name: "Twitch 1" });
    expect(twitch.getAttribute("aria-pressed")).toBe("false");
    expect(screen.getByRole("button", { name: "YouTube 1" }).getAttribute("aria-pressed")).toBe("false");
    expect(screen.getByText("2 résultats")).toBeDefined();
    await userEvent.click(twitch);
    expect(twitch.getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByText("1 résultat")).toBeDefined();
    expect(screen.getByRole("heading", { name: "Twitch" })).toBeDefined();
    expect(screen.queryByRole("heading", { name: "YouTube" })).toBeNull();
  });

  test("ne fabrique pas les métadonnées absentes et désactive les filtres non contractuels", async () => {
    vi.mocked(listerStreams).mockResolvedValue([{ id: "1", plateforme: "TWITCH", identifiantChaine: "alpha", nomAffiche: "Alpha" }]);
    render(<ListeStreams />);

    expect((await screen.findByRole("combobox", { name: "Filtrer par catégorie" })).hasAttribute("disabled")).toBe(true);
    expect(screen.getByRole("combobox", { name: "Filtrer par langue" }).hasAttribute("disabled")).toBe(true);
    expect(screen.getByText(/indisponibles.*contrat/i)).toBeDefined();
    expect(screen.queryByText("LIVE")).toBeNull();
    expect(screen.queryByText(/spectateurs/i)).toBeNull();
  });

  test("affiche un état vide sans monter de lecteur", async () => {
    vi.mocked(listerStreams).mockResolvedValue([]);

    render(<ListeStreams />);

    expect(await screen.findByText(/Le catalogue Skkup est vide/)).toBeDefined();
    expect(screen.getByRole("link", { name: "Configurer l’extension" }).getAttribute("href")).toBe("/extension");
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

  test("localise les filtres et rend les deux états PNG du favori en anglais", async () => {
    langueTest.value = "en";
    vi.mocked(listerStreams).mockResolvedValue([{
      id: "en-1", plateforme: "TWITCH", identifiantChaine: "alpha", nomAffiche: "Alpha",
    }]);
    render(<ListeStreams />);

    expect(await screen.findByRole("group", { name: "Filter by platform" })).toBeDefined();
    expect(screen.getByRole("textbox", { name: "Search for a streamer" })).toBeDefined();
    expect(screen.getByRole("combobox", { name: "Sort streams" })).toBeDefined();
    const favorite = screen.getByRole("button", { name: "Add to favorites : Alpha" });
    expect(favorite.getAttribute("aria-pressed")).toBe("false");
    expect(favorite.querySelector("img")?.getAttribute("src")).toBe("/assets/icons/ui/favorite-heart.png");
    await userEvent.click(favorite);
    expect(screen.getByRole("button", { name: "Remove from favorites : Alpha" }).getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByRole("button", { name: "Remove from favorites : Alpha" }).querySelector("img")?.getAttribute("src")).toBe("/assets/icons/ui/favorite-heart-active.png");
    expect(screen.getByRole("link", { name: "Open stream" })).toBeDefined();
    expect(screen.getByText("Published channels")).toBeDefined();
    expect(screen.queryByText("Chaînes publiées")).toBeNull();
  });

});

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { ErreurApi } from "@/lib/api";
import { ListeStreams } from "./ListeStreams";

vi.mock("@/lib/streams", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/lib/streams")>();
  return { ...original, listerStreams: vi.fn() };
});

vi.mock("@/components/lecteur/LecteurEmbarque", () => ({
  LecteurEmbarque: ({ stream }: { stream: { nomAffiche: string } }) => (
    <p>Lecteur actif : {stream.nomAffiche}</p>
  ),
}));

const { listerStreams } = await import("@/lib/streams");

beforeEach(() => {
  vi.clearAllMocks();
});

describe("ListeStreams", () => {
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

    expect(await screen.findByText("Lecteur actif : Chaîne Alpha")).toBeDefined();
    await utilisateur.click(screen.getByRole("button", { name: /Chaîne Beta/ }));
    expect(screen.getByText("Lecteur actif : Chaîne Beta")).toBeDefined();
  });

  test("affiche un état vide sans monter de lecteur", async () => {
    vi.mocked(listerStreams).mockResolvedValue([]);

    render(<ListeStreams />);

    expect(await screen.findByText(/Aucun stream disponible/)).toBeDefined();
    expect(screen.queryByText(/Lecteur actif/)).toBeNull();
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

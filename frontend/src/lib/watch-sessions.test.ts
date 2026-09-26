import { beforeEach, describe, expect, test, vi } from "vitest";

// ─── Double du client HTTP authentifié ───────────────────────────────────────

vi.mock("./auth", () => ({ fetchAuthentifie: vi.fn() }));

const { fetchAuthentifie } = await import("./auth");
const {
  envoyerHeartbeat,
  fermerSessionVisionnage,
  ouvrirSessionVisionnage,
} = await import("./watch-sessions");

beforeEach(() => {
  vi.clearAllMocks();
});

describe("sessions de visionnage", () => {
  // Les assertions portent sur la frontière HTTP : chemins encodés, payloads
  // normalisés et absence de calcul métier dans le navigateur.
  test("ouvre une session issue du suivi d’extension", async () => {
    vi.mocked(fetchAuthentifie).mockResolvedValue({ id: "session-1" });

    await ouvrirSessionVisionnage("YOUTUBE", "UC123");

    expect(fetchAuthentifie).toHaveBeenCalledWith("/watch-sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        platform: "YOUTUBE",
        streamExternalId: "UC123",
      }),
    });
  });

  test("normalise la position avant d'envoyer un heartbeat", async () => {
    vi.mocked(fetchAuthentifie).mockResolvedValue({ pointsCredites: 0 });

    await envoyerHeartbeat("session/a", -2.8, true);

    expect(fetchAuthentifie).toHaveBeenCalledWith(
      "/watch-sessions/session%2Fa/heartbeat",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          positionLectureSecondes: 0,
          enLecture: true,
        }),
      },
    );
  });

  test("encode l'identifiant lors de la clôture", async () => {
    vi.mocked(fetchAuthentifie).mockResolvedValue({ id: "session/a" });

    await fermerSessionVisionnage("session/a");

    expect(fetchAuthentifie).toHaveBeenCalledWith(
      "/watch-sessions/session%2Fa/close",
      { method: "POST" },
    );
  });
});

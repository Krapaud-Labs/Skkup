import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { ErreurApi } from "@/lib/api";
import { INTERVALLE_HEARTBEAT_MS } from "@/lib/watch-sessions";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

vi.mock("@/lib/watch-sessions", async (importOriginal) => {
  const original = await importOriginal<
    typeof import("@/lib/watch-sessions")
  >();
  return {
    ...original,
    ouvrirSessionVisionnage: vi.fn(),
    envoyerHeartbeat: vi.fn(),
    fermerSessionVisionnage: vi.fn(),
  };
});

const {
  envoyerHeartbeat,
  fermerSessionVisionnage,
  ouvrirSessionVisionnage,
} = await import("@/lib/watch-sessions");
const { useSessionVisionnage } = await import("./useSessionVisionnage");

const session = {
  id: "session-1",
  platform: "YOUTUBE" as const,
  streamExternalId: "UC123",
  statut: "EN_COURS" as const,
};

beforeEach(() => {
  vi.useFakeTimers();
  vi.clearAllMocks();
  vi.mocked(fermerSessionVisionnage).mockResolvedValue({
    ...session,
    statut: "TERMINEE",
  });
});

afterEach(() => {
  vi.useRealTimers();
});

describe("useSessionVisionnage", () => {
  test("ouvre, alimente puis clôt une session de lecture", async () => {
    vi.mocked(ouvrirSessionVisionnage).mockResolvedValue(session);
    vi.mocked(envoyerHeartbeat).mockResolvedValue({
      session,
      pointsCredites: 10,
    });

    const { result, unmount } = renderHook(() =>
      useSessionVisionnage({
        plateforme: "YOUTUBE",
        identifiantChaine: "UC123",
        enLecture: true,
        lirePosition: () => 61.9,
      }),
    );

    await act(async () => {
      await Promise.resolve();
    });

    expect(ouvrirSessionVisionnage).toHaveBeenCalledWith("YOUTUBE", "UC123");
    expect(result.current.etat).toBe("active");

    await act(async () => {
      await vi.advanceTimersByTimeAsync(INTERVALLE_HEARTBEAT_MS);
    });

    expect(envoyerHeartbeat).toHaveBeenCalledWith("session-1", 61.9, true);
    expect(result.current.pointsCredites).toBe(10);

    unmount();
    expect(fermerSessionVisionnage).toHaveBeenCalledWith("session-1");
  });

  test("redirige vers la connexion quand la session HTTP est absente", async () => {
    vi.mocked(ouvrirSessionVisionnage).mockRejectedValue(
      new ErreurApi("Session absente.", 401),
    );

    const { result } = renderHook(() =>
      useSessionVisionnage({
        plateforme: "YOUTUBE",
        identifiantChaine: "UC123",
        enLecture: true,
        lirePosition: () => 0,
      }),
    );

    await act(async () => {
      await Promise.resolve();
    });

    expect(push).toHaveBeenCalledWith("/connexion");
    expect(result.current.pointsCredites).toBe(0);
  });

  test("arrête les heartbeats après une invalidation serveur", async () => {
    vi.mocked(ouvrirSessionVisionnage).mockResolvedValue(session);
    vi.mocked(envoyerHeartbeat).mockRejectedValue(
      new ErreurApi("Session invalidée.", 403),
    );

    const { result } = renderHook(() =>
      useSessionVisionnage({
        plateforme: "YOUTUBE",
        identifiantChaine: "UC123",
        enLecture: true,
        lirePosition: () => 30,
      }),
    );

    await act(async () => {
      await Promise.resolve();
      await vi.advanceTimersByTimeAsync(INTERVALLE_HEARTBEAT_MS);
    });

    expect(result.current.etat).toBe("erreur");
    expect(result.current.messageErreur).toBe("Session invalidée.");

    await act(async () => {
      await vi.advanceTimersByTimeAsync(INTERVALLE_HEARTBEAT_MS * 2);
    });
    expect(envoyerHeartbeat).toHaveBeenCalledTimes(1);
  });

  test("suspend puis reprend les heartbeats sans rouvrir la session", async () => {
    vi.mocked(ouvrirSessionVisionnage).mockResolvedValue(session);
    vi.mocked(envoyerHeartbeat).mockResolvedValue({ session, pointsCredites: 0 });
    const { rerender } = renderHook(
      ({ enLecture }) =>
        useSessionVisionnage({
          plateforme: "YOUTUBE",
          identifiantChaine: "UC123",
          enLecture,
          lirePosition: () => 30,
        }),
      { initialProps: { enLecture: true } },
    );
    await act(async () => Promise.resolve());
    rerender({ enLecture: false });
    await act(async () => vi.advanceTimersByTimeAsync(INTERVALLE_HEARTBEAT_MS * 2));
    expect(envoyerHeartbeat).not.toHaveBeenCalled();

    rerender({ enLecture: true });
    await act(async () => vi.advanceTimersByTimeAsync(INTERVALLE_HEARTBEAT_MS));
    expect(ouvrirSessionVisionnage).toHaveBeenCalledTimes(1);
    expect(envoyerHeartbeat).toHaveBeenCalledTimes(1);
  });

  test("clôt la session avant d'ouvrir celle d'une autre chaîne", async () => {
    vi.mocked(ouvrirSessionVisionnage)
      .mockResolvedValueOnce(session)
      .mockResolvedValueOnce({ ...session, id: "session-2", streamExternalId: "UC456" });
    const { rerender } = renderHook(
      ({ identifiantChaine }) =>
        useSessionVisionnage({
          plateforme: "YOUTUBE",
          identifiantChaine,
          enLecture: true,
          lirePosition: () => 0,
        }),
      { initialProps: { identifiantChaine: "UC123" } },
    );
    await act(async () => Promise.resolve());
    rerender({ identifiantChaine: "UC456" });
    await act(async () => Promise.resolve());
    expect(fermerSessionVisionnage).toHaveBeenCalledWith("session-1");
    expect(ouvrirSessionVisionnage).toHaveBeenLastCalledWith("YOUTUBE", "UC456");
  });
});

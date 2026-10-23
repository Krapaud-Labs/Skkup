import { afterEach, expect, test, vi } from "vitest";
import { listerStreams } from "./streams";

afterEach(() => vi.unstubAllGlobals());

test("retourne Twitch, YouTube et Kick et masque les plateformes hors MVP", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => ({ streams: [
      { id: "t", plateforme: "TWITCH", identifiantChaine: "twitch", nomAffiche: "Twitch" },
      { id: "y", plateforme: "YOUTUBE", identifiantChaine: "UCyoutube", nomAffiche: "YouTube" },
      { id: "k", plateforme: "KICK", identifiantChaine: "kick", nomAffiche: "Kick" },
      { id: "f", plateforme: "FACEBOOK", identifiantChaine: "facebook", nomAffiche: "Legacy Facebook" },
    ] }),
  }));

  await expect(listerStreams()).resolves.toEqual([
    { id: "t", plateforme: "TWITCH", identifiantChaine: "twitch", nomAffiche: "Twitch" },
    { id: "y", plateforme: "YOUTUBE", identifiantChaine: "UCyoutube", nomAffiche: "YouTube" },
    { id: "k", plateforme: "KICK", identifiantChaine: "kick", nomAffiche: "Kick" },
  ]);
});

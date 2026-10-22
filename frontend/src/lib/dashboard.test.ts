import { beforeEach, describe, expect, it, vi } from "vitest";
import { fetchAuthentifie } from "./auth";
import { recupererAnnoncesViewer, sessionsDepuisResume, type ResumeDashboard } from "./dashboard";

vi.mock("./auth", () => ({ fetchAuthentifie: vi.fn() }));

const resume: ResumeDashboard = {
  profil: { id: "u1", pseudo: "viewer", soldePoints: 12, streakActuel: 2, streakMax: 4, derniereVisiteAt: null },
  visionnage: { secondesValidees: 90, sessions: 1 },
  activite: { ticketsTirage: 0, cartesAGratterDisponibles: 0 },
  transactionsRecentes: [
    { id: "watch-1", type: "WATCH_TIME", montant: 10, createdAt: "2026-10-06T10:00:00.000Z", session: { platform: "TWITCH", streamExternalId: "channel-1", dureeValideeSecondes: 90 } },
    { id: "daily-1", type: "VISITE_QUOTIDIENNE", montant: 2, createdAt: "2026-10-06T09:00:00.000Z", session: null },
  ],
};

describe("sessionsDepuisResume", () => {
  it("sépare les sessions réellement liées des autres mouvements de points", () => {
    expect(sessionsDepuisResume(resume)).toEqual([{
      id: "watch-1",
      createdAt: "2026-10-06T10:00:00.000Z",
      platform: "TWITCH",
      streamExternalId: "channel-1",
      dureeValideeSecondes: 90,
      points: 10,
    }]);
  });

  it("ne fabrique pas un historique lorsque le contrat ne fournit aucune session", () => {
    expect(sessionsDepuisResume({ ...resume, transactionsRecentes: [] })).toEqual([]);
    expect(sessionsDepuisResume(null)).toEqual([]);
  });
});

describe("recupererAnnoncesViewer", () => {
  beforeEach(() => vi.mocked(fetchAuthentifie).mockReset());
  it("lit les pages authentifiées et encode le curseur opaque dans la query", async () => {
    const page = { items: [{ id: "a1", titre: "Info", texte: "Texte" }], nextCursor: "next / 2" };
    vi.mocked(fetchAuthentifie).mockResolvedValue(page);
    await expect(recupererAnnoncesViewer()).resolves.toEqual(page);
    expect(fetchAuthentifie).toHaveBeenCalledWith("/viewer/announcements");
    await recupererAnnoncesViewer("next / 2");
    expect(fetchAuthentifie).toHaveBeenLastCalledWith("/viewer/announcements?cursor=next%20%2F%202");
  });
});

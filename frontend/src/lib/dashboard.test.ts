import { describe, expect, it } from "vitest";
import { sessionsDepuisResume, type ResumeDashboard } from "./dashboard";

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

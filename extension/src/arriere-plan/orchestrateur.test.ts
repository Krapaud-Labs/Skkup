import { beforeEach, describe, expect, it, vi } from "vitest";
import { ErreurApi } from "../commun/api";
import { HEARTBEAT_DELAI_BASE_MS } from "../commun/config";
import type { MessageEtatLecture } from "../commun/messages";
import type { PageDeVisionnage } from "../commun/plateformes";
import {
  ETAT_INITIAL,
  SILENCE_AVANT_CLOTURE_MS,
  creerOrchestrateur,
  type EtatOrchestrateur,
} from "./orchestrateur";

// ─── Bancs d'essai ───────────────────────────────────────────────────────────

const PAGE: PageDeVisionnage = {
  plateforme: "TWITCH",
  identifiantChaine: "machaine",
};
const AUTRE_PAGE: PageDeVisionnage = {
  plateforme: "YOUTUBE",
  identifiantChaine: "UCabcdefghijklmnopqrstuv",
};

function signal(
  page: PageDeVisionnage,
  enLecture: boolean,
  positionSecondes = 42,
): MessageEtatLecture {
  return { type: "etat-lecture", page, enLecture, positionSecondes };
}

function banc(options: { jeton?: string | null } = {}) {
  let etat: EtatOrchestrateur = { ...ETAT_INITIAL };
  let instant = 1_000_000;

  const ouvrirSession = vi.fn(async () => ({
    id: "session-1",
    platform: "TWITCH" as const,
    streamExternalId: "machaine",
    statut: "EN_COURS" as const,
  }));
  const envoyerHeartbeat = vi.fn(async () => ({
    session: {
      id: "session-1",
      platform: "TWITCH" as const,
      streamExternalId: "machaine",
      statut: "EN_COURS" as const,
    },
    pointsCredites: 0,
  }));
  const fermerSession = vi.fn(async () => undefined);

  const orchestrateur = creerOrchestrateur({
    depot: {
      lire: () => Promise.resolve(etat),
      ecrire: (nouvel) => {
        etat = nouvel;
        return Promise.resolve();
      },
    },
    lireJeton: () =>
      Promise.resolve(options.jeton === undefined ? "vrx_test" : options.jeton),
    ouvrirSession,
    envoyerHeartbeat,
    fermerSession,
    maintenant: () => instant,
    // Gigue neutralisée pour rendre la cadence prévisible.
    aleatoire: () => 0,
  });

  return {
    orchestrateur,
    ouvrirSession,
    envoyerHeartbeat,
    fermerSession,
    avancer: (millisecondes: number) => {
      instant += millisecondes;
    },
    etat: () => etat,
  };
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("creerOrchestrateur", () => {
  let essai: ReturnType<typeof banc>;

  beforeEach(() => {
    essai = banc();
  });

  it("ouvre une session au premier signal de lecture, pas avant", async () => {
    await essai.orchestrateur.signalerEtatLecture(signal(PAGE, false));
    expect(essai.ouvrirSession).not.toHaveBeenCalled();

    await essai.orchestrateur.signalerEtatLecture(signal(PAGE, true));

    expect(essai.ouvrirSession).toHaveBeenCalledWith("vrx_test", PAGE);
    expect(essai.etat().sessionId).toBe("session-1");
  });

  it("n'envoie un heartbeat qu'une fois le délai écoulé", async () => {
    await essai.orchestrateur.signalerEtatLecture(signal(PAGE, true));

    essai.avancer(HEARTBEAT_DELAI_BASE_MS - 1_000);
    await essai.orchestrateur.signalerEtatLecture(signal(PAGE, true));
    expect(essai.envoyerHeartbeat).not.toHaveBeenCalled();

    essai.avancer(2_000);
    await essai.orchestrateur.signalerEtatLecture(signal(PAGE, true, 88));
    expect(essai.envoyerHeartbeat).toHaveBeenCalledWith(
      "vrx_test",
      "session-1",
      88,
    );
  });

  it("suspend les heartbeats en pause sans clore la session", async () => {
    await essai.orchestrateur.signalerEtatLecture(signal(PAGE, true));
    essai.avancer(HEARTBEAT_DELAI_BASE_MS + 1_000);

    await essai.orchestrateur.signalerEtatLecture(signal(PAGE, false));

    expect(essai.envoyerHeartbeat).not.toHaveBeenCalled();
    expect(essai.fermerSession).not.toHaveBeenCalled();
    expect(essai.etat().sessionId).toBe("session-1");
  });

  it("ferme la session en cours quand la chaîne change", async () => {
    await essai.orchestrateur.signalerEtatLecture(signal(PAGE, true));

    await essai.orchestrateur.signalerEtatLecture(signal(AUTRE_PAGE, true));

    expect(essai.fermerSession).toHaveBeenCalledWith("vrx_test", "session-1");
    expect(essai.ouvrirSession).toHaveBeenLastCalledWith("vrx_test", AUTRE_PAGE);
  });

  it("ferme la session quand la page de visionnage disparaît", async () => {
    await essai.orchestrateur.signalerEtatLecture(signal(PAGE, true));

    await essai.orchestrateur.terminerPage();

    expect(essai.fermerSession).toHaveBeenCalledWith("vrx_test", "session-1");
    expect(essai.etat()).toEqual(ETAT_INITIAL);
  });

  it("ferme la session quand le script de contenu se tait trop longtemps", async () => {
    await essai.orchestrateur.signalerEtatLecture(signal(PAGE, true));

    essai.avancer(SILENCE_AVANT_CLOTURE_MS - 1_000);
    await essai.orchestrateur.verifierSilence();
    expect(essai.fermerSession).not.toHaveBeenCalled();

    essai.avancer(2_000);
    await essai.orchestrateur.verifierSilence();
    expect(essai.fermerSession).toHaveBeenCalledWith("vrx_test", "session-1");
  });

  it("n'ouvre aucune session tant que l'extension n'est pas associée", async () => {
    const sansJeton = banc({ jeton: null });

    await sansJeton.orchestrateur.signalerEtatLecture(signal(PAGE, true));

    expect(sansJeton.ouvrirSession).not.toHaveBeenCalled();
    expect(sansJeton.etat().messageErreur).toContain("Connecte l'extension");
  });

  // Situation attendue tant que POST /watch-sessions/:id/heartbeat n'accepte
  // pas le jeton d'extension : le suivi doit s'arrêter proprement, pas
  // marteler une route qui refuse.
  it("suspend le suivi après un refus d'authentification", async () => {
    essai.ouvrirSession.mockRejectedValueOnce(
      new ErreurApi("Non autorisé", 401),
    );

    await essai.orchestrateur.signalerEtatLecture(signal(PAGE, true));
    await essai.orchestrateur.signalerEtatLecture(signal(PAGE, true));

    expect(essai.ouvrirSession).toHaveBeenCalledTimes(1);
    expect(essai.etat().suspendu).toBe(true);
    expect(await essai.orchestrateur.etatPourPopup("Kra")).toMatchObject({
      etat: "erreur",
    });
    expect(await essai.orchestrateur.etatPourPopup("Kra", "en")).toMatchObject({
      etat: "erreur",
      messageErreur:
        "Tracking was refused by the server. Pair the extension with your account again from the website.",
    });
  });

  it("reprend le suivi après un heartbeat rejeté pour cause transitoire", async () => {
    await essai.orchestrateur.signalerEtatLecture(signal(PAGE, true));
    essai.envoyerHeartbeat.mockRejectedValueOnce(
      new ErreurApi("Intervalle non plausible", 400),
    );

    essai.avancer(HEARTBEAT_DELAI_BASE_MS + 1_000);
    await essai.orchestrateur.signalerEtatLecture(signal(PAGE, true));
    expect(essai.etat().suspendu).toBe(false);

    essai.avancer(HEARTBEAT_DELAI_BASE_MS + 1_000);
    await essai.orchestrateur.signalerEtatLecture(signal(PAGE, true));
    expect(essai.envoyerHeartbeat).toHaveBeenCalledTimes(2);
  });

  it("relance le suivi sur une nouvelle page après une suspension", async () => {
    essai.ouvrirSession.mockRejectedValueOnce(new ErreurApi("Refusé", 403));
    await essai.orchestrateur.signalerEtatLecture(signal(PAGE, true));
    expect(essai.etat().suspendu).toBe(true);

    await essai.orchestrateur.signalerEtatLecture(signal(AUTRE_PAGE, true));

    expect(essai.etat().suspendu).toBe(false);
    expect(essai.ouvrirSession).toHaveBeenLastCalledWith("vrx_test", AUTRE_PAGE);
  });

  it("décrit l'état courant pour la popup", async () => {
    expect(await essai.orchestrateur.etatPourPopup(null)).toEqual({
      etat: "non-apparie",
      pseudo: null,
      chaine: null,
      messageErreur: null,
    });

    await essai.orchestrateur.signalerEtatLecture(signal(PAGE, true));
    expect(await essai.orchestrateur.etatPourPopup("Kra")).toEqual({
      etat: "en-lecture",
      pseudo: "Kra",
      chaine: "machaine",
      messageErreur: null,
    });

    await essai.orchestrateur.signalerEtatLecture(signal(PAGE, false));
    expect(await essai.orchestrateur.etatPourPopup("Kra")).toMatchObject({
      etat: "en-pause",
    });
  });
});

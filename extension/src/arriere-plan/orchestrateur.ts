/**
 * Orchestration d'une session de visionnage côté extension.
 *
 * Même cycle de vie que le lecteur embarqué du site
 * (frontend/src/hooks/useSessionVisionnage.ts) : ouverture au premier
 * démarrage réel de la lecture, heartbeats tant que la lecture dure,
 * clôture au changement de chaîne ou à la disparition de la page. Deux
 * contraintes propres à MV3 justifient une écriture différente :
 *
 * 1. Le service worker est arrêté dès qu'il est inactif. Aucune variable
 *    en mémoire ne survit : tout l'état vit dans un dépôt fourni par
 *    l'appelant (`chrome.storage.session` en production, un objet en
 *    mémoire dans les tests).
 * 2. Le service worker ne peut pas interroger la page (l'extension ne
 *    demande aucune permission d'hôte sur les plateformes). C'est donc
 *    le script de contenu qui pousse son état à intervalle régulier, et
 *    l'orchestrateur décide, à chaque signal reçu, s'il est temps
 *    d'envoyer un heartbeat.
 */

import { HEARTBEAT_DELAI_BASE_MS } from "../commun/config";
import { prochainDelaiHeartbeatMs } from "../commun/cadence";
import { ErreurApi } from "../commun/api";
import type { MessageEtatLecture, ReponseEtatExtension } from "../commun/messages";
import type { PageDeVisionnage } from "../commun/plateformes";
import { memePage } from "../commun/plateformes";
import type { SessionVisionnage, ReponseHeartbeat } from "../commun/endpoints";

// ─── État persistant ─────────────────────────────────────────────────────────

export interface EtatOrchestrateur {
  page: PageDeVisionnage | null;
  sessionId: string | null;
  enLecture: boolean;
  positionSecondes: number;
  dernierSignalMs: number;
  dernierHeartbeatMs: number;
  /** Délai visé avant le prochain heartbeat, régénéré à chaque envoi. */
  delaiCourantMs: number;
  /** Suspendu jusqu'au prochain changement de page après une erreur bloquante. */
  suspendu: boolean;
  messageErreur: string | null;
}

export const ETAT_INITIAL: EtatOrchestrateur = {
  page: null,
  sessionId: null,
  enLecture: false,
  positionSecondes: 0,
  dernierSignalMs: 0,
  dernierHeartbeatMs: 0,
  delaiCourantMs: HEARTBEAT_DELAI_BASE_MS,
  suspendu: false,
  messageErreur: null,
};

export interface DepotEtat {
  lire: () => Promise<EtatOrchestrateur>;
  ecrire: (etat: EtatOrchestrateur) => Promise<void>;
}

/**
 * Au-delà de ce silence, la page est considérée disparue (onglet fermé,
 * navigation, plantage) et la session est close. La valeur reste sous le
 * plafond de plausibilité du serveur pour qu'une reprise après silence
 * ouvre une nouvelle session au lieu de prolonger l'ancienne.
 */
export const SILENCE_AVANT_CLOTURE_MS = 90_000;

// ─── Dépendances ─────────────────────────────────────────────────────────────

export interface DependancesOrchestrateur {
  depot: DepotEtat;
  /** Jeton d'appariement courant, null si l'extension n'est pas appariée. */
  lireJeton: () => Promise<string | null>;
  ouvrirSession: (
    jeton: string,
    page: PageDeVisionnage,
  ) => Promise<SessionVisionnage>;
  envoyerHeartbeat: (
    jeton: string,
    sessionId: string,
    positionSecondes: number,
  ) => Promise<ReponseHeartbeat>;
  fermerSession: (jeton: string, sessionId: string) => Promise<unknown>;
  maintenant?: () => number;
  aleatoire?: () => number;
}

export interface Orchestrateur {
  signalerEtatLecture: (message: MessageEtatLecture) => Promise<void>;
  terminerPage: () => Promise<void>;
  /** Ferme la session si le script de contenu s'est tu trop longtemps. */
  verifierSilence: () => Promise<void>;
  etatPourPopup: (pseudo: string | null, langue?: "fr" | "en") => Promise<ReponseEtatExtension>;
}

// ─── Messages d'erreur ───────────────────────────────────────────────────────

const MESSAGE_NON_APPARIE =
  "Connecte l'extension à ton compte pour compter ton temps de visionnage.";
const MESSAGE_REFUS_AUTHENTIFICATION =
  "Le suivi n'a pas été accepté par le serveur. Réassocie l'extension à ton compte depuis le site.";
const MESSAGE_GENERIQUE =
  "Le suivi de ton visionnage est interrompu. Recharge la page du direct.";

function localiserMessage(message: string | null, langue: "fr" | "en"): string | null {
  if (message === null || langue === "fr") return message;
  return {
    [MESSAGE_NON_APPARIE]: "Pair the extension with your account to track your watch time.",
    [MESSAGE_REFUS_AUTHENTIFICATION]: "Tracking was refused by the server. Pair the extension with your account again from the website.",
    [MESSAGE_GENERIQUE]: "Your watch tracking was interrupted. Reload the live stream page.",
  }[message] ?? message;
}

// ─── Orchestrateur ───────────────────────────────────────────────────────────

export function creerOrchestrateur({
  depot,
  lireJeton,
  ouvrirSession,
  envoyerHeartbeat,
  fermerSession,
  maintenant = () => Date.now(),
  aleatoire = Math.random,
}: DependancesOrchestrateur): Orchestrateur {
  /**
   * Un délai tiré au hasard dans une fenêtre, et non une période fixe :
   * le serveur invalide une session dont cinq intervalles consécutifs
   * sont rigoureusement identiques, ce qui est précisément le motif que
   * produirait une minuterie régulière. Ce tirage ne suffit pas à lui
   * seul : la période des signaux du script de contenu est tirée elle
   * aussi, sans quoi tous les heartbeats retomberaient sur la même
   * grille (voir `commun/cadence.ts`).
   */
  function prochainDelai(): number {
    return prochainDelaiHeartbeatMs(aleatoire);
  }

  async function cloturer(
    etat: EtatOrchestrateur,
    jeton: string | null,
  ): Promise<void> {
    if (etat.sessionId !== null && jeton !== null) {
      // Une clôture qui échoue n'est pas rattrapable côté client : le
      // serveur finira par considérer la session comme abandonnée.
      await fermerSession(jeton, etat.sessionId).catch(() => undefined);
    }
  }

  /**
   * Traduit un échec d'appel en décision : reprendre plus tard, ou
   * suspendre le suivi jusqu'au prochain changement de page.
   *
   * 400 (intervalle jugé non plausible) et 409 (heartbeat concurrent)
   * sont transitoires, le serveur se resynchronise de lui-même. 401 et
   * 403 sont définitifs pour cette page : insister ne ferait que
   * marteler une route qui refuse.
   */
  function appliquerErreur(
    etat: EtatOrchestrateur,
    exception: unknown,
  ): EtatOrchestrateur {
    if (
      exception instanceof ErreurApi &&
      (exception.statut === 400 || exception.statut === 409)
    ) {
      return etat;
    }
    const message =
      exception instanceof ErreurApi && exception.statut === 401
        ? MESSAGE_REFUS_AUTHENTIFICATION
        : exception instanceof ErreurApi && exception.message
          ? exception.message
          : MESSAGE_GENERIQUE;
    return {
      ...etat,
      sessionId: null,
      suspendu: true,
      messageErreur: message,
    };
  }

  return {
    // ─── Signal du script de contenu ─────────────────────────────────────────
    async signalerEtatLecture(message) {
      const instant = maintenant();
      let etat = await depot.lire();
      const jeton = await lireJeton();

      // Changement de chaîne : la session en cours appartient à l'ancienne
      // page et doit être close avant toute chose.
      if (!memePage(etat.page, message.page)) {
        await cloturer(etat, jeton);
        etat = {
          ...ETAT_INITIAL,
          delaiCourantMs: prochainDelai(),
          page: message.page,
        };
      }

      etat = {
        ...etat,
        page: message.page,
        enLecture: message.enLecture,
        positionSecondes: message.positionSecondes,
        dernierSignalMs: instant,
      };

      if (jeton === null) {
        await depot.ecrire({ ...etat, messageErreur: MESSAGE_NON_APPARIE });
        return;
      }
      if (etat.suspendu) {
        await depot.ecrire(etat);
        return;
      }

      // La pause suspend les heartbeats sans clore la session : la reprise
      // repart sur la même session, exactement comme le lecteur du site.
      if (!message.enLecture) {
        await depot.ecrire({ ...etat, messageErreur: null });
        return;
      }

      if (etat.sessionId === null) {
        try {
          const session = await ouvrirSession(jeton, message.page);
          etat = {
            ...etat,
            sessionId: session.id,
            dernierHeartbeatMs: instant,
            delaiCourantMs: prochainDelai(),
            messageErreur: null,
          };
        } catch (exception) {
          await depot.ecrire(appliquerErreur(etat, exception));
          return;
        }
        await depot.ecrire(etat);
        return;
      }

      if (instant - etat.dernierHeartbeatMs < etat.delaiCourantMs) {
        await depot.ecrire({ ...etat, messageErreur: null });
        return;
      }

      try {
        await envoyerHeartbeat(jeton, etat.sessionId, message.positionSecondes);
        etat = {
          ...etat,
          dernierHeartbeatMs: instant,
          delaiCourantMs: prochainDelai(),
          messageErreur: null,
        };
      } catch (exception) {
        etat = appliquerErreur(etat, exception);
        // Une erreur transitoire ne doit pas replanifier immédiatement un
        // heartbeat : on décale comme si l'envoi avait réussi.
        if (!etat.suspendu) {
          etat = { ...etat, dernierHeartbeatMs: instant };
        }
      }
      await depot.ecrire(etat);
    },

    // ─── Fin de page ─────────────────────────────────────────────────────────
    async terminerPage() {
      const etat = await depot.lire();
      if (etat.page === null && etat.sessionId === null) {
        return;
      }
      await cloturer(etat, await lireJeton());
      await depot.ecrire({ ...ETAT_INITIAL });
    },

    // ─── Chien de garde ──────────────────────────────────────────────────────
    async verifierSilence() {
      const etat = await depot.lire();
      if (etat.dernierSignalMs === 0) {
        return;
      }
      if (maintenant() - etat.dernierSignalMs < SILENCE_AVANT_CLOTURE_MS) {
        return;
      }
      await cloturer(etat, await lireJeton());
      await depot.ecrire({ ...ETAT_INITIAL });
    },

    // ─── État affiché par la popup ───────────────────────────────────────────
    async etatPourPopup(pseudo, langue = "fr") {
      const etat = await depot.lire();
      const chaine = etat.page?.identifiantChaine ?? null;
      if (pseudo === null) {
        return {
          etat: "non-apparie",
          pseudo: null,
          chaine,
          messageErreur: null,
        };
      }
      if (etat.suspendu) {
        return {
          etat: "erreur",
          pseudo,
          chaine,
          messageErreur: localiserMessage(etat.messageErreur, langue),
        };
      }
      if (etat.page === null) {
        return { etat: "inactif", pseudo, chaine: null, messageErreur: null };
      }
      return {
        etat: etat.enLecture ? "en-lecture" : "en-pause",
        pseudo,
        chaine,
        messageErreur: null,
      };
    },
  };
}

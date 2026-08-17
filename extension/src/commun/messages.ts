/**
 * Messages échangés entre le script de contenu, la popup et le service
 * worker. Le service worker MV3 étant arrêté puis relancé à volonté par
 * Chrome, chaque message doit être auto-suffisant : il porte l'état
 * complet de la page émettrice, jamais un delta qui supposerait que le
 * destinataire se souvienne du message précédent.
 */

import type { PageDeVisionnage } from "./plateformes";
import { estPageDeVisionnage } from "./plateformes";

// ─── Script de contenu vers service worker ────────────────────────────────────

export interface MessageEtatLecture {
  type: "etat-lecture";
  page: PageDeVisionnage;
  enLecture: boolean;
  positionSecondes: number;
}

/** Émis quand la page cesse d'être une page de visionnage suivie. */
export interface MessageFinPage {
  type: "fin-page";
}

// ─── Popup vers service worker ────────────────────────────────────────────────

export interface MessageEtatExtension {
  type: "etat-extension";
}

export interface MessageAppariementModifie {
  type: "appariement-modifie";
}

export type MessageExtension =
  | MessageEtatLecture
  | MessageFinPage
  | MessageEtatExtension
  | MessageAppariementModifie;

// ─── Validation ───────────────────────────────────────────────────────────────

/**
 * Le service worker ne reçoit en théorie que ses propres émetteurs, mais
 * le script de contenu s'exécute dans des pages tierces dont il tire une
 * partie du contenu du message (l'identifiant de chaîne vient du balisage
 * de la page). Un message est donc traité comme une entrée non fiable et
 * validé avant usage, au même titre qu'un payload d'API
 * (docs/05-security.md, « Validation d'entrée »).
 */
export function estMessageExtension(
  valeur: unknown,
): valeur is MessageExtension {
  if (typeof valeur !== "object" || valeur === null) {
    return false;
  }
  const candidat = valeur as { type?: unknown };
  switch (candidat.type) {
    case "fin-page":
    case "etat-extension":
    case "appariement-modifie":
      return true;
    case "etat-lecture": {
      const message = valeur as Partial<MessageEtatLecture>;
      return (
        estPageDeVisionnage(message.page) &&
        typeof message.enLecture === "boolean" &&
        typeof message.positionSecondes === "number" &&
        Number.isFinite(message.positionSecondes) &&
        message.positionSecondes >= 0
      );
    }
    default:
      return false;
  }
}

// ─── Réponse d'état pour la popup ─────────────────────────────────────────────

export type EtatSuivi =
  | "inactif"
  | "non-apparie"
  | "en-lecture"
  | "en-pause"
  | "erreur";

export interface ReponseEtatExtension {
  etat: EtatSuivi;
  pseudo: string | null;
  /** Chaîne suivie, si une page de visionnage est ouverte. */
  chaine: string | null;
  messageErreur: string | null;
}

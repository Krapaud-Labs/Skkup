/**
 * Messages échangés entre le script de contenu, la popup et le service
 * worker. Le service worker MV3 étant arrêté puis relancé à volonté par
 * Chrome, chaque message doit être auto-suffisant : il porte l'état
 * complet de la page émettrice, jamais un delta qui supposerait que le
 * destinataire se souvienne du message précédent.
 */

import type { PageDeVisionnage } from "./plateformes";

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

/**
 * Service worker de l'extension : câblage entre les API du navigateur et
 * l'orchestrateur de session, qui porte toute la logique.
 *
 * L'état de suivi est rangé dans `storage.session` et non dans
 * `storage.local` : il n'a aucune raison de survivre à la fermeture du
 * navigateur, et ce stockage n'est pas écrit sur disque. Le jeton
 * d'appariement, lui, doit survivre aux redémarrages et vit donc dans
 * `storage.local`.
 */

import type { Runtime } from "webextension-polyfill";
import { navigateur } from "../commun/navigateur";
import { ALARME_HEARTBEAT } from "../commun/config";
import {
  envoyerHeartbeat,
  fermerSession,
  ouvrirSession,
} from "../commun/endpoints";
import type { MessageExtension } from "../commun/messages";
import { estMessageExtension } from "../commun/messages";
import { creerDepotJeton } from "../commun/stockage-jeton";
import type { StockageLocal } from "../commun/stockage-jeton";
import {
  ETAT_INITIAL,
  creerOrchestrateur,
  type EtatOrchestrateur,
} from "./orchestrateur";

// ─── Dépôts ──────────────────────────────────────────────────────────────────

const depotJeton = creerDepotJeton(
  navigateur.storage.local as unknown as StockageLocal,
);

const CLE_ETAT = "suivi";

const depotEtat = {
  async lire(): Promise<EtatOrchestrateur> {
    const stocke = await navigateur.storage.session.get(CLE_ETAT);
    // Un service worker relancé retrouve un stockage vide au premier
    // démarrage du navigateur : on repart d'un état neutre.
    return (stocke[CLE_ETAT] as EtatOrchestrateur | undefined) ?? ETAT_INITIAL;
  },
  async ecrire(etat: EtatOrchestrateur): Promise<void> {
    await navigateur.storage.session.set({ [CLE_ETAT]: etat });
  },
};

// ─── Orchestrateur ───────────────────────────────────────────────────────────

const orchestrateur = creerOrchestrateur({
  depot: depotEtat,
  lireJeton: async () => (await depotJeton.lire())?.jeton ?? null,
  ouvrirSession: (jeton, page) =>
    ouvrirSession(jeton, page.plateforme, page.identifiantChaine),
  envoyerHeartbeat: (jeton, sessionId, position) =>
    envoyerHeartbeat(jeton, sessionId, position, true),
  fermerSession,
});

// ─── Messages ────────────────────────────────────────────────────────────────

navigateur.runtime.onMessage.addListener(
  (message: unknown, expediteur: Runtime.MessageSender) => {
    // Deux filtres avant toute action : l'émetteur doit être un contexte
    // de cette extension (script de contenu ou popup), et le message doit
    // avoir la forme attendue. Le script de contenu vit dans des pages
    // tierces et en tire une partie du contenu du message : rien de ce qui
    // arrive ici n'est traité comme fiable sur parole.
    if (expediteur?.id !== navigateur.runtime.id) {
      return undefined;
    }
    if (!estMessageExtension(message)) {
      return undefined;
    }
    const recu: MessageExtension = message;
    switch (recu.type) {
      case "etat-lecture":
        return orchestrateur.signalerEtatLecture(recu);
      case "fin-page":
        return orchestrateur.terminerPage();
      case "appariement-modifie":
        // Un nouvel appariement (ou un désappariement) rend la session en
        // cours inexploitable : on repart de zéro plutôt que de continuer
        // à battre pour un jeton qui n'est plus celui de l'utilisateur.
        return orchestrateur.terminerPage();
      case "etat-extension":
        return depotJeton
          .lire()
          .then((appariement) =>
            orchestrateur.etatPourPopup(appariement?.pseudo ?? null),
          );
      default:
        return undefined;
    }
  },
);

// ─── Chien de garde ──────────────────────────────────────────────────────────

// Un onglet fermé brutalement n'envoie pas toujours son `pagehide` : sans
// ce réveil périodique, la session resterait ouverte côté serveur.
navigateur.alarms.create(ALARME_HEARTBEAT, { periodInMinutes: 1 });

navigateur.alarms.onAlarm.addListener((alarme) => {
  if (alarme.name !== ALARME_HEARTBEAT) {
    return;
  }
  void orchestrateur.verifierSilence();
});

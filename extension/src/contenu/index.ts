/**
 * Script de contenu injecté sur les pages de visionnage.
 *
 * Son rôle est strictement d'observer : trouver l'élément vidéo de la
 * plateforme, suivre ses événements de lecture, et pousser l'état au
 * service worker. Il ne parle jamais à l'API et ne voit jamais le jeton
 * d'appariement : un script qui s'exécute dans une page tierce ne doit
 * pas avoir de credential à portée de main.
 *
 * Il pousse son état à intervalle régulier et pas seulement aux
 * changements, pour deux raisons : le service worker MV3 est arrêté dès
 * qu'il est inactif et ces messages le réveillent, et l'extension ne
 * demandant aucune permission d'hôte sur les plateformes, le service
 * worker n'aurait aucun moyen d'interroger la page de lui-même.
 */

import { navigateur } from "../commun/navigateur";
import type { MessageEtatLecture, MessageFinPage } from "../commun/messages";
import { analyserPage, memePage } from "../commun/plateformes";
import type { PageDeVisionnage } from "../commun/plateformes";
import { creerDetecteurLecture } from "./detecteur-lecture";
import { lireIndicesPage } from "./indices-page";

// ─── Cadence ──────────────────────────────────────────────────────────────────

/**
 * Rythme des signaux envoyés au service worker pendant la lecture. Plus
 * court que le délai entre deux heartbeats : c'est le service worker qui
 * décide du moment d'appeler l'API, le script de contenu se contente de
 * lui fournir un état frais.
 */
const PERIODE_SIGNAL_MS = 15_000;

/** Fréquence de contrôle de l'URL et de la présence du lecteur. */
const PERIODE_INSPECTION_MS = 2_000;

// ─── État courant de la page ──────────────────────────────────────────────────

let pageCourante: PageDeVisionnage | null = null;

function pageObservee(): PageDeVisionnage | null {
  const indices = lireIndicesPage(
    window.location.hostname,
    (selecteur, attribut) =>
      document.querySelector(selecteur)?.getAttribute(attribut) ?? null,
  );
  return analyserPage(window.location.href, indices);
}

// ─── Envoi au service worker ──────────────────────────────────────────────────

/**
 * Le service worker peut être en cours d'arrêt au moment de l'envoi :
 * l'échec est normal et sans conséquence, le signal suivant le
 * réveillera.
 */
function envoyer(message: MessageEtatLecture | MessageFinPage): void {
  void navigateur.runtime.sendMessage(message).catch(() => undefined);
}

const detecteur = creerDetecteurLecture({
  pageVisible: () => document.visibilityState === "visible" && document.hasFocus(),
  surChangement: (etat) => {
    if (pageCourante === null) {
      return;
    }
    envoyer({
      type: "etat-lecture",
      page: pageCourante,
      enLecture: etat.enLecture,
      positionSecondes: etat.positionSecondes,
    });
  },
});

// ─── Boucles d'observation ────────────────────────────────────────────────────

/**
 * Twitch et YouTube naviguent sans rechargement : l'URL change alors que
 * le script de contenu reste en place, et l'élément vidéo est remplacé.
 * Une inspection périodique couvre ces deux cas sans dépendre d'un
 * détail d'implémentation de la plateforme.
 */
function inspecter(): void {
  const page = pageObservee();
  if (!memePage(page, pageCourante)) {
    if (pageCourante !== null && page === null) {
      envoyer({ type: "fin-page" });
    }
    pageCourante = page;
  }

  if (pageCourante === null) {
    detecteur.detacher();
    return;
  }

  const video = document.querySelector("video");
  if (video === null) {
    detecteur.detacher();
    return;
  }
  detecteur.attacher(video);
}

function signalerPeriodiquement(): void {
  const etat = detecteur.etatCourant();
  if (pageCourante === null || !etat.enLecture) {
    return;
  }
  envoyer({
    type: "etat-lecture",
    page: pageCourante,
    enLecture: true,
    positionSecondes: etat.positionSecondes,
  });
}

document.addEventListener("visibilitychange", () => detecteur.reevaluer());
window.addEventListener("focus", () => detecteur.reevaluer());
window.addEventListener("blur", () => detecteur.reevaluer());

// `pagehide` plutôt que `unload` : c'est le seul signal fiable quand la
// page part en cache de navigation arrière/avant.
window.addEventListener("pagehide", () => {
  detecteur.detacher();
  if (pageCourante !== null) {
    envoyer({ type: "fin-page" });
    pageCourante = null;
  }
});

inspecter();
setInterval(inspecter, PERIODE_INSPECTION_MS);
setInterval(signalerPeriodiquement, PERIODE_SIGNAL_MS);

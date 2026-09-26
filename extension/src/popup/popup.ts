/**
 * Popup de l'extension : association du compte et état du suivi.
 *
 * Le jeton reçu est écrit directement dans `storage.local` par le dépôt
 * dédié : il ne transite ni par le DOM, ni par une variable globale, et
 * n'est jamais réaffiché. La popup ne fait que deux choses avec lui :
 * l'enregistrer à l'association, et le supprimer à la dissociation.
 */

import { apparier } from "../commun/endpoints";
import { ErreurApi } from "../commun/api";
import { navigateur } from "../commun/navigateur";
import type { ReponseEtatExtension } from "../commun/messages";
import { creerDepotJeton } from "../commun/stockage-jeton";
import type { StockageLocal } from "../commun/stockage-jeton";
import { codeComplet, formaterCodeSaisi } from "./code-appariement";

const depotJeton = creerDepotJeton(
  navigateur.storage.local as unknown as StockageLocal,
);

// ─── Éléments ────────────────────────────────────────────────────────────────

function element<T extends HTMLElement>(id: string): T {
  const trouve = document.getElementById(id);
  if (trouve === null) {
    throw new Error(`Élément introuvable dans la popup : ${id}`);
  }
  return trouve as T;
}

const sectionAppariement = element<HTMLElement>("section-appariement");
const sectionSuivi = element<HTMLElement>("section-suivi");
const formulaire = element<HTMLFormElement>("formulaire-appariement");
const champCode = element<HTMLInputElement>("champ-code");
const boutonAssocier = element<HTMLButtonElement>("bouton-associer");
const boutonDissocier = element<HTMLButtonElement>("bouton-dissocier");
const pseudo = element<HTMLElement>("pseudo");
const pastille = element<HTMLElement>("pastille");
const libelleStatut = element<HTMLElement>("libelle-statut");
const chaine = element<HTMLElement>("chaine");
const message = element<HTMLElement>("message");
const accroche = element<HTMLElement>("accroche");
const texteAppariement = element<HTMLElement>("texte-appariement");
const etiquetteCode = element<HTMLElement>("etiquette-code");
const libelleAssocier = element<HTMLElement>("libelle-associer");
const texteConnecte = element<HTMLElement>("texte-connecte");
const libelleDissocier = element<HTMLElement>("libelle-dissocier");
const selectLangue = element<HTMLSelectElement>("select-langue");
const titreAppariement = element<HTMLElement>("titre-appariement");
const titreSuivi = element<HTMLElement>("titre-suivi");

type Langue = "fr" | "en";
type Libelles = {
  appariement: string;
  suivi: string;
  accroche: string;
  texteAppariement: string;
  etiquetteCode: string;
  associer: string;
  connecte: string;
  dissocier: string;
  chaine: string;
  codeInvalide: string;
  association: string;
  associationReussie: (pseudo: string) => string;
  associationErreur: string;
  dissociation: string;
  statuts: Record<ReponseEtatExtension["etat"], string>;
};
const libelles: Record<Langue, Libelles> = {
  fr: {
    appariement: "Associer l'extension", suivi: "Suivi actif",
    accroche: "Ton temps de visionnage compte.",
    texteAppariement: "Depuis ton compte sur le site, génère un code d'association puis recopie-le ici. Il reste valable 5 minutes.",
    etiquetteCode: "Code d'association", associer: "Associer mon compte",
    connecte: "Connecté en tant que", dissocier: "Dissocier cet appareil",
    chaine: "Chaîne suivie :", codeInvalide: "Le code compte 12 caractères.",
    association: "Association en cours…", associationReussie: (pseudo) => `Compte associé : ${pseudo}.`,
    associationErreur: "Association impossible. Réessaie.",
    dissociation: "Appareil dissocié. Le jeton reste valable côté serveur jusqu'à son expiration.",
    statuts: { inactif: "Aucun direct détecté", "non-apparie": "Compte non associé", "en-lecture": "Visionnage en cours", "en-pause": "Lecture en pause", erreur: "Suivi interrompu" },
  },
  en: {
    appariement: "Pair extension", suivi: "Tracking active",
    accroche: "Your watch time counts.",
    texteAppariement: "From your account on the website, generate a pairing code and enter it here. It remains valid for 5 minutes.",
    etiquetteCode: "Pairing code", associer: "Pair my account",
    connecte: "Connected as", dissocier: "Unpair this device",
    chaine: "Channel followed:", codeInvalide: "The code must contain 12 characters.",
    association: "Pairing in progress…", associationReussie: (pseudo) => `Account paired: ${pseudo}.`,
    associationErreur: "Pairing failed. Please try again.",
    dissociation: "Device unpaired. The token remains valid on the server until it expires.",
    statuts: { inactif: "No live stream detected", "non-apparie": "Account not paired", "en-lecture": "Watching in progress", "en-pause": "Playback paused", erreur: "Tracking interrupted" },
  },
};
let langueActive: Langue = "fr";
function appliquerLangue(langue: Langue): void {
  langueActive = langue;
  const textes = libelles[langue];
  selectLangue.value = langue;
  titreAppariement.textContent = textes.appariement;
  titreSuivi.textContent = textes.suivi;
  accroche.textContent = textes.accroche;
  texteAppariement.textContent = textes.texteAppariement;
  etiquetteCode.textContent = textes.etiquetteCode;
  libelleAssocier.textContent = textes.associer;
  texteConnecte.firstChild!.textContent = `${textes.connecte} `;
  libelleDissocier.textContent = textes.dissocier;
  document.documentElement.lang = langue;
  void navigateur.storage.local.set({ skkupLanguage: langue });
}
void navigateur.storage.local.get("skkupLanguage").then((resultat) => {
  const memorisee = resultat.skkupLanguage;
  appliquerLangue(memorisee === "en" || memorisee === "fr" ? memorisee : (navigator.language.toLowerCase().startsWith("fr") ? "fr" : "en"));
});
selectLangue.addEventListener("change", () => appliquerLangue(selectLangue.value as Langue));

// ─── Rendu ───────────────────────────────────────────────────────────────────

const PASTILLES_STATUT: Record<ReponseEtatExtension["etat"], string> = {
  inactif: "", "non-apparie": "probleme", "en-lecture": "active", "en-pause": "attente", erreur: "probleme",
};

function afficherMessage(texte: string, variante: "" | "erreur" | "succes"): void {
  message.textContent = texte;
  message.className = variante === "" ? "message" : `message ${variante}`;
}

const messagesSuivi: Record<string, string> = {
  "Connecte l'extension à ton compte pour compter ton temps de visionnage.": "Connect the extension to your account to track your watch time.",
  "Le suivi n'a pas été accepté par le serveur. Réassocie l'extension à ton compte depuis le site.": "Tracking was not accepted by the server. Pair the extension with your account again from the website.",
  "Le suivi de ton visionnage est interrompu. Recharge la page du direct.": "Watch tracking was interrupted. Reload the live stream page.",
  "Une erreur est survenue. Merci de réessayer.": "An error occurred. Please try again.",
  "Impossible de joindre le serveur.": "Unable to reach the server.",
};

function traduireMessageSuivi(texte: string): string {
  return langueActive === "en" ? messagesSuivi[texte] ?? texte : texte;
}

function rendre(etat: ReponseEtatExtension): void {
  const apparie = etat.pseudo !== null;
  sectionAppariement.hidden = apparie;
  sectionSuivi.hidden = !apparie;
  if (!apparie) {
    return;
  }

  pseudo.textContent = etat.pseudo;
  const libelle = libelles[langueActive].statuts[etat.etat];
  libelleStatut.textContent = libelle;
  pastille.className = `pastille ${PASTILLES_STATUT[etat.etat]}`.trim();

  chaine.hidden = etat.chaine === null;
  chaine.textContent = etat.chaine === null ? "" : `${libelles[langueActive].chaine} ${etat.chaine}`;

  if (etat.messageErreur !== null) {
    afficherMessage(traduireMessageSuivi(etat.messageErreur), "erreur");
  }
}

/**
 * Le service worker connaît l'état de suivi ; s'il ne répond pas (il
 * vient d'être arrêté, ou aucune page de direct n'est ouverte), on se
 * rabat sur le seul fait d'être associé ou non.
 */
async function rafraichir(): Promise<void> {
  try {
    const etat = (await navigateur.runtime.sendMessage({
      type: "etat-extension",
    })) as ReponseEtatExtension | undefined;
    if (etat) {
      rendre(etat);
      return;
    }
  } catch {
    // Service worker indisponible : repli ci-dessous.
  }
  const appariement = await depotJeton.lire();
  rendre({
    etat: appariement === null ? "non-apparie" : "inactif",
    pseudo: appariement?.pseudo ?? null,
    chaine: null,
    messageErreur: null,
  });
}

// ─── Interactions ────────────────────────────────────────────────────────────

champCode.addEventListener("input", () => {
  champCode.value = formaterCodeSaisi(champCode.value);
});

formulaire.addEventListener("submit", (evenement) => {
  evenement.preventDefault();
  const code = champCode.value;
  if (!codeComplet(code)) {
    afficherMessage(libelles[langueActive].codeInvalide, "erreur");
    champCode.focus();
    return;
  }

  boutonAssocier.disabled = true;
  afficherMessage(libelles[langueActive].association, "");

  void apparier(code)
    .then(async (reponse) => {
      await depotJeton.enregistrer({
        jeton: reponse.jetonExtension,
        expireAt: reponse.expireAt,
        pseudo: reponse.pseudo,
      });
      // Le service worker doit repartir sur une base neutre : la session
      // éventuellement ouverte l'était pour un autre jeton.
      await navigateur.runtime
        .sendMessage({ type: "appariement-modifie" })
        .catch(() => undefined);
      champCode.value = "";
      afficherMessage(libelles[langueActive].associationReussie(reponse.pseudo), "succes");
      await rafraichir();
    })
    .catch((exception: unknown) => {
      afficherMessage(
        exception instanceof ErreurApi
          ? exception.message
          : libelles[langueActive].associationErreur,
        "erreur",
      );
    })
    .finally(() => {
      boutonAssocier.disabled = false;
    });
});

boutonDissocier.addEventListener("click", () => {
  void (async () => {
    await depotJeton.effacer();
    await navigateur.runtime
      .sendMessage({ type: "appariement-modifie" })
      .catch(() => undefined);
    afficherMessage(
      libelles[langueActive].dissociation,
      "",
    );
    await rafraichir();
  })();
});

void rafraichir();

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

// ─── Éléments ─────────────────────────────────────────────────────────────────

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

// ─── Rendu ────────────────────────────────────────────────────────────────────

const LIBELLES_STATUT: Record<
  ReponseEtatExtension["etat"],
  { texte: string; pastille: string }
> = {
  inactif: {
    texte: "Aucun direct détecté",
    pastille: "",
  },
  "non-apparie": {
    texte: "Compte non associé",
    pastille: "probleme",
  },
  "en-lecture": {
    texte: "Visionnage en cours",
    pastille: "active",
  },
  "en-pause": {
    texte: "Lecture en pause",
    pastille: "attente",
  },
  erreur: {
    texte: "Suivi interrompu",
    pastille: "probleme",
  },
};

function afficherMessage(texte: string, variante: "" | "erreur" | "succes"): void {
  message.textContent = texte;
  message.className = variante === "" ? "message" : `message ${variante}`;
}

function rendre(etat: ReponseEtatExtension): void {
  const apparie = etat.pseudo !== null;
  sectionAppariement.hidden = apparie;
  sectionSuivi.hidden = !apparie;
  if (!apparie) {
    return;
  }

  pseudo.textContent = etat.pseudo;
  const libelle = LIBELLES_STATUT[etat.etat];
  libelleStatut.textContent = libelle.texte;
  pastille.className = `pastille ${libelle.pastille}`.trim();

  chaine.hidden = etat.chaine === null;
  chaine.textContent = etat.chaine === null ? "" : `Chaîne suivie : ${etat.chaine}`;

  if (etat.messageErreur !== null) {
    afficherMessage(etat.messageErreur, "erreur");
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

// ─── Interactions ─────────────────────────────────────────────────────────────

champCode.addEventListener("input", () => {
  champCode.value = formaterCodeSaisi(champCode.value);
});

formulaire.addEventListener("submit", (evenement) => {
  evenement.preventDefault();
  const code = champCode.value;
  if (!codeComplet(code)) {
    afficherMessage("Le code compte 12 caractères.", "erreur");
    champCode.focus();
    return;
  }

  boutonAssocier.disabled = true;
  afficherMessage("Association en cours…", "");

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
      afficherMessage(`Compte associé : ${reponse.pseudo}.`, "succes");
      await rafraichir();
    })
    .catch((exception: unknown) => {
      afficherMessage(
        exception instanceof ErreurApi
          ? exception.message
          : "Association impossible. Réessaie.",
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
      "Appareil dissocié. Le jeton reste valable côté serveur jusqu'à son expiration.",
      "",
    );
    await rafraichir();
  })();
});

void rafraichir();

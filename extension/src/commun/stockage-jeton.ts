/**
 * Conservation du jeton d'appariement.
 *
 * `chrome.storage.local` est le seul stockage disponible ici : une
 * extension MV3 n'a pas de `localStorage` partagé avec le site, et le
 * service worker n'a de toute façon pas de document. Ce stockage n'est
 * pas chiffré (le contexte sécurité agentic le documente comme risque assumé : un
 * logiciel ayant accès au profil du navigateur peut le lire), d'où un
 * jeton opaque, révocable et borné à 30 jours côté serveur plutôt qu'un
 * credential de compte.
 *
 * Le dépôt reçoit son stockage en paramètre : cela le rend vérifiable
 * sans navigateur, et empêche le reste du code d'aller lire la clé
 * directement.
 */

// ─── Contrat minimal de chrome.storage.local ─────────────────────────────────

export interface StockageLocal {
  get(cles: string | string[]): Promise<Record<string, unknown>>;
  set(valeurs: Record<string, unknown>): Promise<void>;
  remove(cles: string | string[]): Promise<void>;
}

export interface Appariement {
  jeton: string;
  /** Fin de validité annoncée par le backend, en ISO 8601. */
  expireAt: string;
  pseudo: string;
}

const CLE_APPARIEMENT = "appariement";

// ─── Dépôt ───────────────────────────────────────────────────────────────────

export interface DepotJeton {
  lire: () => Promise<Appariement | null>;
  enregistrer: (appariement: Appariement) => Promise<void>;
  effacer: () => Promise<void>;
}

export function creerDepotJeton(stockage: StockageLocal): DepotJeton {
  return {
    /**
     * Renvoie l'appariement courant, ou null s'il est absent, malformé ou
     * périmé. Un jeton expiré est effacé au passage : le garder ne ferait
     * que produire des 401 en boucle et laisserait un secret inutile dans
     * le profil du navigateur.
     */
    async lire() {
      const stocke = (await stockage.get(CLE_APPARIEMENT))[CLE_APPARIEMENT];
      const appariement = valider(stocke);
      if (appariement === null) {
        return null;
      }
      if (Date.parse(appariement.expireAt) <= Date.now()) {
        await stockage.remove(CLE_APPARIEMENT);
        return null;
      }
      return appariement;
    },

    async enregistrer(appariement) {
      await stockage.set({ [CLE_APPARIEMENT]: appariement });
    },

    async effacer() {
      await stockage.remove(CLE_APPARIEMENT);
    },
  };
}

/** Écarte une valeur stockée qui ne correspond plus à la forme attendue. */
function valider(valeur: unknown): Appariement | null {
  if (typeof valeur !== "object" || valeur === null) {
    return null;
  }
  const candidat = valeur as Partial<Appariement>;
  if (
    typeof candidat.jeton !== "string" ||
    candidat.jeton.length === 0 ||
    typeof candidat.expireAt !== "string" ||
    Number.isNaN(Date.parse(candidat.expireAt)) ||
    typeof candidat.pseudo !== "string"
  ) {
    return null;
  }
  return {
    jeton: candidat.jeton,
    expireAt: candidat.expireAt,
    pseudo: candidat.pseudo,
  };
}

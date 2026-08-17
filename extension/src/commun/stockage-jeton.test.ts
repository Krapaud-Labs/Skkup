import { afterEach, describe, expect, it, vi } from "vitest";
import { creerDepotJeton } from "./stockage-jeton";
import type { StockageLocal } from "./stockage-jeton";

/** Substitut en mémoire de chrome.storage.local. */
function stockageFactice(initial: Record<string, unknown> = {}) {
  const contenu = new Map(Object.entries(initial));
  const stockage: StockageLocal = {
    get: (cles) => {
      const liste = Array.isArray(cles) ? cles : [cles];
      const resultat: Record<string, unknown> = {};
      for (const cle of liste) {
        if (contenu.has(cle)) {
          resultat[cle] = contenu.get(cle);
        }
      }
      return Promise.resolve(resultat);
    },
    set: (valeurs) => {
      for (const [cle, valeur] of Object.entries(valeurs)) {
        contenu.set(cle, valeur);
      }
      return Promise.resolve();
    },
    remove: (cles) => {
      for (const cle of Array.isArray(cles) ? cles : [cles]) {
        contenu.delete(cle);
      }
      return Promise.resolve();
    },
  };
  return { stockage, contenu };
}

const APPARIEMENT = {
  jeton: "vrx_secret",
  expireAt: "2026-09-16T09:00:00.000Z",
  pseudo: "Kra",
};

afterEach(() => {
  vi.useRealTimers();
});

describe("creerDepotJeton", () => {
  it("relit l'appariement enregistré", async () => {
    const { stockage } = stockageFactice();
    const depot = creerDepotJeton(stockage);
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-17T09:00:00.000Z"));

    await depot.enregistrer(APPARIEMENT);

    expect(await depot.lire()).toEqual(APPARIEMENT);
  });

  it("efface et ignore un jeton expiré plutôt que de le présenter", async () => {
    const { stockage, contenu } = stockageFactice({ appariement: APPARIEMENT });
    const depot = creerDepotJeton(stockage);
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-01T09:00:00.000Z"));

    expect(await depot.lire()).toBeNull();
    expect(contenu.has("appariement")).toBe(false);
  });

  it("écarte une valeur stockée malformée", async () => {
    const { stockage } = stockageFactice({ appariement: { jeton: 42 } });

    expect(await creerDepotJeton(stockage).lire()).toBeNull();
  });

  it("ne renvoie rien quand aucun appariement n'a eu lieu", async () => {
    const { stockage } = stockageFactice();

    expect(await creerDepotJeton(stockage).lire()).toBeNull();
  });

  it("supprime le jeton à la dissociation", async () => {
    const { stockage, contenu } = stockageFactice({ appariement: APPARIEMENT });

    await creerDepotJeton(stockage).effacer();

    expect(contenu.size).toBe(0);
  });
});

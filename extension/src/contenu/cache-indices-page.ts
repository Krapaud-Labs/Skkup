import type { IndicesPage } from "../commun/plateformes";

export const DELAI_RELECTURE_INDICES_MS = 5_000;

/** Cache positif par URL; les indices absents sont réessayés à intervalle borné. */
export function creerCacheIndicesPage(
  delaiRelectureMs = DELAI_RELECTURE_INDICES_MS,
) {
  let urlCourante: string | null = null;
  let indicesCourants: IndicesPage = { identifiantChaineDom: null };
  let prochaineLecture = 0;
  let aLu = false;

  return {
    lire(
      url: string,
      charger: () => IndicesPage,
      maintenant = Date.now(),
    ): IndicesPage {
      if (url !== urlCourante) {
        urlCourante = url;
        indicesCourants = { identifiantChaineDom: null };
        prochaineLecture = 0;
        aLu = false;
      }
      if (indicesCourants.identifiantChaineDom !== null) return indicesCourants;
      if (aLu && maintenant < prochaineLecture) return indicesCourants;

      indicesCourants = charger();
      aLu = true;
      prochaineLecture = maintenant + delaiRelectureMs;
      return indicesCourants;
    },
  };
}

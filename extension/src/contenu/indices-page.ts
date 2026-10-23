/**
 * Relève dans le document l'identifiant de chaîne que l'URL ne porte pas.
 *
 * Une URL `youtube.com/watch?v=…` ne dit rien de la chaîne émettrice,
 * alors que le catalogue partenaire identifie une chaîne YouTube par son
 * identifiant `UC…` (le même que celui du lecteur embarqué du site). Ces
 * marqueurs font partie du balisage public des pages (microdonnées
 * schema.org, lien canonique) : aucune lecture de contenu privé, aucun
 * script injecté dans la page.
 *
 * Le module reçoit un accesseur plutôt que `document` afin de rester
 * vérifiable sans navigateur, et parce que le balisage de ces pages
 * change régulièrement : la liste des sélecteurs est le seul endroit à
 * corriger le jour où l'une des plateformes le modifie.
 */

import type { IndicesPage } from "../commun/plateformes";

// ─── Sélecteurs ──────────────────────────────────────────────────────────────

/** Lit la valeur d'un attribut, ou null si l'élément est absent. */
export type LecteurAttribut = (
  selecteur: string,
  attribut: string,
) => string | null;

const SELECTEURS_YOUTUBE: [string, string][] = [
  ['meta[itemprop="channelId"]', "content"],
  ['meta[itemprop="identifier"]', "content"],
  ['link[itemprop="url"]', "href"],
  ['link[rel="canonical"]', "href"],
];

// ─── Extraction ──────────────────────────────────────────────────────────────

const MOTIF_CHAINE_YOUTUBE = /^UC[\w-]{20,}$/;

/** Extrait un identifiant `UC…` d'une valeur brute, qu'elle soit nue ou dans une URL. */
function identifiantYouTube(valeur: string): string | null {
  const nettoye = valeur.trim();
  if (MOTIF_CHAINE_YOUTUBE.test(nettoye)) {
    return nettoye;
  }
  const depuisUrl = /\/channel\/(UC[\w-]{20,})/.exec(nettoye);
  return depuisUrl?.[1] ?? null;
}

export function lireIndicesPage(
  hote: string,
  lireAttribut: LecteurAttribut,
): IndicesPage {
  const domaine = hote.replace(/^www\./, "");
  const [selecteurs, extraire] = domaine === "youtube.com"
    ? ([SELECTEURS_YOUTUBE, identifiantYouTube] as const)
    : ([[], () => null] as const);

  for (const [selecteur, attribut] of selecteurs) {
    const valeur = lireAttribut(selecteur, attribut);
    const identifiant = valeur === null ? null : extraire(valeur);
    if (identifiant !== null) {
      return { identifiantChaineDom: identifiant };
    }
  }
  return { identifiantChaineDom: null };
}

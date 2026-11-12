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

/** Lit le texte de scripts inline sans jamais l'exécuter. */
export type LecteurTextesInline = () => readonly string[];

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

function videoIdDepuisUrl(url: string): string | null {
  try {
    const adresse = new URL(url);
    if (adresse.pathname === "/watch") {
      return adresse.searchParams.get("v");
    }
    const segments = adresse.pathname.split("/").filter(Boolean);
    return segments[0] === "live" ? segments[1] ?? null : null;
  } catch {
    return null;
  }
}

/** Lit un objet JSON assigné à ytInitialPlayerResponse, sans évaluer le script. */
function lireObjetPlayerResponse(texte: string): unknown[] {
  const objets: unknown[] = [];
  let rechercheDepuis = 0;
  const marqueur = "ytInitialPlayerResponse";

  while (rechercheDepuis < texte.length) {
    const indexMarqueur = texte.indexOf(marqueur, rechercheDepuis);
    if (indexMarqueur < 0) break;
    rechercheDepuis = indexMarqueur + marqueur.length;

    const indexEgal = texte.indexOf("=", rechercheDepuis);
    if (indexEgal < 0 || indexEgal - rechercheDepuis > 32) continue;
    let debut = indexEgal + 1;
    while (/\s/.test(texte[debut] ?? "")) debut += 1;
    if (texte[debut] !== "{") continue;

    let profondeur = 0;
    let guillemet: '"' | "'" | null = null;
    let echappe = false;
    for (let index = debut; index < texte.length; index += 1) {
      const caractere = texte[index];
      if (guillemet !== null) {
        if (echappe) {
          echappe = false;
        } else if (caractere === "\\") {
          echappe = true;
        } else if (caractere === guillemet) {
          guillemet = null;
        }
        continue;
      }
      if (caractere === '"' || caractere === "'") {
        guillemet = caractere;
      } else if (caractere === "{") {
        profondeur += 1;
      } else if (caractere === "}") {
        profondeur -= 1;
        if (profondeur === 0) {
          try {
            objets.push(JSON.parse(texte.slice(debut, index + 1)) as unknown);
          } catch {
            // Un script inline peut contenir une expression non JSON : on l'ignore.
          }
          rechercheDepuis = index + 1;
          break;
        }
      }
    }
  }
  return objets;
}

/** Vérifie la correspondance vidéo avant de retenir l'identifiant de chaîne. */
function identifiantYouTubeInline(
  textes: readonly string[],
  videoIdAttendu: string,
): string | null {
  for (const texte of textes) {
    if (!texte.includes("ytInitialPlayerResponse")) continue;
    for (const objet of lireObjetPlayerResponse(texte)) {
      if (typeof objet !== "object" || objet === null) continue;
      const details = (objet as { videoDetails?: unknown }).videoDetails;
      if (typeof details !== "object" || details === null) continue;
      const video = details as { videoId?: unknown; channelId?: unknown };
      if (
        video.videoId === videoIdAttendu &&
        typeof video.channelId === "string" &&
        MOTIF_CHAINE_YOUTUBE.test(video.channelId)
      ) {
        return video.channelId;
      }
    }
  }
  return null;
}

export function lireIndicesPage(
  hote: string,
  lireAttribut: LecteurAttribut,
  lireTextesInline: LecteurTextesInline = () => [],
  url = "",
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
  if (domaine === "youtube.com") {
    const videoId = videoIdDepuisUrl(url);
    if (videoId !== null) {
      const identifiant = identifiantYouTubeInline(lireTextesInline(), videoId);
      if (identifiant !== null) {
        return { identifiantChaineDom: identifiant };
      }
    }
  }
  return { identifiantChaineDom: null };
}

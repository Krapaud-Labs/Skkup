/**
 * Reconnaissance d'une page de visionnage à partir de son URL.
 *
 * L'extension ne décide pas si une chaîne est partenaire : elle se
 * contente d'extraire la plateforme et l'identifiant de chaîne, puis
 * laisse le backend refuser (403) une paire absente du catalogue. Toute
 * la logique ci-dessous est donc purement descriptive, sans règle
 * métier, et testable sans navigateur.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export type Plateforme = "TWITCH" | "YOUTUBE" | "FACEBOOK";

export interface PageDeVisionnage {
  plateforme: Plateforme;
  /** Identifiant de la chaîne tel qu'attendu par `streamExternalId`. */
  identifiantChaine: string;
}

/**
 * Indices lus dans le document par le script de contenu, quand l'URL
 * seule ne porte pas l'identifiant de chaîne (cas d'une vidéo YouTube ou
 * d'un direct Facebook ouvert depuis le fil d'actualité).
 */
export interface IndicesPage {
  identifiantChaineDom?: string | null;
}

// ─── Twitch ───────────────────────────────────────────────────────────────────

/**
 * Premiers segments d'URL twitch.tv qui ne sont pas des chaînes. La liste
 * n'a pas besoin d'être exhaustive : un faux positif produit un
 * identifiant inconnu du catalogue, que le backend refuse.
 */
const SEGMENTS_TWITCH_RESERVES = new Set([
  "directory",
  "downloads",
  "drops",
  "friends",
  "inventory",
  "jobs",
  "p",
  "popout",
  "prime",
  "settings",
  "store",
  "subscriptions",
  "turbo",
  "u",
  "videos",
  "wallet",
]);

function analyserTwitch(url: URL): PageDeVisionnage | null {
  const segments = segmentsDeChemin(url);
  const login = segments[0]?.toLowerCase();
  if (!login || SEGMENTS_TWITCH_RESERVES.has(login)) {
    return null;
  }
  // Une page de chaîne peut porter un suffixe (`/about`, `/schedule`) sur
  // lequel aucun direct ne se lit : seule la racine de la chaîne compte.
  if (segments.length > 1) {
    return null;
  }
  return { plateforme: "TWITCH", identifiantChaine: login };
}

// ─── YouTube ──────────────────────────────────────────────────────────────────

/**
 * Le catalogue partenaire identifie une chaîne YouTube par son
 * identifiant `UC…` (celui qu'attend le lecteur embarqué du site). Une URL
 * `/watch?v=…` ne le contient pas : le script de contenu le relève dans
 * le document et le transmet ici.
 */
function analyserYouTube(url: URL, indices: IndicesPage): PageDeVisionnage | null {
  const segments = segmentsDeChemin(url);
  if (segments[0] === "channel" && segments[1]) {
    return { plateforme: "YOUTUBE", identifiantChaine: segments[1] };
  }

  const estPageDeLecture =
    (url.pathname === "/watch" && url.searchParams.has("v")) ||
    segments[0] === "live" ||
    segments[1] === "live";
  if (!estPageDeLecture) {
    return null;
  }

  const identifiantDom = indices.identifiantChaineDom?.trim();
  return identifiantDom
    ? { plateforme: "YOUTUBE", identifiantChaine: identifiantDom }
    : null;
}

// ─── Facebook ─────────────────────────────────────────────────────────────────

function analyserFacebook(
  url: URL,
  indices: IndicesPage,
): PageDeVisionnage | null {
  const segments = segmentsDeChemin(url);

  // Forme `facebook.com/<page>/videos/<id>` ou `facebook.com/<page>/live`.
  if (segments[0] && (segments[1] === "videos" || segments[1] === "live")) {
    return { plateforme: "FACEBOOK", identifiantChaine: segments[0] };
  }

  // Forme `facebook.com/watch/?v=<id>` : la page émettrice n'est
  // identifiable que dans le document.
  if (segments[0] === "watch") {
    const identifiantDom = indices.identifiantChaineDom?.trim();
    return identifiantDom
      ? { plateforme: "FACEBOOK", identifiantChaine: identifiantDom }
      : null;
  }

  return null;
}

// ─── Point d'entrée ───────────────────────────────────────────────────────────

/** Décrit la page de visionnage correspondant à l'URL, ou null si ce n'en est pas une. */
export function analyserPage(
  url: string,
  indices: IndicesPage = {},
): PageDeVisionnage | null {
  let adresse: URL;
  try {
    adresse = new URL(url);
  } catch {
    return null;
  }
  if (adresse.protocol !== "https:") {
    return null;
  }

  const hote = adresse.hostname.replace(/^www\./, "");
  switch (hote) {
    case "twitch.tv":
      return analyserTwitch(adresse);
    case "youtube.com":
      return analyserYouTube(adresse, indices);
    case "facebook.com":
      return analyserFacebook(adresse, indices);
    default:
      return null;
  }
}

/** Vrai si les deux pages désignent la même chaîne sur la même plateforme. */
export function memePage(
  a: PageDeVisionnage | null,
  b: PageDeVisionnage | null,
): boolean {
  if (a === null || b === null) {
    return a === b;
  }
  return (
    a.plateforme === b.plateforme && a.identifiantChaine === b.identifiantChaine
  );
}

function segmentsDeChemin(url: URL): string[] {
  return url.pathname.split("/").filter((segment) => segment.length > 0);
}

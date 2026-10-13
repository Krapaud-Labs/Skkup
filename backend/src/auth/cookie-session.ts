import type { CookieOptions } from 'express';

// ─── Cookie de session ───────────────────────────────────────────────────────
/**
 * Le jeton d'accès n'est jamais renvoyé dans le corps d'une réponse ni
 * stocké côté client : il voyage uniquement dans un cookie `httpOnly`,
 * donc inaccessible au JavaScript de la page. Une faille XSS ne permet
 * alors plus d'exfiltrer la session, seulement d'agir depuis l'onglet
 * de la victime.
 */

/** Durée maximale de conservation du cookie web avant une nouvelle connexion. */
export const DUREE_SESSION_SECONDES = 24 * 60 * 60;

/** Identifiant stable du jour civil utilisé par les sessions web. */
export function jourConnexion(date: Date = new Date()): string {
  const annee = date.getFullYear();
  const mois = String(date.getMonth() + 1).padStart(2, '0');
  const jour = String(date.getDate()).padStart(2, '0');
  return `${annee}-${mois}-${jour}`;
}

/**
 * `Secure` est piloté par une variable dédiée plutôt que par `NODE_ENV` :
 * l'image Docker tourne avec `NODE_ENV=production` y compris en
 * développement local, ce qui poserait un cookie `Secure` sur du HTTP
 * simple, silencieusement rejeté par le navigateur. Défaut fermé : seul
 * un `COOKIE_SECURE=false` explicite désactive l'attribut.
 */
export function cookieSecurise(): boolean {
  return process.env.COOKIE_SECURE !== 'false';
}

/**
 * Le préfixe `__Host-` impose au navigateur un cookie `Secure`,
 * host-only et de portée `/`. Il empêche surtout un sous-domaine
 * compromis de poser un cookie de même nom sur le domaine parent, qui
 * masquerait la session légitime (fixation de session). Il exige
 * `Secure`, donc en développement (HTTP simple) on retombe sur un nom
 * sans préfixe.
 */
export function nomCookieSession(): string {
  return cookieSecurise() ? '__Host-vr_session' : 'vr_session';
}

/**
 * Attributs de portée du cookie. Aucun `domain` : le cookie reste
 * host-only sur le domaine de l'API et n'est donc jamais envoyé à un
 * sous-domaine tiers (ou repris par un CNAME abandonné).
 *
 * `sameSite: 'lax'` et non `strict` : le frontend et l'API sont deux
 * sous-domaines du même site enregistrable, donc `lax` suffit pour tous
 * les appels de l'application.
 */
export function optionsCookieSession(): CookieOptions {
  return {
    httpOnly: true,
    secure: cookieSecurise(),
    sameSite: 'lax',
    path: '/',
  };
}

/** Options de pose, avec l'expiration alignée sur celle du jeton. */
export function optionsPoseCookieSession(): CookieOptions {
  return {
    ...optionsCookieSession(),
    maxAge: DUREE_SESSION_SECONDES * 1000,
  };
}

/**
 * Lit le jeton de session dans un en-tête `Cookie` brut. Utilisé là où
 * `cookie-parser` n'intervient pas (poignée de main WebSocket).
 */
export function lireCookieSession(
  enteteCookie: string | undefined,
): string | null {
  if (!enteteCookie) {
    return null;
  }
  const nomAttendu = nomCookieSession();
  for (const paire of enteteCookie.split(';')) {
    const separateur = paire.indexOf('=');
    if (separateur === -1) {
      continue;
    }
    const nom = paire.slice(0, separateur).trim();
    if (nom !== nomAttendu) {
      continue;
    }
    const brut = paire.slice(separateur + 1).trim();
    try {
      const valeur = decodeURIComponent(brut);
      return valeur.length > 0 ? valeur : null;
    } catch {
      // Séquence de pourcentage invalide : un client hostile ne doit pas
      // pouvoir faire lever une exception dans la poignée de main.
      return null;
    }
  }
  return null;
}

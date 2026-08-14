import type { CookieOptions } from 'express';

// ---------------------------------------------------------------------
// Cookie de session
//
// Le jeton d'accès n'est jamais renvoyé dans le corps d'une réponse ni
// stocké côté client : il voyage uniquement dans un cookie `httpOnly`,
// donc inaccessible au JavaScript de la page. Une faille XSS ne permet
// alors plus d'exfiltrer la session, seulement d'agir depuis l'onglet
// de la victime.
// ---------------------------------------------------------------------

/** Durée de vie de la session, alignée sur l'expiration du JWT. */
export const DUREE_SESSION_SECONDES = 7 * 24 * 60 * 60;

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
 * les appels de l'application, et il reste nécessaire pour la
 * navigation top-level de retour des callbacks OAuth de liaison de
 * compte, que `strict` bloquerait.
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
    const valeur = decodeURIComponent(paire.slice(separateur + 1).trim());
    return valeur.length > 0 ? valeur : null;
  }
  return null;
}

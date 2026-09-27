import type { RequestHandler } from 'express';

/**
 * Headers de défense en profondeur appliqués à toutes les réponses HTTP.
 * Les ressources frontend sont servies par un autre composant : la CSP reste
 * volontairement minimale ici pour ne pas inventer un périmètre de déploiement.
 */
export const enTetesSecurite: RequestHandler = (_request, response, next) => {
  response.setHeader('X-Content-Type-Options', 'nosniff');
  response.setHeader('X-Frame-Options', 'DENY');
  response.setHeader('Referrer-Policy', 'no-referrer');
  response.setHeader(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), payment=()',
  );
  response.setHeader('Cross-Origin-Resource-Policy', 'same-site');
  response.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  if (process.env.NODE_ENV === 'production') {
    response.setHeader(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains',
    );
  }
  next();
};

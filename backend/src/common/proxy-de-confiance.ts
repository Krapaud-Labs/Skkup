/**
 * Nombre de proxys de confiance placés devant l'API.
 *
 * En production, le backend n'est joignable qu'à travers Traefik : sans
 * réglage, Express prend comme adresse cliente celle de la socket, donc
 * toujours celle du proxy. Toute limitation de débit indexée sur l'IP
 * s'effondre alors en un seul compteur partagé par la Terre entière, ce
 * qui ne protège plus rien et coupe le service au premier abus.
 *
 * La valeur compte les sauts de confiance, jamais un booléen : `true`
 * ferait confiance à l'`X-Forwarded-For` entier, qu'un client fabrique à
 * volonté pour se donner une IP neuve à chaque requête et contourner
 * exactement la limite qu'on cherche à poser. Avec `n`, Express écarte
 * les `n` entrées les plus à droite (celles ajoutées par nos propres
 * proxys) et retient la suivante : les valeurs injectées par le client
 * restent à gauche et sont ignorées.
 *
 * Défaut à 0 (aucun proxy) : en développement le backend est publié
 * directement, et le défaut fermé est celui qui ne fait confiance à
 * personne. La production met `1` explicitement.
 */
const VARIABLE = 'TRUSTED_PROXY_HOPS';

export function sautsDeProxyDeConfiance(): number {
  const brut = process.env[VARIABLE]?.trim();
  if (!brut) {
    return 0;
  }

  const sauts = Number(brut);
  // Échec au démarrage plutôt qu'un repli silencieux sur 0 : une faute de
  // frappe ici désactiverait sans bruit la limitation de débit par IP.
  if (!Number.isInteger(sauts) || sauts < 0) {
    throw new Error(
      `${VARIABLE} doit être un entier positif ou nul (reçu : "${brut}").`,
    );
  }
  return sauts;
}

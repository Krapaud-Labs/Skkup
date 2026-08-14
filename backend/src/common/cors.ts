/**
 * Origines autorisées, partagées par le CORS HTTP et la poignée de main
 * WebSocket. Une seule liste pour les deux : deux variables distinctes
 * finiraient par diverger, l'une durcie et l'autre oubliée.
 *
 * Non renseignée, la fonction renvoie `false` : aucune origine tierce
 * n'est acceptée. C'est le défaut voulu, on n'ouvre que ce qui est
 * explicitement déclaré.
 *
 * La liste est toujours exacte (schéma, hôte et port) : jamais de motif
 * de sous-domaine, qui réautoriserait précisément les sous-domaines dont
 * on cherche à se protéger, et jamais de renvoi en miroir de l'`Origin`
 * reçue, qui laisserait n'importe quel site lire des réponses
 * authentifiées puisque le CORS est configuré avec `credentials`.
 */
export function originesAutorisees(): string[] | false {
  const brut = process.env.CORS_ORIGINS?.trim();
  if (!brut) {
    return false;
  }
  const origines = brut
    .split(',')
    .map((origine) => origine.trim())
    .filter((origine) => origine.length > 0);
  return origines.length > 0 ? origines : false;
}

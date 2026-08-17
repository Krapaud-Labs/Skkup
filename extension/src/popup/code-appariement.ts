/**
 * Mise en forme du code d'association pendant la saisie.
 *
 * Purement cosmétique : c'est le backend qui normalise réellement le code
 * (casse, séparateurs, sosies visuels comme O/0 ou I/1) avant de le
 * vérifier. On se garde donc de corriger les caractères ici, pour ne pas
 * risquer de diverger un jour de la règle serveur ; on se contente de
 * regrouper la saisie par blocs de quatre, comme le code est affiché sur
 * le site.
 */

const LONGUEUR_CODE = 12;
const TAILLE_BLOC = 4;

/** Normalise l'affichage de la saisie : majuscules et blocs de quatre. */
export function formaterCodeSaisi(valeur: string): string {
  const caracteres = valeur
    .toUpperCase()
    .replace(/[^0-9A-Z]/g, "")
    .slice(0, LONGUEUR_CODE);
  const blocs: string[] = [];
  for (let debut = 0; debut < caracteres.length; debut += TAILLE_BLOC) {
    blocs.push(caracteres.slice(debut, debut + TAILLE_BLOC));
  }
  return blocs.join("-");
}

/** Vrai si la saisie a la longueur attendue d'un code complet. */
export function codeComplet(valeur: string): boolean {
  return valeur.replace(/[^0-9A-Z]/gi, "").length === LONGUEUR_CODE;
}

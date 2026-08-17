import { createHash, randomBytes } from 'node:crypto';

/**
 * Fabrique des deux secrets de l'appariement : le code court saisi à la
 * main par l'utilisateur, et le jeton d'accès de longue durée que
 * l'extension conserve ensuite.
 *
 * Les deux ne sont jamais stockés en clair : la base ne garde que leur
 * empreinte SHA-256. Un condensé rapide est ici suffisant, et non un
 * hachage lent type bcrypt : ces secrets sont tirés au sort avec au
 * moins 60 bits d'entropie, il n'y a donc rien à retrouver par force
 * brute hors ligne comme sur un mot de passe choisi par un humain. Un
 * hachage lent coûterait en revanche une passe coûteuse à chaque
 * requête authentifiée de l'extension.
 */

// ─── Code d'appariement saisi par l'utilisateur ──────────────────────────────
/**
 * Alphabet Crockford base32 : ni I, ni L, ni O, ni U. Les trois
 * premières se confondent à la lecture avec 1 et 0, la dernière est
 * exclue pour éviter de composer un mot involontaire. 32 divise
 * exactement 256, donc réduire un octet aléatoire modulo 32 reste
 * uniforme : pas de biais à corriger.
 */
const ALPHABET_CODE = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

/**
 * 12 caractères sur 32 valeurs, soit 60 bits d'entropie. Assez court
 * pour être recopié à la main, assez large pour qu'une devinette reste
 * hors de portée même sans limitation de débit.
 */
const LONGUEUR_CODE = 12;
const TAILLE_GROUPE_CODE = 4;

/** Regroupe le code par blocs de 4 pour la lisibilité à la saisie. */
function formaterCode(brut: string): string {
  const groupes: string[] = [];
  for (let i = 0; i < brut.length; i += TAILLE_GROUPE_CODE) {
    groupes.push(brut.slice(i, i + TAILLE_GROUPE_CODE));
  }
  return groupes.join('-');
}

/**
 * Tire un code d'appariement. `code` est la forme affichée à
 * l'utilisateur, `codeNormalise` la forme canonique dont on stocke
 * l'empreinte, identique à ce que produira la normalisation de la
 * saisie côté extension.
 */
export function genererCodeAppariement(): {
  code: string;
  codeNormalise: string;
} {
  const octets = randomBytes(LONGUEUR_CODE);
  let brut = '';
  for (const octet of octets) {
    brut += ALPHABET_CODE[octet % ALPHABET_CODE.length];
  }
  return { code: formaterCode(brut), codeNormalise: brut };
}

/**
 * Ramène une saisie utilisateur à la forme canonique du code, ou `null`
 * si elle ne peut pas en être une. Les séparateurs et espaces sont
 * ignorés, et les caractères absents de l'alphabet sont rapprochés de
 * leur sosie visuel (O vers 0, I et L vers 1) plutôt que rejetés : sans
 * cette tolérance, un code parfaitement valide serait refusé pour une
 * simple confusion de lecture.
 */
export function normaliserCodeAppariement(saisie: string): string | null {
  const compacte = saisie
    .toUpperCase()
    .replace(/[\s-]/g, '')
    .replace(/O/g, '0')
    .replace(/[IL]/g, '1');

  if (compacte.length !== LONGUEUR_CODE) {
    return null;
  }
  for (const caractere of compacte) {
    if (!ALPHABET_CODE.includes(caractere)) {
      return null;
    }
  }
  return compacte;
}

// ─── Jeton d'accès de l'extension ────────────────────────────────────────────
/**
 * Préfixe stable du jeton de longue durée. Il ne protège rien par
 * lui-même : il sert à reconnaître le secret dans un journal ou un
 * dépôt (détection de fuite) et à rejeter tout de suite un en-tête
 * `Authorization` qui porte un JWT de session web plutôt qu'un jeton
 * d'extension.
 */
export const PREFIXE_JETON_EXTENSION = 'vrx_';

/** 256 bits d'aléa : hors de portée d'une recherche exhaustive. */
const OCTETS_JETON_EXTENSION = 32;

export function genererJetonExtension(): string {
  return (
    PREFIXE_JETON_EXTENSION +
    randomBytes(OCTETS_JETON_EXTENSION).toString('base64url')
  );
}

// ─── Empreintes ──────────────────────────────────────────────────────────────
/**
 * Empreinte stockée en base, jamais le secret lui-même. La recherche se
 * fait ensuite par égalité sur cette empreinte via l'index unique : le
 * secret en clair n'est comparé nulle part, donc aucune comparaison
 * sensible au temps n'est exposée.
 */
export function empreinteJeton(secret: string): string {
  return createHash('sha256').update(secret).digest('hex');
}

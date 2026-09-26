import { createHash, randomBytes } from 'node:crypto';

// ─── Moteur de tirage au sort ────────────────────────────────────────────────
/**
 * Deux propriétés sont indispensables ici :
 *  1. l'imprévisibilité : la graine est produite par `crypto.randomBytes`
 *     (CSPRNG), jamais par `Math.random` qui est prédictible et donc
 *     inutilisable pour un tirage dont l'intégrité doit tenir face à un
 *     participant malveillant ;
 *  2. l'auditabilité : une fois la graine publiée, n'importe qui doit
 *     pouvoir rejouer le tirage et retomber exactement sur les mêmes
 *     gagnants. Toute la sélection est donc déterministe à partir du
 *     couple (graine, liste ordonnée des tickets).
 */

const OCTETS_GRAINE = 32;

/** Graine aléatoire cryptographiquement sûre, journalisée avec le tirage. */
export function genererGraine(): string {
  return randomBytes(OCTETS_GRAINE).toString('hex');
}

/**
 * Empreinte de la liste des participants, dans l'ordre canonique utilisé
 * par le tirage.
 *
 * La graine seule ne prouve rien : rejouer un tirage suppose de connaître
 * exactement le contenu du chapeau. Cette empreinte est calculée et
 * persistée au moment du tirage, en même temps que la graine, de sorte
 * qu'un tiers puisse vérifier que la liste de participants qu'on lui
 * publie est bien celle qui a servi, et qu'aucun ticket n'a été ajouté ou
 * retiré après coup.
 */
export function calculerEmpreinteParticipants(
  ticketIds: readonly string[],
): string {
  const canonique = ordreCanonique(ticketIds);
  // Encodage préfixé par les longueurs : deux listes différentes ne
  // peuvent pas produire la même chaîne d'entrée, contrairement à une
  // simple concaténation avec séparateur.
  const donnees = canonique.reduce(
    (accumulateur, id) => `${accumulateur}${id.length}:${id}`,
    `${canonique.length}:`,
  );
  return createHash('sha256').update(donnees).digest('hex');
}

/** Ordre de référence du chapeau : tri lexicographique des identifiants. */
export function ordreCanonique(ticketIds: readonly string[]): string[] {
  return [...ticketIds].sort();
}

/**
 * Flux d'entiers pseudo-aléatoires dérivé de la graine.
 *
 * Chaque valeur est un bloc SHA-256 de `graine:compteur`, ce qui rend le
 * flux entièrement reproductible à partir de la graine publiée. Le tirage
 * d'un entier borné utilise un rejet des valeurs hors plage (rejection
 * sampling) plutôt qu'un simple modulo, qui introduirait un biais en
 * faveur des premiers indices.
 */
export function creerFluxAleatoire(graine: string): (borne: number) => number {
  let compteur = 0;

  const prochainEntier53Bits = (): number => {
    const bloc = createHash('sha256').update(`${graine}:${compteur}`).digest();
    compteur += 1;
    // 53 bits de poids fort du bloc : la précision maximale d'un entier
    // exact en JavaScript.
    return Number(bloc.readBigUInt64BE(0) >> 11n);
  };

  const MAX_53_BITS = 2 ** 53;

  return (borne: number): number => {
    if (borne <= 0) {
      throw new RangeError('The draw bound must be strictly positive.');
    }
    // Plus grand multiple de `borne` inférieur à 2^53 : au-delà, la
    // valeur est rejetée pour conserver une distribution uniforme.
    const limite = MAX_53_BITS - (MAX_53_BITS % borne);
    let valeur = prochainEntier53Bits();
    while (valeur >= limite) {
      valeur = prochainEntier53Bits();
    }
    return valeur % borne;
  };
}

export interface LotATirer {
  id: string;
  quantite: number;
}

export interface GagnantTire {
  lotId: string;
  ticketId: string;
}

/**
 * Attribue les lots aux tickets, sans remise : un ticket déjà tiré est
 * retiré du chapeau et ne peut donc pas gagner un second lot.
 *
 * Les entrées sont triées par identifiant pour que l'ordre de lecture en
 * base n'influence jamais le résultat : seule la graine le détermine.
 * S'il reste moins de tickets que de lots à attribuer, les lots restants
 * ne sont simplement pas attribués.
 */
export function tirerGagnants(
  graine: string,
  ticketIds: readonly string[],
  lots: readonly LotATirer[],
): GagnantTire[] {
  const chapeau = ordreCanonique(ticketIds);
  const lotsOrdonnes = [...lots].sort((a, b) => (a.id < b.id ? -1 : 1));
  const entierAleatoire = creerFluxAleatoire(graine);
  const gagnants: GagnantTire[] = [];

  for (const lot of lotsOrdonnes) {
    const aTirer = Math.max(0, Math.trunc(lot.quantite));
    for (let i = 0; i < aTirer; i += 1) {
      if (chapeau.length === 0) {
        return gagnants;
      }
      const index = entierAleatoire(chapeau.length);
      const [ticketId] = chapeau.splice(index, 1);
      gagnants.push({ lotId: lot.id, ticketId });
    }
  }

  return gagnants;
}

import {
  calculerEmpreinteParticipants,
  genererGraine,
  ordreCanonique,
  tirerGagnants,
} from './tirage';

// --- Jeu de données commun ---
const tickets = Array.from({ length: 50 }, (_, i) => `ticket-${i + 1}`);
const lots = [
  { id: 'lot-a', quantite: 2 },
  { id: 'lot-b', quantite: 3 },
];

describe('tirerGagnants', () => {
  it('est reproductible à graine identique (audit du tirage)', () => {
    const graine = 'a'.repeat(64);
    const premier = tirerGagnants(graine, tickets, lots);
    const second = tirerGagnants(graine, tickets, lots);

    expect(second).toEqual(premier);
  });

  it("ne dépend pas de l'ordre de lecture des tickets et des lots", () => {
    const graine = 'b'.repeat(64);
    const attendu = tirerGagnants(graine, tickets, lots);
    const melange = tirerGagnants(
      graine,
      [...tickets].reverse(),
      [...lots].reverse(),
    );

    expect(melange).toEqual(attendu);
  });

  it('produit des résultats différents avec des graines différentes', () => {
    const premier = tirerGagnants('c'.repeat(64), tickets, lots);
    const second = tirerGagnants('d'.repeat(64), tickets, lots);

    expect(second).not.toEqual(premier);
  });

  it('ne fait jamais gagner deux lots au même ticket', () => {
    for (let i = 0; i < 200; i += 1) {
      const gagnants = tirerGagnants(genererGraine(), tickets, lots);
      const ticketIds = gagnants.map((gagnant) => gagnant.ticketId);

      expect(new Set(ticketIds).size).toBe(ticketIds.length);
    }
  });

  it('attribue exactement la quantité prévue pour chaque lot', () => {
    const gagnants = tirerGagnants(genererGraine(), tickets, lots);

    expect(gagnants.filter((g) => g.lotId === 'lot-a')).toHaveLength(2);
    expect(gagnants.filter((g) => g.lotId === 'lot-b')).toHaveLength(3);
  });

  it("s'arrête quand il y a moins de tickets que de lots à attribuer", () => {
    const gagnants = tirerGagnants(
      genererGraine(),
      ['ticket-1', 'ticket-2', 'ticket-3'],
      lots,
    );

    expect(gagnants).toHaveLength(3);
    expect(new Set(gagnants.map((g) => g.ticketId)).size).toBe(3);
  });

  it('ne tire personne sans ticket', () => {
    expect(tirerGagnants(genererGraine(), [], lots)).toEqual([]);
  });

  it('ne tire que parmi les tickets fournis', () => {
    const gagnants = tirerGagnants(genererGraine(), tickets, lots);

    for (const gagnant of gagnants) {
      expect(tickets).toContain(gagnant.ticketId);
    }
  });

  it('couvre bien tous les tickets sur un grand nombre de tirages', () => {
    const tiresAuMoinsUneFois = new Set<string>();
    for (let i = 0; i < 500; i += 1) {
      for (const gagnant of tirerGagnants(genererGraine(), tickets, lots)) {
        tiresAuMoinsUneFois.add(gagnant.ticketId);
      }
    }

    // Un biais grossier (toujours les mêmes indices) se verrait ici.
    expect(tiresAuMoinsUneFois.size).toBe(tickets.length);
  });
});

describe('calculerEmpreinteParticipants', () => {
  it("ne dépend pas de l'ordre de lecture des tickets", () => {
    expect(calculerEmpreinteParticipants([...tickets].reverse())).toBe(
      calculerEmpreinteParticipants(tickets),
    );
  });

  it("change dès qu'un ticket est ajouté après coup", () => {
    const avant = calculerEmpreinteParticipants(tickets);

    expect(calculerEmpreinteParticipants([...tickets, 'ticket-51'])).not.toBe(
      avant,
    );
  });

  it("change dès qu'un ticket est retiré après coup", () => {
    const avant = calculerEmpreinteParticipants(tickets);

    expect(calculerEmpreinteParticipants(tickets.slice(1))).not.toBe(avant);
  });

  it('produit une empreinte SHA-256 hexadécimale', () => {
    expect(calculerEmpreinteParticipants(tickets)).toMatch(/^[0-9a-f]{64}$/);
  });

  it('distingue deux listes au découpage ambigu', () => {
    // L'encodage ne doit pas permettre de fabriquer deux listes
    // distinctes partageant la même empreinte.
    expect(calculerEmpreinteParticipants(['a', 'b'])).not.toBe(
      calculerEmpreinteParticipants(['a\nb']),
    );
    expect(calculerEmpreinteParticipants(['ab', 'c'])).not.toBe(
      calculerEmpreinteParticipants(['a', 'bc']),
    );
  });
});

describe('ordreCanonique', () => {
  it('trie les identifiants sans modifier la liste source', () => {
    const source = ['c', 'a', 'b'];

    expect(ordreCanonique(source)).toEqual(['a', 'b', 'c']);
    expect(source).toEqual(['c', 'a', 'b']);
  });
});

describe('genererGraine', () => {
  it('produit une graine hexadécimale de 256 bits, non répétée', () => {
    const graines = new Set(Array.from({ length: 100 }, () => genererGraine()));

    expect(graines.size).toBe(100);
    for (const graine of graines) {
      expect(graine).toMatch(/^[0-9a-f]{64}$/);
    }
  });
});

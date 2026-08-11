import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { RafflesService } from './raffles.service';
import { PrismaService } from '../prisma/prisma.service';
import { RaffleStatus } from '../../generated/prisma/enums';

// --- Mise en place du module de test ---
describe('RafflesService', () => {
  let service: RafflesService;
  let prisma: {
    raffle: { findMany: jest.Mock; findUnique: jest.Mock };
  };

  const raffleDeBase = {
    id: 'raffle-1',
    titre: 'Tirage hebdomadaire',
    description: 'Lots de la semaine',
    dateOuverture: new Date('2026-08-05T00:00:00.000Z'),
    dateTirage: new Date('2026-08-12T18:00:00.000Z'),
    statut: RaffleStatus.OUVERT,
    graineAleatoire: null as string | null,
    resultatPublieAt: null as Date | null,
    lots: [
      {
        id: 'lot-a',
        nom: 'Casque gamer',
        valeurEstimee: '99.90',
        quantite: 1,
        fournisseur: 'Sponsor A',
      },
    ],
    _count: { tickets: 42 },
  };

  beforeEach(async () => {
    prisma = {
      raffle: { findMany: jest.fn(), findUnique: jest.fn() },
    };

    const module = await Test.createTestingModule({
      providers: [RafflesService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get(RafflesService);
  });

  // --- GET /raffles ---
  describe('lister', () => {
    it('renvoie les tirages avec leurs lots et le nombre de tickets', async () => {
      prisma.raffle.findMany.mockResolvedValue([raffleDeBase]);

      const resultat = await service.lister();

      expect(resultat).toHaveLength(1);
      expect(resultat[0]).toMatchObject({
        id: 'raffle-1',
        statut: RaffleStatus.OUVERT,
        ticketsDistribues: 42,
      });
      expect(resultat[0].lots).toHaveLength(1);
    });

    it("n'expose jamais la graine dans la liste", async () => {
      prisma.raffle.findMany.mockResolvedValue([
        { ...raffleDeBase, graineAleatoire: 'graine-secrete' },
      ]);

      const [premier] = await service.lister();

      expect(premier).not.toHaveProperty('graineAleatoire');
    });
  });

  // --- GET /raffles/:id ---
  describe('detail', () => {
    it('renvoie le détail du tirage demandé', async () => {
      prisma.raffle.findUnique.mockResolvedValue(raffleDeBase);

      const resultat = await service.detail('raffle-1');

      expect(resultat).toMatchObject({
        id: 'raffle-1',
        titre: 'Tirage hebdomadaire',
        ticketsDistribues: 42,
      });
    });

    it('renvoie 404 pour un tirage inconnu', async () => {
      prisma.raffle.findUnique.mockResolvedValue(null);

      await expect(service.detail('inconnu')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  // --- GET /raffles/:id/result ---
  describe('resultat', () => {
    const raffleTire = {
      ...raffleDeBase,
      statut: RaffleStatus.TIRE,
      graineAleatoire: 'a'.repeat(64),
      resultatPublieAt: new Date('2026-08-12T18:00:05.000Z'),
      winners: [
        {
          id: 'winner-1',
          ticketId: 'ticket-7',
          lot: { id: 'lot-a', nom: 'Casque gamer' },
          user: { pseudo: 'ViewerPro' },
        },
      ],
    };

    it('renvoie les gagnants et la graine une fois le tirage effectué', async () => {
      prisma.raffle.findUnique.mockResolvedValue(raffleTire);

      const resultat = await service.resultat('raffle-1');

      expect(resultat.graineAleatoire).toBe('a'.repeat(64));
      expect(resultat.gagnants).toEqual([
        {
          lotId: 'lot-a',
          lotNom: 'Casque gamer',
          ticketId: 'ticket-7',
          pseudo: 'ViewerPro',
        },
      ]);
    });

    it("n'expose que le pseudo des gagnants", async () => {
      prisma.raffle.findUnique.mockResolvedValue(raffleTire);

      const resultat = await service.resultat('raffle-1');

      expect(resultat.gagnants[0]).not.toHaveProperty('userId');
      expect(resultat.gagnants[0]).not.toHaveProperty('email');
    });

    it('refuse de publier le résultat tant que le tirage est ouvert', async () => {
      prisma.raffle.findUnique.mockResolvedValue({
        ...raffleTire,
        statut: RaffleStatus.OUVERT,
      });

      await expect(service.resultat('raffle-1')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('refuse de publier le résultat tant que le tirage est seulement clôturé', async () => {
      prisma.raffle.findUnique.mockResolvedValue({
        ...raffleTire,
        statut: RaffleStatus.CLOTURE,
      });

      await expect(service.resultat('raffle-1')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('renvoie 404 pour un tirage inconnu', async () => {
      prisma.raffle.findUnique.mockResolvedValue(null);

      await expect(service.resultat('inconnu')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });
});

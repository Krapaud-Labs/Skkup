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
    raffleTicket: { findMany: jest.Mock };
  };

  const raffleDeBase = {
    id: 'raffle-1',
    titre: 'Tirage hebdomadaire',
    description: 'Lots de la semaine',
    dateOuverture: new Date('2026-08-05T00:00:00.000Z'),
    dateTirage: new Date('2026-08-12T18:00:00.000Z'),
    statut: RaffleStatus.OUVERT,
    graineAleatoire: null as string | null,
    empreinteParticipants: null as string | null,
    nombreParticipants: null as number | null,
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
      raffleTicket: { findMany: jest.fn().mockResolvedValue([]) },
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
      empreinteParticipants: 'b'.repeat(64),
      nombreParticipants: 42,
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

    it("publie le matériel d'audit de la liste des participants", async () => {
      prisma.raffle.findUnique.mockResolvedValue(raffleTire);

      const resultat = await service.resultat('raffle-1');

      expect(resultat.empreinteParticipants).toBe('b'.repeat(64));
      expect(resultat.nombreParticipants).toBe(42);
    });
  });

  // --- GET /raffles/:id/participants ---
  describe('participants', () => {
    const raffleTire = {
      statut: RaffleStatus.TIRE,
      empreinteParticipants: 'b'.repeat(64),
      nombreParticipants: 3,
    };

    it("renvoie la liste ordonnée des tickets et l'empreinte publiée", async () => {
      prisma.raffle.findUnique.mockResolvedValue(raffleTire);
      prisma.raffleTicket.findMany.mockResolvedValue([
        { id: 'ticket-3' },
        { id: 'ticket-1' },
        { id: 'ticket-2' },
      ]);

      const resultat = await service.participants('raffle-1');

      expect(resultat.participants).toEqual([
        'ticket-1',
        'ticket-2',
        'ticket-3',
      ]);
      expect(resultat.empreinteParticipants).toBe('b'.repeat(64));
      expect(resultat.nombreParticipants).toBe(3);
    });

    it("n'expose aucune identité derrière les tickets", async () => {
      prisma.raffle.findUnique.mockResolvedValue(raffleTire);
      prisma.raffleTicket.findMany.mockResolvedValue([{ id: 'ticket-1' }]);

      await service.participants('raffle-1');

      expect(prisma.raffleTicket.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ select: { id: true } }),
      );
    });

    it('refuse de publier la liste avant le tirage', async () => {
      prisma.raffle.findUnique.mockResolvedValue({
        ...raffleTire,
        statut: RaffleStatus.OUVERT,
      });

      await expect(service.participants('raffle-1')).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(prisma.raffleTicket.findMany).not.toHaveBeenCalled();
    });

    it('refuse de publier la liste sur un tirage seulement clôturé', async () => {
      prisma.raffle.findUnique.mockResolvedValue({
        ...raffleTire,
        statut: RaffleStatus.CLOTURE,
      });

      await expect(service.participants('raffle-1')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('renvoie 404 pour un tirage inconnu', async () => {
      prisma.raffle.findUnique.mockResolvedValue(null);

      await expect(service.participants('inconnu')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('borne la taille de page demandée', async () => {
      prisma.raffle.findUnique.mockResolvedValue(raffleTire);
      prisma.raffleTicket.findMany.mockResolvedValue([]);

      const resultat = await service.participants('raffle-1', 0, 1_000_000);

      expect(resultat.taillePage).toBe(2000);
      expect(prisma.raffleTicket.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 2000 }),
      );
    });

    it('neutralise une pagination négative ou fractionnaire', async () => {
      prisma.raffle.findUnique.mockResolvedValue(raffleTire);
      prisma.raffleTicket.findMany.mockResolvedValue([]);

      const resultat = await service.participants('raffle-1', -5, -10);

      expect(resultat.page).toBe(0);
      expect(resultat.taillePage).toBe(1);
      expect(prisma.raffleTicket.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 0, take: 1 }),
      );
    });

    it('applique le décalage de page demandé', async () => {
      prisma.raffle.findUnique.mockResolvedValue(raffleTire);
      prisma.raffleTicket.findMany.mockResolvedValue([]);

      await service.participants('raffle-1', 2, 100);

      expect(prisma.raffleTicket.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 200, take: 100 }),
      );
    });
  });
});

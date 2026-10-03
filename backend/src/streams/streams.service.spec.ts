import { Test } from '@nestjs/testing';
import { StreamsService } from './streams.service';
import { PrismaService } from '../prisma/prisma.service';
import { Platform } from '../../generated/prisma/enums';

// ─── Mise en place du module de test ─────────────────────────────────────────
describe('StreamsService', () => {
  let service: StreamsService;
  let prisma: {
    stream: { findMany: jest.Mock; update: jest.Mock };
    contentAuditEvent: { create: jest.Mock };
  };

  beforeEach(async () => {
    prisma = {
      stream: { findMany: jest.fn().mockResolvedValue([]), update: jest.fn() },
      contentAuditEvent: { create: jest.fn() },
    };

    const module = await Test.createTestingModule({
      providers: [StreamsService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get(StreamsService);
  });

  // ─── Filtrage sur le drapeau actif ─────────────────────────────────────────
  it('ne demande que les streams actifs', async () => {
    await service.lister();

    expect(prisma.stream.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { actif: true } }),
    );
  });

  it('trie les streams par nom affiché', async () => {
    await service.lister();

    expect(prisma.stream.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: [{ nomAffiche: 'asc' }] }),
    );
  });

  // Endpoint public non authentifié : la réponse reste bornée.
  it('plafonne le nombre de streams retournés', async () => {
    await service.lister();

    expect(prisma.stream.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 200 }),
    );
  });

  // ─── Forme de la réponse ───────────────────────────────────────────────────
  it('retourne la liste des streams sous la clé streams', async () => {
    prisma.stream.findMany.mockResolvedValue([
      {
        id: 'stream-1',
        plateforme: Platform.TWITCH,
        identifiantChaine: 'chaine_partenaire',
        nomAffiche: 'Chaîne partenaire',
      },
    ]);

    await expect(service.lister()).resolves.toEqual({
      streams: [
        {
          id: 'stream-1',
          plateforme: Platform.TWITCH,
          identifiantChaine: 'chaine_partenaire',
          nomAffiche: 'Chaîne partenaire',
        },
      ],
    });
  });

  it('ne sélectionne pas de champ interne au-delà du contrat public', async () => {
    await service.lister();

    expect(prisma.stream.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        select: {
          id: true,
          plateforme: true,
          identifiantChaine: true,
          nomAffiche: true,
          estPartenaire: true,
          bonusPointsHeure: true,
        },
      }),
    );
  });

  it('retourne une liste vide quand aucun stream actif', async () => {
    await expect(service.lister()).resolves.toEqual({ streams: [] });
  });
});

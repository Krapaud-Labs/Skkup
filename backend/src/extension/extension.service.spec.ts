import { Test } from '@nestjs/testing';
import {
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ExtensionService } from './extension.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  empreinteJeton,
  normaliserCodeAppariement,
  PREFIXE_JETON_EXTENSION,
} from './jetons-extension';

// ─── Mise en place du module de test ─────────────────────────────────────────
describe('ExtensionService', () => {
  let service: ExtensionService;

  // Le code est stocké consommé ou non selon le scénario ; l'important
  // est que le service ne se fie jamais au seul champ lu, mais au nombre
  // de lignes réellement mises à jour.
  let prisma: {
    extensionPairingToken: {
      deleteMany: jest.Mock;
      create: jest.Mock;
      findUnique: jest.Mock;
      updateMany: jest.Mock;
    };
    extensionPairing: {
      create: jest.Mock;
      findMany: jest.Mock;
      findUnique: jest.Mock;
      updateMany: jest.Mock;
    };
    user: { findUniqueOrThrow: jest.Mock };
    $transaction: jest.Mock;
  };

  const dansCinqMinutes = () => new Date(Date.now() + 5 * 60 * 1000);

  /** Bloc `data` passé au premier appel d'un `create` simulé. */
  const donneesCreees = (mock: jest.Mock): Record<string, unknown> =>
    (mock.mock.calls[0] as [{ data: Record<string, unknown> }])[0].data;

  beforeEach(async () => {
    prisma = {
      extensionPairingToken: {
        deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
        create: jest.fn().mockResolvedValue({ id: 'code-1' }),
        findUnique: jest.fn(),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      extensionPairing: {
        create: jest.fn().mockResolvedValue({ id: 'appariement-1' }),
        findMany: jest.fn().mockResolvedValue([]),
        findUnique: jest.fn(),
        updateMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
      user: {
        findUniqueOrThrow: jest.fn().mockResolvedValue({ pseudo: 'Kra' }),
      },
      // Couvre les deux formes utilisées : tableau d'opérations et
      // callback recevant le client transactionnel.
      $transaction: jest.fn(
        (argument: unknown[] | ((tx: typeof prisma) => unknown)) =>
          typeof argument === 'function'
            ? argument(prisma)
            : Promise.all(argument),
      ),
    };

    const module = await Test.createTestingModule({
      providers: [
        ExtensionService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get(ExtensionService);
  });

  // ─── Génération du code ────────────────────────────────────────────────────
  it("n'enregistre que l'empreinte du code et purge les codes en attente", async () => {
    const { code, expireAt } = await service.genererCode('user-1');

    expect(code).toMatch(/^[0-9A-HJKMNP-TV-Z]{4}(-[0-9A-HJKMNP-TV-Z]{4}){2}$/);
    expect(expireAt.getTime()).toBeGreaterThan(Date.now());

    expect(prisma.extensionPairingToken.deleteMany).toHaveBeenCalledWith({
      where: { userId: 'user-1', consommeAt: null },
    });

    const donnees = donneesCreees(prisma.extensionPairingToken.create);
    expect(donnees.tokenHash).toBe(
      empreinteJeton(normaliserCodeAppariement(code) as string),
    );
    expect(donnees.tokenHash).not.toContain(code.replace(/-/g, ''));
  });

  it('tire un code différent à chaque appel', async () => {
    const premier = await service.genererCode('user-1');
    const second = await service.genererCode('user-1');
    expect(premier.code).not.toBe(second.code);
  });

  // ─── Échange du code ───────────────────────────────────────────────────────
  it('accepte un code valide, le consomme et renvoie un jeton porteur', async () => {
    prisma.extensionPairingToken.findUnique.mockResolvedValue({
      id: 'code-1',
      userId: 'user-1',
      expireAt: dansCinqMinutes(),
    });

    const resultat = await service.apparier({ code: 'ABCD-EFGH-JKMN' });

    expect(resultat.jetonExtension.startsWith(PREFIXE_JETON_EXTENSION)).toBe(
      true,
    );
    expect(resultat.pseudo).toBe('Kra');
    expect(resultat.expireAt.getTime()).toBeGreaterThan(Date.now());

    // Consommation conditionnée à `consommeAt: null` : c'est ce filtre
    // qui garantit l'usage unique face à deux requêtes simultanées.
    expect(prisma.extensionPairingToken.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'code-1', consommeAt: null },
      }),
    );

    // Le jeton d'accès n'est jamais stocké en clair.
    const donnees = donneesCreees(prisma.extensionPairing.create);
    expect(donnees.userId).toBe('user-1');
    expect(donnees.tokenHash).toBe(empreinteJeton(resultat.jetonExtension));
  });

  it('tolère une saisie en minuscules, espacée et avec des sosies visuels', async () => {
    prisma.extensionPairingToken.findUnique.mockResolvedValue({
      id: 'code-1',
      userId: 'user-1',
      expireAt: dansCinqMinutes(),
    });

    await service.apparier({ code: ' abcd efgh jkmn ' });

    expect(prisma.extensionPairingToken.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { tokenHash: empreinteJeton('ABCDEFGHJKMN') },
      }),
    );
  });

  it('rejette un code expiré sans le consommer', async () => {
    prisma.extensionPairingToken.findUnique.mockResolvedValue({
      id: 'code-1',
      userId: 'user-1',
      expireAt: new Date(Date.now() - 1000),
    });

    await expect(service.apparier({ code: 'ABCD-EFGH-JKMN' })).rejects.toThrow(
      UnauthorizedException,
    );
    expect(prisma.extensionPairingToken.updateMany).not.toHaveBeenCalled();
    expect(prisma.extensionPairing.create).not.toHaveBeenCalled();
  });

  it('rejette un code déjà consommé (aucune ligne mise à jour)', async () => {
    prisma.extensionPairingToken.findUnique.mockResolvedValue({
      id: 'code-1',
      userId: 'user-1',
      expireAt: dansCinqMinutes(),
    });
    prisma.extensionPairingToken.updateMany.mockResolvedValue({ count: 0 });

    await expect(service.apparier({ code: 'ABCD-EFGH-JKMN' })).rejects.toThrow(
      UnauthorizedException,
    );
    expect(prisma.extensionPairing.create).not.toHaveBeenCalled();
  });

  it('rejette un code inconnu', async () => {
    prisma.extensionPairingToken.findUnique.mockResolvedValue(null);

    await expect(service.apparier({ code: 'ABCD-EFGH-JKMN' })).rejects.toThrow(
      UnauthorizedException,
    );
    expect(prisma.extensionPairing.create).not.toHaveBeenCalled();
  });

  it('rejette une saisie hors format sans interroger la base', async () => {
    await expect(service.apparier({ code: 'pas-un-code' })).rejects.toThrow(
      UnauthorizedException,
    );
    expect(prisma.extensionPairingToken.findUnique).not.toHaveBeenCalled();
  });

  it("ne distingue pas dans son message un code inconnu d'un code expiré", async () => {
    prisma.extensionPairingToken.findUnique.mockResolvedValue(null);
    const messageInconnu = await service
      .apparier({ code: 'ABCD-EFGH-JKMN' })
      .catch((erreur: Error) => erreur.message);

    prisma.extensionPairingToken.findUnique.mockResolvedValue({
      id: 'code-1',
      userId: 'user-1',
      expireAt: new Date(Date.now() - 1000),
    });
    const messageExpire = await service
      .apparier({ code: 'ABCD-EFGH-JKMN' })
      .catch((erreur: Error) => erreur.message);

    expect(messageInconnu).toBe(messageExpire);
  });

  // ─── Plafond d'appareils appariés ──────────────────────────────────────────
  it('révoque les appariements les plus anciens au-delà du plafond', async () => {
    prisma.extensionPairingToken.findUnique.mockResolvedValue({
      id: 'code-1',
      userId: 'user-1',
      expireAt: dansCinqMinutes(),
    });
    // Sept appariements actifs, du plus récent au plus ancien : les deux
    // derniers doivent être coupés.
    prisma.extensionPairing.findMany.mockResolvedValue(
      Array.from({ length: 7 }, (_, index) => ({ id: `appareil-${index}` })),
    );

    await service.apparier({ code: 'ABCD-EFGH-JKMN' });

    expect(prisma.extensionPairing.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: { in: ['appareil-5', 'appareil-6'] } },
      }),
    );
  });

  it("ne révoque rien tant que le plafond n'est pas atteint", async () => {
    prisma.extensionPairingToken.findUnique.mockResolvedValue({
      id: 'code-1',
      userId: 'user-1',
      expireAt: dansCinqMinutes(),
    });
    prisma.extensionPairing.findMany.mockResolvedValue([
      { id: 'appareil-0' },
      { id: 'appareil-1' },
    ]);

    await service.apparier({ code: 'ABCD-EFGH-JKMN' });

    expect(prisma.extensionPairing.updateMany).not.toHaveBeenCalled();
  });

  // ─── Liste des appareils appariés ──────────────────────────────────────────
  it('liste les appareils appariés avec leur statut dérivé', async () => {
    const dansUneHeure = new Date(Date.now() + 60 * 60 * 1000);
    const ilYAUneHeure = new Date(Date.now() - 60 * 60 * 1000);
    prisma.extensionPairing.findMany.mockResolvedValue([
      {
        id: 'actif',
        createdAt: new Date('2026-01-01'),
        expireAt: dansUneHeure,
        revoqueAt: null,
      },
      {
        id: 'expire',
        createdAt: new Date('2026-01-02'),
        expireAt: ilYAUneHeure,
        revoqueAt: null,
      },
      {
        id: 'revoque',
        createdAt: new Date('2026-01-03'),
        expireAt: dansUneHeure,
        revoqueAt: new Date(),
      },
    ]);

    const { appareils } = await service.listerAppareils('user-1');

    expect(prisma.extensionPairing.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: 'user-1' } }),
    );
    expect(appareils.map((a) => a.statut)).toEqual([
      'ACTIF',
      'EXPIRE',
      'REVOQUE',
    ]);
  });

  // ─── Désappariement ─────────────────────────────────────────────────────────
  it("révoque un appareil appartenant à l'utilisateur authentifié", async () => {
    prisma.extensionPairing.findUnique.mockResolvedValue({ userId: 'user-1' });

    await service.revoquer('user-1', 'appariement-1');

    expect(prisma.extensionPairing.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'appariement-1', revoqueAt: null },
        data: { revoqueAt: expect.any(Date) as Date },
      }),
    );
  });

  it('refuse de révoquer un appareil introuvable', async () => {
    prisma.extensionPairing.findUnique.mockResolvedValue(null);

    await expect(service.revoquer('user-1', 'inconnu')).rejects.toThrow(
      NotFoundException,
    );
    expect(prisma.extensionPairing.updateMany).not.toHaveBeenCalled();
  });

  it("refuse de révoquer l'appareil d'un autre compte", async () => {
    prisma.extensionPairing.findUnique.mockResolvedValue({
      userId: 'autre-utilisateur',
    });

    await expect(service.revoquer('user-1', 'appariement-1')).rejects.toThrow(
      ForbiddenException,
    );
    expect(prisma.extensionPairing.updateMany).not.toHaveBeenCalled();
  });
});

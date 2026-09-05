import { nettoyerEtatsTemporaires } from './maintenance-cleanup';

describe('nettoyerEtatsTemporaires', () => {
  function creerPrisma(acquired = true) {
    const tx = {
      $queryRaw: jest.fn().mockResolvedValue([{ acquired }]),
      oAuthState: { deleteMany: jest.fn().mockResolvedValue({ count: 2 }) },
      extensionPairingToken: {
        deleteMany: jest.fn().mockResolvedValue({ count: 3 }),
      },
      watchSession: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
    };
    const prisma = {
      $transaction: jest.fn((callback: (client: typeof tx) => unknown) =>
        callback(tx),
      ),
    };
    return { prisma, tx };
  }

  it('ignore une exécution concurrente sans modifier la base', async () => {
    const { prisma, tx } = creerPrisma(false);

    const resultat = await nettoyerEtatsTemporaires(prisma as never);

    expect(resultat).toMatchObject({
      ignore: true,
      raison: 'execution_concurrente',
    });
    expect(tx.oAuthState.deleteMany).not.toHaveBeenCalled();
    expect(tx.extensionPairingToken.deleteMany).not.toHaveBeenCalled();
    expect(tx.watchSession.updateMany).not.toHaveBeenCalled();
  });

  it('purge les états retenus et clôt les sessions inactives', async () => {
    const { prisma, tx } = creerPrisma();
    const maintenant = new Date('2026-09-05T20:00:00.000Z');

    const resultat = await nettoyerEtatsTemporaires(
      prisma as never,
      maintenant,
    );

    expect(resultat).toEqual({
      ignore: false,
      oauthStatesSupprimes: 2,
      codesAppariementSupprimes: 3,
      sessionsCloturees: 1,
    });
    expect(tx.oAuthState.deleteMany).toHaveBeenCalledWith({
      where: {
        OR: [
          { expiresAt: { lt: new Date('2026-09-04T20:00:00.000Z') } },
          { consumedAt: { lt: new Date('2026-09-04T20:00:00.000Z') } },
        ],
      },
    });
    expect(tx.extensionPairingToken.deleteMany).toHaveBeenCalled();
    expect(tx.watchSession.updateMany).toHaveBeenCalledWith({
      where: {
        statut: 'EN_COURS',
        dernierHeartbeatAt: { lt: new Date('2026-09-05T19:50:00.000Z') },
      },
      data: { statut: 'TERMINEE', dernierHeartbeatAt: maintenant },
    });
  });

  it('propage une erreur pour laisser BullMQ appliquer ses reprises', async () => {
    const prisma = {
      $transaction: jest.fn().mockRejectedValue(new Error('base indisponible')),
    };

    await expect(nettoyerEtatsTemporaires(prisma as never)).rejects.toThrow(
      'base indisponible',
    );
  });
});

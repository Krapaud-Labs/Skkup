import type { PrismaClient } from '../../generated/prisma/client';

/**
 * Les états OAuth et les codes d'appariement ne servent plus après leur
 * expiration. Une courte rétention permet de conserver un minimum de trace
 * opérationnelle sans garder indéfiniment des secrets dérivés.
 */
export const RETENTION_ETATS_TEMPORAIRES_MS = 24 * 60 * 60 * 1000;

/** Une session sans heartbeat depuis ce délai est considérée comme abandonnée. */
export const INACTIVITE_SESSION_MS = 10 * 60 * 1000;

const CLE_VERROU_MAINTENANCE = 'skuup-maintenance-cleanup';

export type ResultatNettoyage = {
  ignore: boolean;
  raison?: 'execution_concurrente';
  oauthStatesSupprimes: number;
  codesAppariementSupprimes: number;
  sessionsCloturees: number;
};

/**
 * Nettoie les états temporaires et clôt les sessions abandonnées.
 *
 * Le verrou advisory PostgreSQL rend l'exécution idempotente et sûre avec
 * plusieurs workers : une seule transaction modifie ces données à la fois.
 */
export async function nettoyerEtatsTemporaires(
  prisma: PrismaClient,
  maintenant = new Date(),
): Promise<ResultatNettoyage> {
  const retention = new Date(
    maintenant.getTime() - RETENTION_ETATS_TEMPORAIRES_MS,
  );
  const seuilInactivite = new Date(
    maintenant.getTime() - INACTIVITE_SESSION_MS,
  );

  return prisma.$transaction(async (tx) => {
    const verrou = await tx.$queryRaw<Array<{ acquired: boolean }>>`
      SELECT pg_try_advisory_xact_lock(hashtextextended(${CLE_VERROU_MAINTENANCE}, 0)) AS acquired
    `;
    if (!verrou[0]?.acquired) {
      return {
        ignore: true,
        raison: 'execution_concurrente' as const,
        oauthStatesSupprimes: 0,
        codesAppariementSupprimes: 0,
        sessionsCloturees: 0,
      };
    }

    const oauthStates = await tx.oAuthState.deleteMany({
      where: {
        OR: [
          { expiresAt: { lt: retention } },
          { consumedAt: { lt: retention } },
        ],
      },
    });
    const codesAppariement = await tx.extensionPairingToken.deleteMany({
      where: {
        OR: [
          { expireAt: { lt: retention } },
          { consommeAt: { lt: retention } },
        ],
      },
    });
    const sessions = await tx.watchSession.updateMany({
      where: {
        statut: 'EN_COURS',
        dernierHeartbeatAt: { lt: seuilInactivite },
      },
      data: {
        statut: 'TERMINEE',
        dernierHeartbeatAt: maintenant,
      },
    });

    return {
      ignore: false,
      oauthStatesSupprimes: oauthStates.count,
      codesAppariementSupprimes: codesAppariement.count,
      sessionsCloturees: sessions.count,
    };
  });
}

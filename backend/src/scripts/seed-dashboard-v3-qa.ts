// Fixture locale opt-in pour la recette visuelle DASH-V3.
// Aucun appel ne doit créer ces données par défaut ou en production.
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../generated/prisma/client';
import type { Prisma } from '../../generated/prisma/client';
import {
  FraudFlagStatus,
  ManagedContentStatus,
  ManagedContentType,
  Platform,
  RaffleStatus,
  Role,
} from '../../generated/prisma/enums';
import { DASHBOARD_V3_QA_FRAUD_FLAGS } from './seed-dashboard-v3-qa.fixture';

const email = 'dash-v3-qa-20261003@example.test';
const raffleId = 'qa_dashv3_raffle';
const lotId = 'qa_dashv3_lot';
const qaLots = [
  {
    id: lotId,
    nom: 'QA · Lot de validation',
    valeurEstimee: '199.00',
    quantite: 1,
  },
  {
    id: 'qa_dashv3_lot_reward',
    nom: 'QA · Récompense premium',
    valeurEstimee: '89.00',
    quantite: 6,
  },
  {
    id: 'qa_dashv3_lot_watch',
    nom: 'QA · Bonus visionnage',
    valeurEstimee: '49.00',
    quantite: 3,
  },
  {
    id: 'qa_dashv3_lot_points',
    nom: 'QA · Pack de points',
    valeurEstimee: '25.00',
    quantite: 12,
  },
];
const announcementId = 'qa_dashv3_announcement';
const streamIds = ['qa_dashv3_stream_twitch', 'qa_dashv3_stream_youtube'];
const scratchCardIds = [
  'qa_dashv3_scratch_classic',
  'qa_dashv3_scratch_streak',
  'qa_dashv3_scratch_bonus',
];
const contentSlugs = ['qa-dashv3-home', 'qa-dashv3-rules'];

async function main() {
  const qaEnvironment = process.env.DASHV3_QA_ENVIRONMENT;
  if (
    process.env.DASHV3_QA_FIXTURE !== '1' ||
    process.env.NODE_ENV === 'production' ||
    !['qa', 'staging'].includes(qaEnvironment ?? '')
  ) {
    console.error(
      'Fixture refusée : définir DASHV3_QA_FIXTURE=1 et DASHV3_QA_ENVIRONMENT=qa|staging, hors production.',
    );
    process.exitCode = 1;
    return;
  }
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error(
      'DATABASE_URL absente : exécuter le script dans le conteneur backend.',
    );
    process.exitCode = 1;
    return;
  }
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: url }),
  });
  try {
    const admin = await prisma.user.findUnique({
      where: { email },
      select: { id: true, role: true },
    });
    if (!admin || admin.role !== Role.ADMIN)
      throw new Error(`Compte QA admin absent ou non ADMIN : ${email}`);
    await prisma.raffle.upsert({
      where: { id: raffleId },
      update: {
        titre: 'QA · Tirage dashboard V3',
        description:
          'Fixture locale de validation visuelle et fonctionnelle du dashboard admin.',
        statut: RaffleStatus.OUVERT,
      },
      create: {
        id: raffleId,
        titre: 'QA · Tirage dashboard V3',
        description:
          'Fixture locale de validation visuelle et fonctionnelle du dashboard admin.',
        dateOuverture: new Date(Date.now() - 86_400_000),
        dateTirage: new Date(Date.now() + 7 * 86_400_000),
        statut: RaffleStatus.OUVERT,
        engagementGraine: 'qa-fixture-commitment',
      },
    });
    for (const lot of qaLots) {
      await prisma.raffleLot.upsert({
        where: { id: lot.id },
        update: { raffleId, ...lot, fournisseur: 'Fixture locale DASH-V3' },
        create: { raffleId, ...lot, fournisseur: 'Fixture locale DASH-V3' },
      });
    }
    // Les anciennes fixtures QA peuvent avoir des gagnants liés. On les
    // conserve et retire uniquement leur média vitrine, sans suppression en
    // cascade ni impact sur les données métier.
    await prisma.raffleLot.updateMany({
      where: { nom: { startsWith: 'QA' } },
      data: { imageUrl: null },
    });
    await prisma.announcement.upsert({
      where: { id: announcementId },
      update: {
        titre: 'QA · Annonce de validation DASH-V3',
        texte:
          'Message de recette opt-in pour vérifier la liste éditoriale, le statut et la fenêtre de publication.',
        actif: true,
        debutAt: new Date(Date.now() - 86_400_000),
        finAt: new Date(Date.now() + 30 * 86_400_000),
        createdById: admin.id,
      },
      create: {
        id: announcementId,
        titre: 'QA · Annonce de validation DASH-V3',
        texte:
          'Message de recette opt-in pour vérifier la liste éditoriale, le statut et la fenêtre de publication.',
        actif: true,
        debutAt: new Date(Date.now() - 86_400_000),
        finAt: new Date(Date.now() + 30 * 86_400_000),
        createdById: admin.id,
      },
    });
    await prisma.contentAuditEvent.deleteMany({
      where: {
        actorId: admin.id,
        entityId: announcementId,
        action: 'QA_DASHV3_ANNOUNCEMENT_SEEDED',
      },
    });
    await prisma.contentAuditEvent.create({
      data: {
        actorId: admin.id,
        action: 'QA_DASHV3_ANNOUNCEMENT_SEEDED',
        entityType: 'Announcement',
        entityId: announcementId,
        metadata: { source: 'dashboard-v3-qa-fixture' },
      },
    });
    for (const fraudFlag of DASHBOARD_V3_QA_FRAUD_FLAGS) {
      await prisma.fraudFlag.upsert({
        where: { id: fraudFlag.id },
        update: {
          userId: admin.id,
          type: fraudFlag.type,
          details: fraudFlag.details,
          statut: FraudFlagStatus.OUVERTE,
          createdAt: fraudFlag.createdAt,
          examineeAt: null,
        },
        create: {
          id: fraudFlag.id,
          userId: admin.id,
          type: fraudFlag.type,
          details: fraudFlag.details,
          statut: FraudFlagStatus.OUVERTE,
          createdAt: fraudFlag.createdAt,
        },
      });
    }
    await prisma.stream.upsert({
      where: { id: streamIds[0] },
      update: {
        plateforme: Platform.TWITCH,
        identifiantChaine: 'qa_dashv3_twitch',
        nomAffiche: 'QA · Stream Twitch',
        actif: true,
        estPartenaire: true,
        bonusPointsHeure: 10,
      },
      create: {
        id: streamIds[0],
        plateforme: Platform.TWITCH,
        identifiantChaine: 'qa_dashv3_twitch',
        nomAffiche: 'QA · Stream Twitch',
        actif: true,
        estPartenaire: true,
        bonusPointsHeure: 10,
      },
    });
    await prisma.stream.upsert({
      where: { id: streamIds[1] },
      update: {
        plateforme: Platform.YOUTUBE,
        identifiantChaine: 'qa_dashv3_youtube',
        nomAffiche: 'QA · Stream YouTube',
        actif: true,
        estPartenaire: false,
        bonusPointsHeure: 5,
      },
      create: {
        id: streamIds[1],
        plateforme: Platform.YOUTUBE,
        identifiantChaine: 'qa_dashv3_youtube',
        nomAffiche: 'QA · Stream YouTube',
        actif: true,
        estPartenaire: false,
        bonusPointsHeure: 5,
      },
    });
    await prisma.scratchCard.upsert({
      where: { id: scratchCardIds[0] },
      update: {
        userId: admin.id,
        streakPalier: 0,
        grattee: false,
        gainType: 'POINTS',
        gainMontant: 200,
        gratteeAt: null,
      },
      create: {
        id: scratchCardIds[0],
        userId: admin.id,
        streakPalier: 0,
        grattee: false,
        gainType: 'POINTS',
        gainMontant: 200,
      },
    });
    await prisma.scratchCard.upsert({
      where: { id: scratchCardIds[1] },
      update: {
        userId: admin.id,
        streakPalier: 7,
        grattee: false,
        gainType: 'TICKET',
        gainMontant: 1,
        gratteeAt: null,
      },
      create: {
        id: scratchCardIds[1],
        userId: admin.id,
        streakPalier: 7,
        grattee: false,
        gainType: 'TICKET',
        gainMontant: 1,
      },
    });
    await prisma.scratchCard.upsert({
      where: { id: scratchCardIds[2] },
      update: {
        userId: admin.id,
        streakPalier: 14,
        grattee: false,
        gainType: 'POINTS',
        gainMontant: 500,
        gratteeAt: null,
      },
      create: {
        id: scratchCardIds[2],
        userId: admin.id,
        streakPalier: 14,
        grattee: false,
        gainType: 'POINTS',
        gainMontant: 500,
      },
    });
    const landingContent = await prisma.managedContent.upsert({
      where: {
        slug_type_locale: {
          slug: contentSlugs[0],
          type: ManagedContentType.LANDING,
          locale: 'fr',
        },
      },
      update: {
        status: ManagedContentStatus.PUBLISHED,
        data: {
          title: 'QA · Accueil DASH-V3',
          intro: 'Contenu de recette éditoriale raccordé au contrat admin.',
          sections: [
            {
              heading: 'Une expérience Skkup claire',
              body: 'Bloc de validation pour la liste, l’aperçu et la publication.',
            },
          ],
        },
        version: 1,
        updatedById: admin.id,
        publishedAt: new Date(),
      },
      create: {
        slug: contentSlugs[0],
        type: ManagedContentType.LANDING,
        locale: 'fr',
        status: ManagedContentStatus.PUBLISHED,
        data: {
          title: 'QA · Accueil DASH-V3',
          intro: 'Contenu de recette éditoriale raccordé au contrat admin.',
          sections: [
            {
              heading: 'Une expérience Skkup claire',
              body: 'Bloc de validation pour la liste, l’aperçu et la publication.',
            },
          ],
        },
        createdById: admin.id,
        updatedById: admin.id,
        publishedAt: new Date(),
      },
    });
    await prisma.contentVersion.deleteMany({
      where: { contentId: landingContent.id },
    });
    await prisma.contentVersion.create({
      data: {
        contentId: landingContent.id,
        version: 1,
        data: landingContent.data as Prisma.InputJsonValue,
        status: ManagedContentStatus.PUBLISHED,
        createdById: admin.id,
      },
    });
    await prisma.managedContent.upsert({
      where: {
        slug_type_locale: {
          slug: contentSlugs[1],
          type: ManagedContentType.LEGAL,
          locale: 'fr',
        },
      },
      update: {
        status: ManagedContentStatus.DRAFT,
        data: {
          title: 'QA · Règlement DASH-V3',
          intro:
            'Brouillon de recette pour vérifier le cycle draft/publication.',
          sections: [
            {
              heading: 'Version de travail',
              body: 'Ce contenu reste non publié tant qu’un administrateur ne l’a pas validé.',
            },
          ],
        },
        version: 2,
        updatedById: admin.id,
        publishedAt: null,
      },
      create: {
        slug: contentSlugs[1],
        type: ManagedContentType.LEGAL,
        locale: 'fr',
        status: ManagedContentStatus.DRAFT,
        data: {
          title: 'QA · Règlement DASH-V3',
          intro:
            'Brouillon de recette pour vérifier le cycle draft/publication.',
          sections: [
            {
              heading: 'Version de travail',
              body: 'Ce contenu reste non publié tant qu’un administrateur ne l’a pas validé.',
            },
          ],
        },
        createdById: admin.id,
        updatedById: admin.id,
      },
    });
    console.log(
      `Fixture DASH-V3 prête : ${raffleId} / ${lotId} / ${announcementId} / ${DASHBOARD_V3_QA_FRAUD_FLAGS.length} signalements / ${streamIds.join(' / ')} / ${scratchCardIds.join(' / ')} / ${contentSlugs.join(' / ')}`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

void main();

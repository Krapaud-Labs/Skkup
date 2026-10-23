// Données de démonstration locales, opt-in et idempotentes.
// Ne jamais exécuter ce script contre une base de production.
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../generated/prisma/client';
import {
  Platform,
  PointsTransactionType,
  RaffleStatus,
  Role,
  WatchSessionSource,
  WatchSessionStatus,
} from '../../generated/prisma/enums';
import bcrypt from 'bcrypt';

const firstNames = [
  'Camille',
  'Alexandre',
  'Chloé',
  'Thomas',
  'Manon',
  'Lucas',
  'Sarah',
  'Hugo',
  'Léa',
  'Nathan',
];
const lastNames = ['Martin', 'Bernard', 'Dubois', 'Robert', 'Richard'];
const password = 'Skkup-local-demo-2026!';
const raffleId = 'local_demo_raffle';

async function main() {
  if (
    process.env.LOCAL_DEMO_DATA !== '1' ||
    process.env.NODE_ENV === 'production'
  ) {
    throw new Error(
      'Seed local refusé : définir LOCAL_DEMO_DATA=1 hors production.',
    );
  }
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL absente.');
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: url }),
  });
  const passwordHash = await bcrypt.hash(password, 10);
  try {
    const admin = await prisma.user.findFirst({
      where: { role: Role.ADMIN },
      select: { id: true },
    });
    if (!admin)
      throw new Error('Un compte ADMIN local est requis avant ce seed.');

    await prisma.raffle.upsert({
      where: { id: raffleId },
      update: {
        titre: 'Tirage de démonstration',
        description: 'Données locales pour tester la densité des tableaux.',
        statut: RaffleStatus.OUVERT,
      },
      create: {
        id: raffleId,
        titre: 'Tirage de démonstration',
        description: 'Données locales pour tester la densité des tableaux.',
        dateOuverture: new Date(Date.now() - 7 * 86_400_000),
        dateTirage: new Date(Date.now() + 14 * 86_400_000),
        statut: RaffleStatus.OUVERT,
      },
    });
    await prisma.raffleLot.createMany({
      data: [1, 2, 3].map((index) => ({
        id: `local_demo_lot_${index}`,
        raffleId,
        nom: `Récompense démonstration ${index}`,
        valeurEstimee: `${index * 25}.00`,
        quantite: index + 1,
        fournisseur: 'Skkup',
      })),
      skipDuplicates: true,
    });

    const users = Array.from({ length: 50 }, (_, index) => {
      const number = index + 1;
      const firstName = firstNames[index % firstNames.length];
      const lastName = lastNames[Math.floor(index / firstNames.length)];
      return {
        id: `local_demo_user_${String(number).padStart(2, '0')}`,
        email: `demo.${String(number).padStart(2, '0')}@local.skkup.fr`,
        pseudo: `${firstName}${lastName}${number}`,
        passwordHash,
        streakActuel: [3, 7, 14, 21, 30][index % 5],
        streakMax: 30,
        soldePoints: 120 + index * 17,
        derniereVisiteAt: new Date(Date.now() - (index % 6) * 86_400_000),
        createdAt: new Date(Date.now() - (50 - index) * 86_400_000),
      };
    });
    await prisma.user.createMany({ data: users, skipDuplicates: true });

    const transactions = users.flatMap((user, userIndex) =>
      Array.from({ length: 8 }, (_, item) => ({
        id: `local_demo_tx_${String(userIndex + 1).padStart(2, '0')}_${item + 1}`,
        userId: user.id,
        type:
          item % 3 === 0
            ? PointsTransactionType.VISITE_QUOTIDIENNE
            : PointsTransactionType.WATCH_TIME,
        montant: item % 3 === 0 ? 5 : 10 + (item % 4) * 5,
        createdAt: new Date(
          Date.now() - (item + (userIndex % 10)) * 86_400_000,
        ),
      })),
    );
    await prisma.pointsTransaction.createMany({
      data: transactions,
      skipDuplicates: true,
    });

    const sessions = users.flatMap((user, userIndex) =>
      Array.from({ length: 3 }, (_, item) => ({
        id: `local_demo_session_${String(userIndex + 1).padStart(2, '0')}_${item + 1}`,
        userId: user.id,
        platform: [Platform.TWITCH, Platform.YOUTUBE, Platform.KICK][item],
        streamExternalId: `local-demo-stream-${item + 1}`,
        source: WatchSessionSource.EXTENSION,
        debutAt: new Date(Date.now() - (item + 2) * 86_400_000),
        dernierHeartbeatAt: new Date(Date.now() - (item + 1) * 86_400_000),
        dureeValideeSecondes: 1800 + item * 900,
        statut: WatchSessionStatus.TERMINEE,
      })),
    );
    await prisma.watchSession.createMany({
      data: sessions,
      skipDuplicates: true,
    });

    const cards = users.flatMap((user, userIndex) =>
      [3, 7, 14].map((streakPalier, item) => ({
        id: `local_demo_card_${String(userIndex + 1).padStart(2, '0')}_${item + 1}`,
        userId: user.id,
        streakPalier,
        grattee: item === 0 && userIndex % 2 === 0,
        gainType: item === 1 ? 'TICKET' : 'POINTS',
        gainMontant: item === 1 ? 1 : 25 + item * 25,
        gratteeAt:
          item === 0 && userIndex % 2 === 0
            ? new Date(Date.now() - 86_400_000)
            : null,
      })),
    );
    await prisma.scratchCard.createMany({ data: cards, skipDuplicates: true });

    await prisma.raffleTicket.createMany({
      data: users.map((user) => ({
        id: `local_demo_ticket_${user.id}`,
        raffleId,
        userId: user.id,
      })),
      skipDuplicates: true,
    });
    console.log(
      `Données locales prêtes : ${users.length} comptes, ${transactions.length} transactions, ${sessions.length} sessions, ${cards.length} cartes et ${users.length} tickets.`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

void main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});

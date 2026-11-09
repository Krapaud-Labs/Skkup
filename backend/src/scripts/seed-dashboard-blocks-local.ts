// Fixture opt-in pour les tableaux de bord Admin et Viewer.
// Elle n'est destinée qu'à une base PostgreSQL locale de développement/test.
import { PrismaPg } from '@prisma/adapter-pg';
import { Prisma, PrismaClient } from '../../generated/prisma/client';
import { Role } from '../../generated/prisma/enums';
import { buildDashboardBlocksFixturePlan } from './seed-dashboard-blocks-local.fixture';
import {
  dashboardBlocksAnchorDate,
  validateDashboardBlocksSeedTarget,
} from './seed-dashboard-blocks-local.guard';

function requiredEmail(name: string): string {
  const email = process.env[name]?.trim().toLowerCase();
  if (!email)
    throw new Error(
      `Seed refusé : définir ${name} avec le compte local ciblé.`,
    );
  return email;
}

async function seed(
  prisma: Prisma.TransactionClient,
  adminId: string,
  viewerId: string,
  anchor: Date,
) {
  const plan = buildDashboardBlocksFixturePlan(anchor, adminId, viewerId);

  for (const raffle of plan.raffles) {
    const { id, ...data } = raffle;
    await prisma.raffle.upsert({
      where: { id },
      update: data,
      create: raffle,
    });
  }

  for (const lot of plan.lots) {
    const { id, ...data } = lot;
    await prisma.raffleLot.upsert({
      where: { id },
      update: data,
      create: lot,
    });
  }

  for (const ticket of plan.tickets) {
    const { id, ...data } = ticket;
    await prisma.raffleTicket.upsert({
      where: { id },
      update: data,
      create: ticket,
    });
  }

  for (const announcement of plan.announcements) {
    const { id, ...data } = announcement;
    await prisma.announcement.upsert({
      where: { id },
      update: data,
      create: announcement,
    });
  }

  for (const flag of plan.fraudFlags) {
    const { id, ...data } = flag;
    await prisma.fraudFlag.upsert({
      where: { id },
      update: data,
      create: flag,
    });
  }

  for (const stream of plan.streams) {
    const { id, ...data } = stream;
    await prisma.stream.upsert({
      where: { id },
      update: data,
      create: stream,
    });
  }

  for (const content of plan.contents) {
    const { slug, type, locale, ...data } = content;
    await prisma.managedContent.upsert({
      where: { slug_type_locale: { slug, type, locale } },
      update: data,
      create: content,
    });
  }

  for (const session of plan.sessions) {
    const { id, ...data } = session;
    await prisma.watchSession.upsert({
      where: { id },
      update: data,
      create: session,
    });
  }

  for (const transaction of plan.transactions) {
    const { id, ...data } = transaction;
    await prisma.pointsTransaction.upsert({
      where: { id },
      update: data,
      create: transaction,
    });
  }

  for (const card of plan.scratchCards) {
    const { id, ...data } = card;
    await prisma.scratchCard.upsert({
      where: { id },
      update: data,
      create: card,
    });
  }

  for (const event of plan.auditEvents) {
    const { id, ...data } = event;
    await prisma.contentAuditEvent.upsert({
      where: { id },
      update: data,
      create: event,
    });
  }
}

async function main() {
  const target = validateDashboardBlocksSeedTarget(process.env);
  const anchor = dashboardBlocksAnchorDate(
    process.env.DASHBOARD_BLOCKS_SEED_DATE,
  );
  const adminEmail = requiredEmail('DASHBOARD_BLOCKS_ADMIN_EMAIL');
  const viewerEmail = requiredEmail('DASHBOARD_BLOCKS_VIEWER_EMAIL');
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: target.connectionString }),
  });

  try {
    const [admin, viewer] = await Promise.all([
      prisma.user.findUnique({
        where: { email: adminEmail },
        select: { id: true, role: true },
      }),
      prisma.user.findUnique({
        where: { email: viewerEmail },
        select: { id: true, role: true },
      }),
    ]);
    if (!admin || admin.role !== Role.ADMIN) {
      throw new Error(
        'Le compte DASHBOARD_BLOCKS_ADMIN_EMAIL doit exister et être ADMIN.',
      );
    }
    if (!viewer || viewer.role !== Role.VIEWER || viewer.id === admin.id) {
      throw new Error(
        'Le compte DASHBOARD_BLOCKS_VIEWER_EMAIL doit exister, être VIEWER et distinct de l’ADMIN.',
      );
    }

    await prisma.$transaction((tx) => seed(tx, admin.id, viewer.id, anchor));
    console.log(
      `Fixtures dashboard locales prêtes dans ${target.databaseName} pour ${anchor.toISOString().slice(0, 10)}. Aucun compte n’a été créé ou modifié.`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});

// Fixture locale opt-in pour la recette visuelle DASH-V3.
// Aucun appel ne doit créer ces données par défaut ou en production.
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../generated/prisma/client';
import { RaffleStatus, Role } from '../../generated/prisma/enums';

const email = 'dash-v3-qa-20261003@example.test';
const raffleId = 'qa_dashv3_raffle';
const lotId = 'qa_dashv3_lot';

async function main() {
  if (process.env.DASHV3_QA_FIXTURE !== '1' || process.env.NODE_ENV === 'production') {
    console.error('Fixture refusée : définir DASHV3_QA_FIXTURE=1 hors production.');
    process.exitCode = 1;
    return;
  }
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('DATABASE_URL absente : exécuter le script dans le conteneur backend.');
    process.exitCode = 1;
    return;
  }
  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });
  try {
    const admin = await prisma.user.findUnique({ where: { email }, select: { id: true, role: true } });
    if (!admin || admin.role !== Role.ADMIN) throw new Error(`Compte QA admin absent ou non ADMIN : ${email}`);
    await prisma.raffle.upsert({
      where: { id: raffleId },
      update: { titre: 'QA · Tirage dashboard V3', description: 'Fixture locale de validation visuelle et fonctionnelle du dashboard admin.', statut: RaffleStatus.OUVERT },
      create: { id: raffleId, titre: 'QA · Tirage dashboard V3', description: 'Fixture locale de validation visuelle et fonctionnelle du dashboard admin.', dateOuverture: new Date(Date.now() - 86_400_000), dateTirage: new Date(Date.now() + 7 * 86_400_000), statut: RaffleStatus.OUVERT, engagementGraine: 'qa-fixture-commitment' },
    });
    await prisma.raffleLot.upsert({ where: { id: lotId }, update: { raffleId, nom: 'QA · Lot de validation', valeurEstimee: '199.00', quantite: 1, fournisseur: 'Fixture locale DASH-V3' }, create: { id: lotId, raffleId, nom: 'QA · Lot de validation', valeurEstimee: '199.00', quantite: 1, fournisseur: 'Fixture locale DASH-V3' } });
    console.log(`Fixture DASH-V3 prête : ${raffleId} / ${lotId}`);
  } finally { await prisma.$disconnect(); }
}

void main();

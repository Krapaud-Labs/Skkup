// Fixture locale opt-in pour la recette visuelle DASH-V3.
// Aucun appel ne doit créer ces données par défaut ou en production.
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../generated/prisma/client';
import { FraudFlagStatus, Platform, RaffleStatus, Role } from '../../generated/prisma/enums';

const email = 'dash-v3-qa-20261003@example.test';
const raffleId = 'qa_dashv3_raffle';
const lotId = 'qa_dashv3_lot';
const announcementId = 'qa_dashv3_announcement';
const fraudFlagId = 'qa_dashv3_fraud_flag';
const streamIds = ['qa_dashv3_stream_twitch', 'qa_dashv3_stream_youtube'];
const scratchCardIds = ['qa_dashv3_scratch_classic', 'qa_dashv3_scratch_streak', 'qa_dashv3_scratch_bonus'];

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
    await prisma.announcement.upsert({ where: { id: announcementId }, update: { titre: 'QA · Annonce de validation DASH-V3', texte: 'Message de recette opt-in pour vérifier la liste éditoriale, le statut et la fenêtre de publication.', actif: true, debutAt: new Date(Date.now() - 86_400_000), finAt: new Date(Date.now() + 30 * 86_400_000), createdById: admin.id }, create: { id: announcementId, titre: 'QA · Annonce de validation DASH-V3', texte: 'Message de recette opt-in pour vérifier la liste éditoriale, le statut et la fenêtre de publication.', actif: true, debutAt: new Date(Date.now() - 86_400_000), finAt: new Date(Date.now() + 30 * 86_400_000), createdById: admin.id } });
    await prisma.fraudFlag.upsert({ where: { id: fraudFlagId }, update: { userId: admin.id, type: 'QA_DASHV3', details: 'Signalement de recette opt-in pour valider la liste et le panneau de modération.', statut: FraudFlagStatus.OUVERTE }, create: { id: fraudFlagId, userId: admin.id, type: 'QA_DASHV3', details: 'Signalement de recette opt-in pour valider la liste et le panneau de modération.', statut: FraudFlagStatus.OUVERTE } });
    await prisma.stream.upsert({ where: { id: streamIds[0] }, update: { plateforme: Platform.TWITCH, identifiantChaine: 'qa_dashv3_twitch', nomAffiche: 'QA · Stream Twitch', actif: true, estPartenaire: true, bonusPointsHeure: 10 }, create: { id: streamIds[0], plateforme: Platform.TWITCH, identifiantChaine: 'qa_dashv3_twitch', nomAffiche: 'QA · Stream Twitch', actif: true, estPartenaire: true, bonusPointsHeure: 10 } });
    await prisma.stream.upsert({ where: { id: streamIds[1] }, update: { plateforme: Platform.YOUTUBE, identifiantChaine: 'qa_dashv3_youtube', nomAffiche: 'QA · Stream YouTube', actif: true, estPartenaire: false, bonusPointsHeure: 5 }, create: { id: streamIds[1], plateforme: Platform.YOUTUBE, identifiantChaine: 'qa_dashv3_youtube', nomAffiche: 'QA · Stream YouTube', actif: true, estPartenaire: false, bonusPointsHeure: 5 } });
    await prisma.scratchCard.upsert({ where: { id: scratchCardIds[0] }, update: { userId: admin.id, streakPalier: 0, grattee: false, gainType: 'POINTS', gainMontant: 200, gratteeAt: null }, create: { id: scratchCardIds[0], userId: admin.id, streakPalier: 0, grattee: false, gainType: 'POINTS', gainMontant: 200 } });
    await prisma.scratchCard.upsert({ where: { id: scratchCardIds[1] }, update: { userId: admin.id, streakPalier: 7, grattee: false, gainType: 'TICKET', gainMontant: 1, gratteeAt: null }, create: { id: scratchCardIds[1], userId: admin.id, streakPalier: 7, grattee: false, gainType: 'TICKET', gainMontant: 1 } });
    await prisma.scratchCard.upsert({ where: { id: scratchCardIds[2] }, update: { userId: admin.id, streakPalier: 14, grattee: false, gainType: 'POINTS', gainMontant: 500, gratteeAt: null }, create: { id: scratchCardIds[2], userId: admin.id, streakPalier: 14, grattee: false, gainType: 'POINTS', gainMontant: 500 } });
    console.log(`Fixture DASH-V3 prête : ${raffleId} / ${lotId} / ${announcementId} / ${fraudFlagId} / ${streamIds.join(' / ')} / ${scratchCardIds.join(' / ')}`);
  } finally { await prisma.$disconnect(); }
}

void main();

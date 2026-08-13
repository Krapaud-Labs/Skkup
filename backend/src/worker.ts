// Point d'entrée du worker BullMQ. Héberge pour l'instant le job planifié
// de tirage au sort ; l'agrégation de watch time viendra s'ajouter ici via
// sa propre carte Trello.

import { Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';
import { executerTiragesDus } from './raffles/raffle-draw';
import { publierEvenementTempsReel } from './realtime/realtime.bridge';
import {
  EVENEMENT_TIRAGE_RESULTAT,
  ROOM_TIRAGES,
} from './realtime/realtime.constants';
import type { NotificationResultatTirage } from './realtime/realtime.service';

const NOM_FILE_TIRAGES = 'raffles';
const JOB_TIRAGES_DUS = 'tirages-dus';

// Le job repasse toutes les minutes : la date de tirage exacte est portée
// par le Raffle en base, la planification n'a donc qu'à vérifier
// régulièrement s'il y a quelque chose à tirer. Une exécution ratée
// (worker redémarré) est ainsi rattrapée à la minute suivante.
const INTERVALLE_VERIFICATION_MS = 60_000;

// `maxRetriesPerRequest: null` est imposé par BullMQ pour les workers
// (les commandes bloquantes ne doivent pas expirer côté client).
const connexionRedis = new IORedis(
  process.env.REDIS_URL ?? 'redis://redis:6379',
  { maxRetriesPerRequest: null },
);

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const fileTirages = new Queue(NOM_FILE_TIRAGES, {
  connection: connexionRedis,
});

const workerTirages = new Worker(
  NOM_FILE_TIRAGES,
  async () => {
    const resultats = await executerTiragesDus(prisma, {
      // Point d'extension appelé après le commit : le worker n'héberge
      // pas de serveur Socket.io, il passe donc par le canal Redis que
      // la Gateway relaie aux clients connectés.
      onTirageTermine: async (resultat) => {
        console.log(
          `Tirage ${resultat.raffleId} exécuté : ${resultat.gagnants.length} gagnant(s) ` +
            `sur ${resultat.nombreTickets} ticket(s), graine ${resultat.graineAleatoire}`,
        );
        try {
          // Payload calqué sur `GET /raffles/:id/result` : l'événement
          // est diffusé à tous les clients connectés, l'identifiant
          // utilisateur des gagnants ne doit donc pas en sortir.
          const donnees: NotificationResultatTirage = {
            raffleId: resultat.raffleId,
            graineAleatoire: resultat.graineAleatoire,
            empreinteParticipants: resultat.empreinteParticipants,
            resultatPublieAt: resultat.resultatPublieAt,
            nombreTickets: resultat.nombreTickets,
            gagnants: resultat.gagnants.map((gagnant) => ({
              lotId: gagnant.lotId,
              ticketId: gagnant.ticketId,
            })),
          };
          await publierEvenementTempsReel(connexionRedis, {
            room: ROOM_TIRAGES,
            evenement: EVENEMENT_TIRAGE_RESULTAT,
            donnees,
          });
        } catch (erreur) {
          // Le résultat est déjà en base : une notification perdue ne
          // doit jamais faire échouer (ni rejouer) un tirage.
          console.error(
            `Notification temps réel du tirage ${resultat.raffleId} non publiée :`,
            erreur,
          );
        }
      },
    });
    return { tiragesExecutes: resultats.length };
  },
  { connection: connexionRedis },
);

workerTirages.on('failed', (job, erreur) => {
  console.error(`Job ${job?.name ?? '?'} en échec :`, erreur);
});

async function demarrer() {
  // `jobId` fixe : réenregistrer la planification au redémarrage ne crée
  // pas de doublon de job répété.
  await fileTirages.upsertJobScheduler(
    JOB_TIRAGES_DUS,
    { every: INTERVALLE_VERIFICATION_MS },
    { name: JOB_TIRAGES_DUS },
  );
  console.log('Worker démarré : job planifié de tirage au sort actif.');
}

async function arreter() {
  await workerTirages.close();
  await fileTirages.close();
  await prisma.$disconnect();
  process.exit(0);
}

process.on('SIGTERM', () => void arreter());
process.on('SIGINT', () => void arreter());

void demarrer();

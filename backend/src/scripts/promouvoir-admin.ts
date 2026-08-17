// Commande CLI réservée à l'opérateur ayant un accès direct au serveur
// (shell du conteneur ou de la machine hébergeant le backend). Aucun
// endpoint HTTP n'accomplit cette action : un utilisateur authentifié ne
// doit jamais pouvoir s'auto-élever au rôle ADMIN, seule une personne
// disposant déjà d'un accès infrastructure le peut. Voir
// docs/05-security.md, section "Désignation du premier compte
// administrateur".
//
// Usage (depuis le conteneur backend) :
//   docker compose exec backend npm run admin:promote -- utilisateur@example.com
//
// `DATABASE_URL` est lue dans l'environnement du processus, comme le font
// déjà `main.ts` et `worker.ts` : les conteneurs la reçoivent via
// `env_file: .env` dans docker-compose. Volontairement pas de
// `dotenv/config` ici, `dotenv` est une dépendance de développement et
// l'image de production est construite avec `npm ci --omit=dev` : le
// script planterait au démarrage précisément là où il doit servir.

import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../generated/prisma/client';
import { Role } from '../../generated/prisma/enums';

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.error('Usage : npm run admin:promote -- utilisateur@example.com');
    process.exitCode = 1;
    return;
  }

  // Sans URL explicite, le driver pg retomberait sur ses valeurs par
  // défaut (hôte local, utilisateur système) et opérerait silencieusement
  // sur une base qui n'est pas celle visée : on refuse plutôt que de
  // promouvoir un compte au petit bonheur.
  const urlBase = process.env.DATABASE_URL;
  if (!urlBase) {
    console.error(
      'DATABASE_URL absente de l’environnement : exécuter la commande ' +
        'depuis le conteneur backend (docker compose exec backend ...).',
    );
    process.exitCode = 1;
    return;
  }

  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: urlBase }),
  });

  try {
    const utilisateur = await prisma.user.findUnique({ where: { email } });
    if (!utilisateur) {
      console.error(`Aucun compte trouvé pour ${email}.`);
      process.exitCode = 1;
      return;
    }

    if (utilisateur.role === Role.ADMIN) {
      console.log(`${email} est déjà administrateur.`);
      return;
    }

    await prisma.user.update({
      where: { id: utilisateur.id },
      data: { role: Role.ADMIN },
    });
    console.log(`${email} promu administrateur.`);
  } finally {
    await prisma.$disconnect();
  }
}

void main();

// Commande CLI réservée à l'opérateur ayant un accès direct au serveur
// (shell du conteneur ou de la machine hébergeant le backend). Aucun
// endpoint HTTP n'accomplit cette action : un utilisateur authentifié ne
// doit jamais pouvoir s'auto-élever au rôle ADMIN, seule une personne
// disposant déjà d'un accès infrastructure le peut. Voir
// docs/05-security.md, section "Désignation du premier compte
// administrateur".
//
// Usage : npm run admin:promote -- utilisateur@example.com

import 'dotenv/config';
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

  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
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

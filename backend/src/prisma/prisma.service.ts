import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../generated/prisma/client';

// Service unique instancié une seule fois (voir PrismaModule en @Global)
// et injecté dans tous les autres services ayant besoin d'accéder à la
// base de données.
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  // --- Connexion ---
  // Prisma 7 requiert un adaptateur de driver explicite (plus de
  // connexion implicite via DATABASE_URL dans le schéma).
  constructor() {
    const adapter = new PrismaPg({
      connectionString: process.env.DATABASE_URL,
    });
    super({ adapter });
  }

  // --- Cycle de vie NestJS ---
  // Ouvre la connexion à la base au démarrage de l'application.
  async onModuleInit() {
    await this.$connect();
  }

  // Ferme proprement la connexion à l'arrêt de l'application.
  async onModuleDestroy() {
    await this.$disconnect();
  }
}

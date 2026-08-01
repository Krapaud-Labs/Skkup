import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '../../generated/prisma/client';

// Service unique instancié une seule fois (voir PrismaModule en @Global)
// et injecté dans tous les autres services ayant besoin d'accéder à la
// base de données.
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  // Ouvre la connexion à la base au démarrage de l'application.
  async onModuleInit() {
    await this.$connect();
  }

  // Ferme proprement la connexion à l'arrêt de l'application.
  async onModuleDestroy() {
    await this.$disconnect();
  }
}

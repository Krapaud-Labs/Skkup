import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

// Catalogue des streams partenaires. En V1.0 il est alimenté
// manuellement (seed puis back-office administrateur) : la récupération
// des lives via les API Twitch/YouTube/Facebook dépend des intégrations
// OAuth, pas encore réalisées. Ce service se contente donc de lire la
// table, sans appel à un service tiers.
@Injectable()
export class StreamsService {
  constructor(private readonly prisma: PrismaService) {}

  // --- Liste publique ---
  // Seules les chaînes actives sortent : désactiver un partenaire le
  // retire de l'affichage sans effacer son historique.
  async lister() {
    const streams = await this.prisma.stream.findMany({
      where: { actif: true },
      orderBy: [{ nomAffiche: 'asc' }],
      select: {
        id: true,
        plateforme: true,
        identifiantChaine: true,
        nomAffiche: true,
      },
    });

    return { streams };
  }
}

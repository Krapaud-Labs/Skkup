import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

// Plafond de la réponse publique. Le catalogue est curé à la main et
// tient en quelques dizaines d'entrées ; la borne évite qu'une erreur
// d'alimentation ne transforme un GET anonyme en réponse massive
// (amplification), comme sur les autres endpoints publics du projet.
const LIMITE_STREAMS = 200;

// Catalogue des streams partenaires. En V1.0 il est alimenté
// manuellement (seed puis back-office administrateur) : la récupération
// des lives via les API Twitch/YouTube/Facebook dépend des intégrations
// OAuth, pas encore réalisées. Ce service se contente donc de lire la
// table, sans appel à un service tiers.
@Injectable()
export class StreamsService {
  constructor(private readonly prisma: PrismaService) {}

  // ==================== LISTE PUBLIQUE ====================
  // Seules les chaînes actives sortent : désactiver un partenaire le
  // retire de l'affichage sans effacer son historique.
  async lister() {
    const streams = await this.prisma.stream.findMany({
      where: { actif: true },
      orderBy: [{ nomAffiche: 'asc' }],
      take: LIMITE_STREAMS,
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

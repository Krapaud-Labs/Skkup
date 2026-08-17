import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PairDto } from './dto/pair.dto';
import {
  empreinteJeton,
  genererCodeAppariement,
  genererJetonExtension,
  normaliserCodeAppariement,
} from './jetons-extension';

// ─── Durées de vie (docs/05-security.md, section Appariement) ────────────────
/**
 * Le code d'appariement ne vit que le temps de passer du site à
 * l'extension. Cinq minutes couvrent largement une recopie manuelle et
 * réduisent d'autant la fenêtre pendant laquelle un code lu par-dessus
 * l'épaule, ou resté affiché sur un poste partagé, reste utilisable.
 */
const DUREE_CODE_APPARIEMENT_MINUTES = 5;

/**
 * Le jeton d'accès de l'extension vit 30 jours : assez pour ne pas
 * réapparier sans arrêt, assez court pour qu'un appareil oublié finisse
 * par perdre l'accès. Plus long que la session web (7 jours) parce que
 * l'extension n'a aucun moyen de redemander une authentification à
 * l'utilisateur, mais borné parce qu'il dort en clair dans le stockage
 * de l'extension.
 */
const DUREE_JETON_EXTENSION_JOURS = 30;

/**
 * Nombre d'appareils simultanément appariés par compte. Un plafond
 * évite qu'un partage de compte organisé n'accumule indéfiniment des
 * jetons valides ; au-delà, les appariements les plus anciens sont
 * révoqués.
 */
const APPAREILS_APPARIES_MAX = 5;

/** Message unique renvoyé quel que soit le défaut du code présenté. */
const MESSAGE_CODE_REFUSE =
  "Code d'appariement invalide, expiré ou déjà utilisé.";

@Injectable()
export class ExtensionService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Génération du code depuis le site ─────────────────────────────────────
  /**
   * Émet un code d'appariement pour l'utilisateur connecté. Les codes
   * précédents encore en attente sont supprimés : un seul code vivant à
   * la fois par compte, pour qu'un code affiché puis abandonné ne reste
   * pas exploitable en parallèle du nouveau.
   */
  async genererCode(userId: string) {
    const { code, codeNormalise } = genererCodeAppariement();
    const expireAt = new Date(
      Date.now() + DUREE_CODE_APPARIEMENT_MINUTES * 60 * 1000,
    );

    await this.prisma.$transaction([
      this.prisma.extensionPairingToken.deleteMany({
        where: { userId, consommeAt: null },
      }),
      this.prisma.extensionPairingToken.create({
        data: {
          userId,
          tokenHash: empreinteJeton(codeNormalise),
          expireAt,
        },
      }),
    ]);

    // Le code en clair n'existe qu'ici et dans cette réponse : il n'est
    // ni journalisé ni relisible ensuite.
    return { code, expireAt };
  }

  // ─── Échange du code contre le jeton de l'extension ────────────────────────
  /**
   * Consomme le code et émet le jeton d'accès de l'extension.
   *
   * Code inconnu, expiré ou déjà consommé donnent tous la même réponse :
   * distinguer ces cas indiquerait à un attaquant qu'un code deviné
   * existe bel et bien, et transformerait l'endpoint en oracle.
   */
  async apparier(dto: PairDto) {
    const codeNormalise = normaliserCodeAppariement(dto.code);
    if (!codeNormalise) {
      throw new UnauthorizedException(MESSAGE_CODE_REFUSE);
    }

    const maintenant = new Date();
    const jetonExtension = genererJetonExtension();
    const expireAt = new Date(
      maintenant.getTime() + DUREE_JETON_EXTENSION_JOURS * 24 * 60 * 60 * 1000,
    );

    const utilisateur = await this.prisma.$transaction(async (tx) => {
      const enregistrement = await tx.extensionPairingToken.findUnique({
        where: { tokenHash: empreinteJeton(codeNormalise) },
        select: { id: true, userId: true, expireAt: true },
      });
      if (!enregistrement || enregistrement.expireAt <= maintenant) {
        throw new UnauthorizedException(MESSAGE_CODE_REFUSE);
      }

      // Usage unique réellement atomique : la mise à jour n'aboutit que
      // si personne n'a consommé le code entre-temps. Un simple test du
      // champ lu plus haut laisserait deux requêtes simultanées obtenir
      // chacune un jeton depuis le même code.
      const { count } = await tx.extensionPairingToken.updateMany({
        where: { id: enregistrement.id, consommeAt: null },
        data: { consommeAt: maintenant },
      });
      if (count === 0) {
        throw new UnauthorizedException(MESSAGE_CODE_REFUSE);
      }

      await tx.extensionPairing.create({
        data: {
          userId: enregistrement.userId,
          tokenHash: empreinteJeton(jetonExtension),
          expireAt,
        },
      });

      await this.revoquerAppariementsExcedentaires(
        tx,
        enregistrement.userId,
        maintenant,
      );

      return tx.user.findUniqueOrThrow({
        where: { id: enregistrement.userId },
        select: { pseudo: true },
      });
    });

    return { jetonExtension, expireAt, pseudo: utilisateur.pseudo };
  }

  /** Révoque les appariements actifs au-delà du plafond, du plus ancien au plus récent. */
  private async revoquerAppariementsExcedentaires(
    tx: Pick<PrismaService, 'extensionPairing'>,
    userId: string,
    maintenant: Date,
  ): Promise<void> {
    const actifs = await tx.extensionPairing.findMany({
      where: { userId, revoqueAt: null, expireAt: { gt: maintenant } },
      orderBy: { createdAt: 'desc' },
      select: { id: true },
    });
    const excedentaires = actifs.slice(APPAREILS_APPARIES_MAX);
    if (excedentaires.length === 0) {
      return;
    }
    await tx.extensionPairing.updateMany({
      where: { id: { in: excedentaires.map((a) => a.id) } },
      data: { revoqueAt: maintenant },
    });
  }
}

import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RealtimeService } from '../realtime/realtime.service';
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
 * par perdre l'accès. Plus long que la session web (un jour) parce que
 * l'extension n'a aucun moyen de redemander une authentification à
 * l'utilisateur, mais borné parce qu'il dort en clair dans le stockage
 * de l'extension.
 */
const DUREE_JETON_EXTENSION_JOURS = 30;

/** Message unique renvoyé quel que soit le défaut du code présenté. */
const MESSAGE_CODE_REFUSE =
  "Code d'appariement invalide, expiré ou déjà utilisé.";

/** Résout le statut affiché pour un appareil apparié, à partir de son état en base. */
function statutAppariement(
  appariement: { expireAt: Date; revoqueAt: Date | null },
  maintenant: Date,
): 'ACTIF' | 'EXPIRE' | 'REVOQUE' {
  if (appariement.revoqueAt !== null) {
    return 'REVOQUE';
  }
  return appariement.expireAt > maintenant ? 'ACTIF' : 'EXPIRE';
}

@Injectable()
export class ExtensionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly realtime: RealtimeService,
  ) {}

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
        select: { id: true, userId: true, expireAt: true, consommeAt: true },
      });
      if (
        !enregistrement ||
        enregistrement.expireAt <= maintenant ||
        enregistrement.consommeAt !== null
      ) {
        throw new UnauthorizedException(MESSAGE_CODE_REFUSE);
      }

      // Sérialise les associations d'un même compte. Sans ce verrou,
      // deux codes distincts pourraient tous deux constater l'absence
      // d'appareil actif et créer chacun un credential.
      await tx.$queryRaw<Array<{ id: string }>>`
        SELECT "id" FROM "users" WHERE "id" = ${enregistrement.userId} FOR UPDATE
      `;

      // Relecture après verrou: une autre requête peut avoir consommé le
      // même code pendant que cette transaction attendait le compte.
      const codeVerifie = await tx.extensionPairingToken.findUnique({
        where: { id: enregistrement.id },
        select: { expireAt: true, consommeAt: true },
      });
      if (
        !codeVerifie ||
        codeVerifie.expireAt <= maintenant ||
        codeVerifie.consommeAt !== null
      ) {
        throw new UnauthorizedException(MESSAGE_CODE_REFUSE);
      }

      const actif = await tx.extensionPairing.findFirst({
        where: {
          userId: enregistrement.userId,
          revoqueAt: null,
          expireAt: { gt: maintenant },
        },
        select: { id: true },
      });
      if (actif) {
        throw new ConflictException(
          'Un appareil est déjà associé à ce compte. Révoquez-le avant d’en associer un autre.',
        );
      }

      // Les associations expirées ne bloquent pas un nouvel appareil.
      // Elles sont conservées comme lignes révoquées, jamais supprimées.
      await tx.extensionPairing.updateMany({
        where: {
          userId: enregistrement.userId,
          revoqueAt: null,
          expireAt: { lte: maintenant },
        },
        data: { revoqueAt: maintenant },
      });

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

      const compte = await tx.user.findUniqueOrThrow({
        where: { id: enregistrement.userId },
        select: { pseudo: true },
      });
      return { pseudo: compte.pseudo, userId: enregistrement.userId };
    });

    this.realtime.notifierAppariements(utilisateur.userId, {
      raison: 'appariement',
    });

    return { jetonExtension, expireAt, pseudo: utilisateur.pseudo };
  }

  // ─── Gestion des appareils appariés ────────────────────────────────────────
  /**
   * Renvoie le seul appareil courant. Les entrées révoquées et expirées
   * restent en base pour les traces de sécurité mais ne sont pas exposées
   * comme historique à l'utilisateur. Aucune métadonnée d'appareil n'est stockée (voir
   * docs/05-security.md) : l'identifiant renvoyé sert uniquement à cibler
   * un désappariement, l'utilisateur les distingue par leur date
   * d'appariement.
   */
  async listerAppareils(userId: string) {
    const maintenant = new Date();
    const appariements = await this.prisma.extensionPairing.findMany({
      where: { userId, revoqueAt: null, expireAt: { gt: maintenant } },
      orderBy: { createdAt: 'desc' },
      select: { id: true, createdAt: true, expireAt: true, revoqueAt: true },
    });

    return {
      appareils: appariements.map((appariement) => ({
        id: appariement.id,
        pairedAt: appariement.createdAt,
        expireAt: appariement.expireAt,
        statut: statutAppariement(appariement, maintenant),
      })),
    };
  }

  /**
   * Révoque un appareil apparié appartenant à l'utilisateur authentifié.
   *
   * La révocation est un `updateMany` filtré sur `userId` et
   * `revoqueAt IS NULL` : cela évite à la fois qu'un utilisateur révoque
   * l'appareil d'un autre compte, et qu'une révocation déjà effective
   * écrase l'horodatage d'une révocation précédente.
   */
  async revoquer(userId: string, appariementId: string): Promise<void> {
    const appariement = await this.prisma.extensionPairing.findUnique({
      where: { id: appariementId },
      select: { userId: true },
    });
    if (!appariement) {
      throw new NotFoundException('Appareil apparié introuvable.');
    }
    if (appariement.userId !== userId) {
      throw new ForbiddenException(
        "Cet appareil n'est pas apparié au compte authentifié.",
      );
    }

    await this.prisma.extensionPairing.updateMany({
      // `userId` est répété ici et non seulement dans le contrôle
      // ci-dessus : l'écriture porte elle-même la condition de
      // propriété, sans dépendre d'une lecture antérieure.
      where: { id: appariementId, userId, revoqueAt: null },
      data: { revoqueAt: new Date() },
    });
    this.realtime.notifierAppariements(userId, { raison: 'revocation' });
  }
}

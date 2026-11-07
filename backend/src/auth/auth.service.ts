import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { randomUUID } from 'node:crypto';
import * as bcrypt from 'bcrypt';
import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { SessionRevocationService } from './session-revocation.service';
import { erreurInterne } from '../common/erreur-interne';
import { RealtimeService } from '../realtime/realtime.service';
import { DUREE_SESSION_SECONDES, jourConnexion } from './cookie-session';

const NOMBRE_TOURS_HASH = 12;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly sessionRevocation: SessionRevocationService,
    private readonly realtime?: RealtimeService,
  ) {}

  async register(dto: RegisterDto) {
    if (dto.accepteReglement !== true) {
      throw new BadRequestException('Le règlement du jeu doit être accepté.');
    }
    const passwordHash = await bcrypt.hash(dto.motDePasse, NOMBRE_TOURS_HASH);
    let utilisateur: {
      id: string;
      email: string;
      pseudo: string;
      sessionVersion?: number;
    };
    try {
      utilisateur = await this.prisma.user.create({
        data: {
          email: dto.email,
          passwordHash,
          pseudo: dto.pseudo,
        },
      });
    } catch (erreur) {
      if (
        erreur instanceof Prisma.PrismaClientKnownRequestError &&
        erreur.code === 'P2002'
      ) {
        throw new ConflictException(
          'Inscription impossible avec ces informations.',
        );
      }
      throw erreurInterne();
    }

    await this.realtime?.notifierNombreUtilisateurs();
    return this.genererSession(utilisateur);
  }

  async login(dto: LoginDto) {
    const utilisateur = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!utilisateur) {
      throw new UnauthorizedException('Identifiants invalides.');
    }

    const motDePasseValide = await bcrypt.compare(
      dto.motDePasse,
      utilisateur.passwordHash,
    );
    if (!motDePasseValide) {
      throw new UnauthorizedException('Identifiants invalides.');
    }

    return this.genererSession(utilisateur);
  }

  /** Retourne le profil public de la session, ou un état anonyme. */
  async session(userId?: string) {
    if (!userId) {
      return { authentifie: false, profil: null };
    }

    const utilisateur = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        pseudo: true,
        role: true,
        soldePoints: true,
        streakActuel: true,
        streakMax: true,
        derniereVisiteAt: true,
        createdAt: true,
      },
    });

    return utilisateur
      ? { authentifie: true, profil: utilisateur }
      : { authentifie: false, profil: null };
  }

  /** Change le secret et invalide les sessions web et appareils associés. */
  async changerMotDePasse(
    userId: string,
    dto: ChangePasswordDto,
  ): Promise<void> {
    const utilisateur = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { passwordHash: true },
    });
    if (!utilisateur) {
      throw new UnauthorizedException('Session invalide.');
    }
    if (
      !(await bcrypt.compare(dto.ancienMotDePasse, utilisateur.passwordHash))
    ) {
      throw new UnauthorizedException('Ancien mot de passe incorrect.');
    }
    if (dto.ancienMotDePasse === dto.nouveauMotDePasse) {
      throw new BadRequestException(
        'Le nouveau mot de passe doit être différent de l’ancien.',
      );
    }
    const maintenant = new Date();
    const passwordHash = await bcrypt.hash(
      dto.nouveauMotDePasse,
      NOMBRE_TOURS_HASH,
    );
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { passwordHash, sessionVersion: { increment: 1 } },
      }),
      this.prisma.authSession.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: maintenant },
      }),
      this.prisma.extensionPairing.updateMany({
        where: { userId, revoqueAt: null },
        data: { revoqueAt: maintenant },
      }),
      this.prisma.extensionPairingToken.deleteMany({
        where: { userId, consommeAt: null },
      }),
      this.prisma.watchSession.updateMany({
        where: { userId, statut: 'EN_COURS' },
        data: { statut: 'INVALIDEE', dernierHeartbeatAt: maintenant },
      }),
    ]);
    this.sessionRevocation.revoquer(userId);
  }

  /** Invalide toutes les sessions et sockets de l'utilisateur courant. */
  async deconnecter(userId: string, sessionId: string): Promise<void> {
    const resultat = await this.prisma.authSession.updateMany({
      where: { id: sessionId, userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    if (resultat.count > 0) {
      this.sessionRevocation.revoquerSession(userId, sessionId);
    }
  }

  /**
   * Renvoie le jeton et les seules informations non sensibles destinées
   * au client. Le jeton n'est pas sérialisé dans la réponse HTTP : le
   * contrôleur le pose dans le cookie de session et ne renvoie que le
   * reste (voir cookie-session.ts).
   */
  async genererSession(utilisateur: {
    id: string;
    email: string;
    pseudo: string;
    sessionVersion?: number;
  }): Promise<{ accessToken: string; pseudo: string }> {
    const sessionId = randomUUID();
    const expireAt = new Date(Date.now() + DUREE_SESSION_SECONDES * 1000);
    await this.prisma.authSession.create({
      data: {
        id: sessionId,
        userId: utilisateur.id,
        sessionVersion: utilisateur.sessionVersion ?? 0,
        expiresAt: expireAt,
      },
    });
    const accessToken = this.jwtService.sign(
      {
        sub: utilisateur.id,
        email: utilisateur.email,
        sessionVersion: utilisateur.sessionVersion ?? 0,
        jourConnexion: jourConnexion(),
        sid: sessionId,
      },
      { expiresIn: DUREE_SESSION_SECONDES },
    );
    return { accessToken, pseudo: utilisateur.pseudo };
  }
}

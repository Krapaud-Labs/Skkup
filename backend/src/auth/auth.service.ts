import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { SessionRevocationService } from './session-revocation.service';

const NOMBRE_TOURS_HASH = 12;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly sessionRevocation: SessionRevocationService,
  ) {}

  async register(dto: RegisterDto) {
    const compteExistant = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (compteExistant) {
      throw new ConflictException('Un compte existe déjà avec cet email.');
    }

    const passwordHash = await bcrypt.hash(dto.motDePasse, NOMBRE_TOURS_HASH);
    const utilisateur = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        pseudo: dto.pseudo,
      },
    });

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

  /**
   * Renvoie le jeton et les seules informations non sensibles destinées
   * au client. Le jeton n'est pas sérialisé dans la réponse HTTP : le
   * contrôleur le pose dans le cookie de session et ne renvoie que le
   * reste (voir cookie-session.ts).
   */
  genererSession(utilisateur: {
    id: string;
    email: string;
    pseudo: string;
    sessionVersion?: number;
  }) {
    const accessToken = this.jwtService.sign({
      sub: utilisateur.id,
      email: utilisateur.email,
      sessionVersion: utilisateur.sessionVersion ?? 0,
    });
    return { accessToken, pseudo: utilisateur.pseudo };
  }
}

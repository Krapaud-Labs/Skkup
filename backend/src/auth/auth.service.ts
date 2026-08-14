import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

const NOMBRE_TOURS_HASH = 12;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
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

  /**
   * Renvoie le jeton et les seules informations non sensibles destinées
   * au client. Le jeton n'est pas sérialisé dans la réponse HTTP : le
   * contrôleur le pose dans le cookie de session et ne renvoie que le
   * reste (voir cookie-session.ts).
   */
  private genererSession(utilisateur: {
    id: string;
    email: string;
    pseudo: string;
  }) {
    const accessToken = this.jwtService.sign({
      sub: utilisateur.id,
      email: utilisateur.email,
    });
    return { accessToken, pseudo: utilisateur.pseudo };
  }
}

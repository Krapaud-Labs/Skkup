import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Patch,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { Throttle } from '@nestjs/throttler';
import { PostAuthThrottlerGuard } from '../common/throttler.guards';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import {
  nomCookieSession,
  optionsCookieSession,
  optionsPoseCookieSession,
} from './cookie-session';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { ChangePasswordDto } from './dto/change-password.dto';

interface RequeteAuthentifiee extends Request {
  user: { userId: string; email: string };
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @UseGuards(PostAuthThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: 60 * 60_000 } })
  @HttpCode(HttpStatus.CREATED)
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const { accessToken, pseudo } = await this.authService.register(dto);
    this.poserCookieSession(response, accessToken);
    return { pseudo };
  }

  @Post('login')
  @UseGuards(PostAuthThrottlerGuard)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const { accessToken, pseudo } = await this.authService.login(dto);
    this.poserCookieSession(response, accessToken);
    return { pseudo };
  }

  /** Le changement invalide la session courante et les appareils associés. */
  @Patch('password')
  @UseGuards(JwtAuthGuard, PostAuthThrottlerGuard)
  @Throttle({ default: { limit: 3, ttl: 60 * 60_000 } })
  @HttpCode(HttpStatus.NO_CONTENT)
  async changerMotDePasse(
    @Req() req: RequeteAuthentifiee,
    @Body() dto: ChangePasswordDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
    await this.authService.changerMotDePasse(req.user.userId, dto);
    response.clearCookie(nomCookieSession(), optionsCookieSession());
  }

  /**
   * Un cookie `httpOnly` ne peut pas être effacé par le JavaScript du
   * frontend : la déconnexion passe obligatoirement par le serveur.
   *
   * Volontairement non gardé par `JwtAuthGuard` : un jeton expiré ou
   * corrompu répondrait 401 et laisserait l'utilisateur avec un cookie
   * qu'il ne peut plus effacer. La déconnexion doit toujours aboutir.
   */
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  logout(@Res({ passthrough: true }) response: Response): void {
    // Les attributs de portée doivent être identiques à ceux de la pose,
    // sinon le navigateur ignore la suppression sans la moindre erreur.
    response.clearCookie(nomCookieSession(), optionsCookieSession());
  }

  private poserCookieSession(response: Response, accessToken: string): void {
    response.cookie(
      nomCookieSession(),
      accessToken,
      optionsPoseCookieSession(),
    );
  }
}

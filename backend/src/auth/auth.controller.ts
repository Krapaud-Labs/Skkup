import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import {
  nomCookieSession,
  optionsCookieSession,
  optionsPoseCookieSession,
} from './cookie-session';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
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
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const { accessToken, pseudo } = await this.authService.login(dto);
    this.poserCookieSession(response, accessToken);
    return { pseudo };
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

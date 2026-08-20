import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import {
  cookieSecurise,
  nomCookieSession,
  optionsCookieSession,
  optionsPoseCookieSession,
} from './cookie-session';
import { OAuthTwitchService } from './oauth-twitch.service';

function nomCookieEtatTwitch(): string {
  return cookieSecurise()
    ? '__Host-vr_oauth_twitch_state'
    : 'vr_oauth_twitch_state';
}

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly oauthTwitch: OAuthTwitchService,
  ) {}

  @Get('oauth/twitch/start')
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  async oauthTwitchStart(
    @Req() request: Request,
    @Res() response: Response,
  ): Promise<void> {
    const demarrage = await this.oauthTwitch.creerDemarrage(request);
    response.cookie(nomCookieEtatTwitch(), demarrage.nonce, {
      ...optionsCookieSession(),
      maxAge: 10 * 60 * 1000,
    });
    response.redirect(demarrage.url);
  }

  @Get('oauth/twitch/callback')
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  async oauthTwitchCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Req() request: Request,
    @Res() response: Response,
  ): Promise<void> {
    const nomCookie = nomCookieEtatTwitch();
    const nonce = request.cookies?.[nomCookie] as string | undefined;
    response.clearCookie(nomCookie, optionsCookieSession());
    const utilisateur = await this.oauthTwitch.traiterRetour(
      code,
      state,
      nonce ?? '',
    );
    const { accessToken } = this.authService.genererSession(utilisateur);
    this.poserCookieSession(response, accessToken);
    response.redirect(
      process.env.OAUTH_SUCCESS_REDIRECT_URL ??
        'http://localhost:3000/dashboard',
    );
  }

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

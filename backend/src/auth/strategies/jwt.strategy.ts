import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import type { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { nomCookieSession } from '../cookie-session';
import { PrismaService } from '../../prisma/prisma.service';

interface PayloadJwt {
  sub: string;
  email: string;
  sessionVersion?: unknown;
}

/**
 * Le cookie de session est lu en premier, l'en-tête `Authorization` sert
 * de repli pour les clients qui ne peuvent pas s'appuyer sur un cookie
 * (extension navigateur, appels de test). L'ordre n'est pas
 * interchangeable : si l'en-tête primait, un en-tête injecté en amont
 * pourrait supplanter la session légitime portée par le cookie.
 */
export function extraireJetonRequete(request: Request): string | null {
  const cookies = request.cookies as Record<string, unknown> | undefined;
  const jeton = cookies?.[nomCookieSession()];
  if (typeof jeton === 'string' && jeton.length > 0) {
    return jeton;
  }
  return ExtractJwt.fromAuthHeaderAsBearerToken()(request);
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly prisma: PrismaService) {
    super({
      jwtFromRequest: extraireJetonRequete,
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET as string,
    });
  }

  // Le retour de validate() devient request.user pour les routes gardées.
  async validate(payload: PayloadJwt) {
    const utilisateur = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: { email: true, sessionVersion: true, actif: true },
    });
    const version =
      typeof payload.sessionVersion === 'number' ? payload.sessionVersion : 0;
    // `actif` est absent des anciens doubles de test et des clients générés
    // avant la migration ; seul false doit révoquer un compte.
    if (
      !utilisateur ||
      utilisateur.actif === false ||
      utilisateur.sessionVersion !== version
    ) {
      throw new UnauthorizedException('Invalid session.');
    }
    return { userId: payload.sub, email: utilisateur.email };
  }
}

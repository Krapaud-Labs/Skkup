import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Garde réutilisé par tous les endpoints protégés : délègue la validation
 * du jeton à JwtStrategy (cookie de session en priorité, repli Authorization).
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}

import { Body, Controller, Param, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { Throttle } from '@nestjs/throttler';
import { PostAuthThrottlerGuard } from '../common/throttler.guards';
import { WatchSessionSource } from '../../generated/prisma/enums';
import { WatchSessionCredentialGuard } from './watch-session-credential.guard';
import { WatchSessionsService } from './watch-sessions.service';
import { OuvrirSessionDto } from './dto/ouvrir-session.dto';
import { HeartbeatDto } from './dto/heartbeat.dto';

interface RequeteAuthentifiee extends Request {
  // `source` est posée par `WatchSessionCredentialGuard`, déduite du
  // credential ayant authentifié la requête (jamais du payload client).
  user: { userId: string; email: string; source: WatchSessionSource };
}

/**
 * Point d'entrée HTTP des sessions de visionnage : ouverture, heartbeat,
 * fermeture.
 *
 * Gardée par `WatchSessionCredentialGuard`, qui accepte indifféremment la
 * session web (cookie) ou le jeton d'une extension appariée : c'est elle
 * qui autorise l'extension à créditer des points, le lecteur embarqué
 * restant volontairement à zéro (voir `WatchSessionsService`).
 */
@UseGuards(WatchSessionCredentialGuard, PostAuthThrottlerGuard)
@Controller('watch-sessions')
export class WatchSessionsController {
  constructor(private readonly watchSessionsService: WatchSessionsService) {}

  @Post()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  ouvrir(@Req() req: RequeteAuthentifiee, @Body() dto: OuvrirSessionDto) {
    return this.watchSessionsService.ouvrir(
      req.user.userId,
      dto,
      req.user.source,
    );
  }

  @Post(':id/heartbeat')
  @Throttle({ default: { limit: 4, ttl: 60_000 } })
  heartbeat(
    @Req() req: RequeteAuthentifiee,
    @Param('id') id: string,
    @Body() dto: HeartbeatDto,
  ) {
    return this.watchSessionsService.heartbeat(req.user.userId, id, dto);
  }

  @Post(':id/close')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  fermer(@Req() req: RequeteAuthentifiee, @Param('id') id: string) {
    return this.watchSessionsService.fermer(req.user.userId, id);
  }
}

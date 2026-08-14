import { Body, Controller, Param, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { WatchSessionsService } from './watch-sessions.service';
import { OuvrirSessionDto } from './dto/ouvrir-session.dto';
import { HeartbeatDto } from './dto/heartbeat.dto';

interface RequeteAuthentifiee extends Request {
  user: { userId: string; email: string };
}

/** Point d'entrée HTTP des sessions de visionnage : ouverture, heartbeat, fermeture. */
@UseGuards(JwtAuthGuard)
@Controller('watch-sessions')
export class WatchSessionsController {
  constructor(private readonly watchSessionsService: WatchSessionsService) {}

  @Post()
  ouvrir(@Req() req: RequeteAuthentifiee, @Body() dto: OuvrirSessionDto) {
    return this.watchSessionsService.ouvrir(req.user.userId, dto);
  }

  @Post(':id/heartbeat')
  heartbeat(
    @Req() req: RequeteAuthentifiee,
    @Param('id') id: string,
    @Body() dto: HeartbeatDto,
  ) {
    return this.watchSessionsService.heartbeat(req.user.userId, id, dto);
  }

  @Post(':id/close')
  fermer(@Req() req: RequeteAuthentifiee, @Param('id') id: string) {
    return this.watchSessionsService.fermer(req.user.userId, id);
  }
}

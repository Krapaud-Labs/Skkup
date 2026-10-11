import {
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Throttle } from '@nestjs/throttler';
import { PostAuthThrottlerGuard } from '../common/throttler.guards';
import { MeService } from './me.service';
import { HistoriquePointsDto } from './dto/historique-points.dto';
import { MesTicketsTirageDto } from './dto/mes-tickets-tirage.dto';

interface RequeteAuthentifiee extends Request {
  user: { userId: string; email: string };
}

/** Point d'entrée HTTP du domaine "me" : délègue chaque route à MeService. */
@UseGuards(JwtAuthGuard, PostAuthThrottlerGuard)
@Throttle({ default: { limit: Number(process.env.THROTTLE_ME_LIMIT ?? 120), ttl: 60_000 } })
@Controller('me')
export class MeController {
  constructor(private readonly meService: MeService) {}

  @Get()
  profil(@Req() req: RequeteAuthentifiee) {
    return this.meService.profil(req.user.userId);
  }

  /** Agrégat stable consommable par le cockpit viewer V3. */
  @Get('dashboard/summary')
  resumeDashboard(@Req() req: RequeteAuthentifiee) {
    return this.meService.resumeDashboard(req.user.userId);
  }

  @Get('points/history')
  historiquePoints(
    @Req() req: RequeteAuthentifiee,
    @Query() query: HistoriquePointsDto,
  ) {
    return this.meService.historiquePoints(
      req.user.userId,
      query.page,
      query.limit,
    );
  }

  @Get('rewards-summary')
  resumeRecompenses(
    @Req() req: RequeteAuthentifiee,
    @Query('limit') limit?: string,
  ) {
    return this.meService.resumeRecompenses(
      req.user.userId,
      limit ? Number(limit) : undefined,
    );
  }

  @Get('raffle-tickets')
  mesTicketsTirage(
    @Req() req: RequeteAuthentifiee,
    @Query() query: MesTicketsTirageDto,
  ) {
    return this.meService.mesTicketsTirage(
      req.user.userId,
      query.page,
      query.limit,
    );
  }

  @Post('raffles/:raffleId/register')
  inscrireTirage(
    @Req() req: RequeteAuthentifiee,
    @Param('raffleId') raffleId: string,
  ) {
    return this.meService.inscrireTirage(req.user.userId, raffleId);
  }

  @Post('daily-checkin')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  checkinQuotidien(@Req() req: RequeteAuthentifiee) {
    return this.meService.checkinQuotidien(req.user.userId);
  }
}

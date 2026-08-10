import { Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MeService } from './me.service';
import { HistoriquePointsDto } from './dto/historique-points.dto';

interface RequeteAuthentifiee extends Request {
  user: { userId: string; email: string };
}

@UseGuards(JwtAuthGuard)
@Controller('me')
export class MeController {
  constructor(private readonly meService: MeService) {}

  @Get()
  profil(@Req() req: RequeteAuthentifiee) {
    return this.meService.profil(req.user.userId);
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

  @Post('daily-checkin')
  checkinQuotidien(@Req() req: RequeteAuthentifiee) {
    return this.meService.checkinQuotidien(req.user.userId);
  }
}

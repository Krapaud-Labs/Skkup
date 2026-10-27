import { Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Throttle } from '@nestjs/throttler';
import { PostAuthThrottlerGuard } from '../common/throttler.guards';
import { ScratchCardsService } from './scratch-cards.service';

interface RequeteAuthentifiee extends Request {
  user: { userId: string; email: string };
}

/** Point d'entrée HTTP des cartes à gratter : liste et grattage. */
@UseGuards(JwtAuthGuard, PostAuthThrottlerGuard)
@Throttle({ default: { limit: 60, ttl: 60_000 } })
@Controller('me/scratch-cards')
export class ScratchCardsController {
  constructor(private readonly scratchCardsService: ScratchCardsService) {}

  @Get()
  lister(@Req() req: RequeteAuthentifiee) {
    return this.scratchCardsService.lister(req.user.userId);
  }

  @Post(':id/prepare')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  preparer(@Req() req: RequeteAuthentifiee, @Param('id') id: string) {
    return this.scratchCardsService.preparer(req.user.userId, id);
  }

  @Post(':id/scratch')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  gratter(@Req() req: RequeteAuthentifiee, @Param('id') id: string) {
    return this.scratchCardsService.gratter(req.user.userId, id);
  }
}

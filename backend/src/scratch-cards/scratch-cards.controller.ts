import { Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ScratchCardsService } from './scratch-cards.service';

interface RequeteAuthentifiee extends Request {
  user: { userId: string; email: string };
}

@UseGuards(JwtAuthGuard)
@Controller('me/scratch-cards')
export class ScratchCardsController {
  constructor(private readonly scratchCardsService: ScratchCardsService) {}

  @Get()
  lister(@Req() req: RequeteAuthentifiee) {
    return this.scratchCardsService.lister(req.user.userId);
  }

  @Post(':id/scratch')
  gratter(@Req() req: RequeteAuthentifiee, @Param('id') id: string) {
    return this.scratchCardsService.gratter(req.user.userId, id);
  }
}

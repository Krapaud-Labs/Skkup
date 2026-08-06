import { Controller, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MeService } from './me.service';

interface RequeteAuthentifiee extends Request {
  user: { userId: string; email: string };
}

@UseGuards(JwtAuthGuard)
@Controller('me')
export class MeController {
  constructor(private readonly meService: MeService) {}

  @Post('daily-checkin')
  checkinQuotidien(@Req() req: RequeteAuthentifiee) {
    return this.meService.checkinQuotidien(req.user.userId);
  }
}

import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { Throttle } from '@nestjs/throttler';
import { PostAuthThrottlerGuard } from '../common/throttler.guards';
import { AdminGuard } from '../auth/guards/admin.guard';
import {
  CreateRaffleDto,
  DrawRaffleDto,
  UpdateRaffleDto,
} from './dto/create-raffle.dto';
import { Patch } from '@nestjs/common';
import { RafflesService } from './raffles.service';

@Controller('admin/raffles')
@UseGuards(AdminGuard, PostAuthThrottlerGuard)
export class AdminRafflesController {
  constructor(private readonly rafflesService: RafflesService) {}

  @Get()
  lister() {
    return this.rafflesService.listerAdmin();
  }

  @Get(':id/history')
  historique(@Param('id') id: string) {
    return this.rafflesService.historiqueAdmin(id);
  }

  @Post()
  @Throttle({ default: { limit: 10, ttl: 60 * 60_000 } })
  creer(@Body() dto: CreateRaffleDto) {
    return this.rafflesService.creer(dto);
  }

  @Post(':id/draw')
  @Throttle({ default: { limit: 5, ttl: 60 * 60_000 } })
  tirer(
    @Param('id') id: string,
    @Body() dto: DrawRaffleDto,
    @Req() request: Request,
  ) {
    const userId = (request.user as { userId: string }).userId;
    return this.rafflesService.tirer(id, userId, dto);
  }

  @Patch(':id')
  modifier(
    @Param('id') id: string,
    @Body() dto: UpdateRaffleDto,
    @Req() request: Request,
  ) {
    return this.rafflesService.modifier(
      id,
      dto,
      (request.user as { userId: string }).userId,
    );
  }
}

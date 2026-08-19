import { Body, Controller, Param, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { AdminGuard } from '../auth/guards/admin.guard';
import { CreateRaffleDto, DrawRaffleDto } from './dto/create-raffle.dto';
import { RafflesService } from './raffles.service';

@Controller('admin/raffles')
@UseGuards(AdminGuard)
export class AdminRafflesController {
  constructor(private readonly rafflesService: RafflesService) {}

  @Post()
  creer(@Body() dto: CreateRaffleDto) {
    return this.rafflesService.creer(dto);
  }

  @Post(':id/draw')
  tirer(
    @Param('id') id: string,
    @Body() dto: DrawRaffleDto,
    @Req() request: Request,
  ) {
    const userId = (request.user as { userId: string }).userId;
    return this.rafflesService.tirer(id, userId, dto);
  }
}

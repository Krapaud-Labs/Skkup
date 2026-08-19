import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import { AdminGuard } from '../auth/guards/admin.guard';
import { CreateRaffleDto } from './dto/create-raffle.dto';
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
  tirer(@Param('id') id: string) {
    return this.rafflesService.tirer(id);
  }
}

import { Controller, Get, Param } from '@nestjs/common';
import { RafflesService } from './raffles.service';

// Endpoints publics : les tirages, leurs lots et leurs résultats sont
// consultables sans compte (page vitrine du site).
@Controller('raffles')
export class RafflesController {
  constructor(private readonly rafflesService: RafflesService) {}

  @Get()
  lister() {
    return this.rafflesService.lister();
  }

  @Get(':id')
  detail(@Param('id') id: string) {
    return this.rafflesService.detail(id);
  }

  @Get(':id/result')
  resultat(@Param('id') id: string) {
    return this.rafflesService.resultat(id);
  }
}

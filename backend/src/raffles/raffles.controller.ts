import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
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

  // Liste des participants du tirage, nécessaire pour rejouer le tirage
  // à partir de la graine publiée. Paginée et bornée côté service.
  @Get(':id/participants')
  participants(
    @Param('id') id: string,
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('taille', new ParseIntPipe({ optional: true })) taille?: number,
  ) {
    return this.rafflesService.participants(id, page, taille);
  }
}

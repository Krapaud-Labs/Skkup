import { Module } from '@nestjs/common';
import { RafflesController } from './raffles.controller';
import { RafflesService } from './raffles.service';

/** Câblage NestJS des tirages au sort (endpoints de lecture publique). */
@Module({
  controllers: [RafflesController],
  providers: [RafflesService],
})
export class RafflesModule {}

import { Module } from '@nestjs/common';
import { RafflesController } from './raffles.controller';
import { AdminRafflesController } from './admin-raffles.controller';
import { RafflesService } from './raffles.service';

/** Câblage NestJS des tirages au sort (endpoints de lecture publique). */
@Module({
  controllers: [RafflesController, AdminRafflesController],
  providers: [RafflesService],
})
export class RafflesModule {}

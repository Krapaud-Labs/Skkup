import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ScratchCardsController } from './scratch-cards.controller';
import { ScratchCardsService } from './scratch-cards.service';

/** Câblage NestJS des cartes à gratter. */
@Module({
  imports: [AuthModule],
  controllers: [ScratchCardsController],
  providers: [ScratchCardsService],
})
export class ScratchCardsModule {}

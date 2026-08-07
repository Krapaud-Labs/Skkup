import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ScratchCardsController } from './scratch-cards.controller';
import { ScratchCardsService } from './scratch-cards.service';

@Module({
  imports: [AuthModule],
  controllers: [ScratchCardsController],
  providers: [ScratchCardsService],
})
export class ScratchCardsModule {}

import { Module } from '@nestjs/common';
import { StreamsController } from './streams.controller';
import { StreamsService } from './streams.service';

/** Câblage NestJS de la liste publique des streams disponibles. */
@Module({
  controllers: [StreamsController],
  providers: [StreamsService],
})
export class StreamsModule {}

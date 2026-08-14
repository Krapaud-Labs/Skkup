import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { WatchSessionsController } from './watch-sessions.controller';
import { WatchSessionsService } from './watch-sessions.service';

/** Câblage NestJS des sessions de visionnage et de l'anti-fraude associée. */
@Module({
  imports: [AuthModule],
  controllers: [WatchSessionsController],
  providers: [WatchSessionsService],
})
export class WatchSessionsModule {}

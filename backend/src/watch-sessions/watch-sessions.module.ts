import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { WatchSessionsController } from './watch-sessions.controller';
import { WatchSessionsService } from './watch-sessions.service';

@Module({
  imports: [AuthModule],
  controllers: [WatchSessionsController],
  providers: [WatchSessionsService],
})
export class WatchSessionsModule {}

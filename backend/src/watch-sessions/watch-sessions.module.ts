import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from '../auth/auth.module';
import { WatchSessionsController } from './watch-sessions.controller';
import { WatchSessionsService } from './watch-sessions.service';

/** Câblage NestJS des sessions de visionnage et de l'anti-fraude associée. */
@Module({
  imports: [
    AuthModule,
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60_000,
        limit: 120,
        getTracker: (req: { user?: { userId?: string }; ip?: string }) =>
          `${req.user?.userId ?? 'anonyme'}:${req.ip ?? 'ip-inconnue'}`,
      },
    ]),
  ],
  controllers: [WatchSessionsController],
  providers: [WatchSessionsService],
})
export class WatchSessionsModule {}

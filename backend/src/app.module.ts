import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { WatchSessionsModule } from './watch-sessions/watch-sessions.module';
import { MeModule } from './me/me.module';
import { ScratchCardsModule } from './scratch-cards/scratch-cards.module';
import { RafflesModule } from './raffles/raffles.module';
import { RealtimeModule } from './realtime/realtime.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    RealtimeModule,
    WatchSessionsModule,
    MeModule,
    ScratchCardsModule,
    RafflesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

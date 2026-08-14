import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { VerificationOrigineGuard } from './common/verification-origine.guard';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { WatchSessionsModule } from './watch-sessions/watch-sessions.module';
import { MeModule } from './me/me.module';
import { ScratchCardsModule } from './scratch-cards/scratch-cards.module';
import { RafflesModule } from './raffles/raffles.module';
import { RealtimeModule } from './realtime/realtime.module';
import { StreamsModule } from './streams/streams.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    RealtimeModule,
    WatchSessionsModule,
    MeModule,
    ScratchCardsModule,
    RafflesModule,
    StreamsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Global : toute route mutante authentifiée par le cookie est
    // couverte, y compris celles ajoutées plus tard sans y penser.
    { provide: APP_GUARD, useClass: VerificationOrigineGuard },
  ],
})
export class AppModule {}

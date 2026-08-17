import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
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
import { ExtensionModule } from './extension/extension.module';

@Module({
  imports: [
    PrismaModule,
    // Enregistré à la racine plutôt que dans un module métier : le
    // module de limitation de débit est global, le déclarer une seule
    // fois évite qu'un module le redéfinisse avec d'autres réglages.
    // Le tracker combine utilisateur et IP : sur une route non
    // authentifiée il retombe sur la seule IP.
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60_000,
        limit: 120,
        getTracker: (req: { user?: { userId?: string }; ip?: string }) =>
          `${req.user?.userId ?? 'anonyme'}:${req.ip ?? 'ip-inconnue'}`,
      },
    ]),
    AuthModule,
    RealtimeModule,
    WatchSessionsModule,
    MeModule,
    ScratchCardsModule,
    RafflesModule,
    StreamsModule,
    ExtensionModule,
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

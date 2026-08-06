import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { WatchSessionsModule } from './watch-sessions/watch-sessions.module';
import { MeModule } from './me/me.module';

@Module({
  imports: [PrismaModule, AuthModule, WatchSessionsModule, MeModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

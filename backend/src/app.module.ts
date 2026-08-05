import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { WatchSessionsModule } from './watch-sessions/watch-sessions.module';

@Module({
  imports: [PrismaModule, AuthModule, WatchSessionsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

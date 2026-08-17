import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ExtensionModule } from '../extension/extension.module';
import { WatchSessionsController } from './watch-sessions.controller';
import { WatchSessionsService } from './watch-sessions.service';
import { WatchSessionCredentialGuard } from './watch-session-credential.guard';

/**
 * Câblage NestJS des sessions de visionnage et de l'anti-fraude associée.
 *
 * `ExtensionModule` est importé pour réutiliser `ExtensionAuthGuard` dans
 * `WatchSessionCredentialGuard` : c'est la même garde que celle qui protège
 * les routes `/extension/*`, pas une réimplémentation parallèle du
 * cloisonnement des credentials.
 */
@Module({
  imports: [AuthModule, ExtensionModule],
  controllers: [WatchSessionsController],
  providers: [WatchSessionsService, JwtAuthGuard, WatchSessionCredentialGuard],
})
export class WatchSessionsModule {}

import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ExtensionController } from './extension.controller';
import { ExtensionService } from './extension.service';
import { ExtensionAuthGuard } from './extension-auth.guard';

/**
 * Câblage NestJS de l'appariement de l'extension navigateur.
 *
 * `ExtensionAuthGuard` est exporté sans être encore posé sur une route :
 * il authentifie les appels que l'extension enverra ensuite (heartbeats
 * de visionnage). Le branchement se fera avec la source `EXTENSION`, qui
 * touche au crédit de points et relève donc d'un travail à part.
 */
@Module({
  imports: [AuthModule],
  controllers: [ExtensionController],
  providers: [ExtensionService, ExtensionAuthGuard],
  exports: [ExtensionAuthGuard],
})
export class ExtensionModule {}

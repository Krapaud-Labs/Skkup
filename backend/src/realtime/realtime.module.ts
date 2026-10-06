import { forwardRef, Global, Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { RealtimeBridge } from './realtime.bridge';
import { RealtimeGateway } from './realtime.gateway';
import { RealtimeService } from './realtime.service';

// Module global : n'importe quel service métier peut injecter
// `RealtimeService` pour notifier ce qu'il vient d'écrire en base, sans
// que chaque module ait à réimporter celui-ci.
@Global()
@Module({
  imports: [forwardRef(() => AuthModule)],
  providers: [RealtimeGateway, RealtimeService, RealtimeBridge],
  exports: [RealtimeService],
})
export class RealtimeModule {}

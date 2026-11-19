import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { OptionalJwtAuthGuard } from './guards/optional-jwt-auth.guard';
import { RealtimeModule } from '../realtime/realtime.module';
import { AuthRuntimeModule } from './auth-runtime.module';

/**
 * Câblage NestJS de l'authentification et réexport des fournisseurs runtime
 * partagés avec les modules protégés et Realtime.
 */
@Module({
  imports: [
    PassportModule,
    AuthRuntimeModule,
    RealtimeModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    OptionalJwtAuthGuard,
  ],
  exports: [AuthRuntimeModule],
})
export class AuthModule {}

import { forwardRef, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { SessionRevocationService } from './session-revocation.service';
import { OptionalJwtAuthGuard } from './guards/optional-jwt-auth.guard';
import { RealtimeModule } from '../realtime/realtime.module';

/**
 * Câblage NestJS de l'authentification : expose JwtModule (utilisé par les
 * autres modules protégés via AuthGuard('jwt')) et enregistre JwtStrategy.
 */
@Module({
  imports: [
    PassportModule,
    forwardRef(() => RealtimeModule),
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      // La stratégie invalide les sessions web au changement de journée.
      // Les jetons propres à l'extension définissent leur durée à leur émission.
      signOptions: { expiresIn: '24h' },
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    SessionRevocationService,
    OptionalJwtAuthGuard,
  ],
  exports: [JwtModule, SessionRevocationService],
})
export class AuthModule {}

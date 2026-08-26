import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { OAuthTwitchService } from './oauth-twitch.service';
import { OAuthGoogleService } from './oauth-google.service';
import { OAuthFacebookService } from './oauth-facebook.service';
import { SessionRevocationService } from './session-revocation.service';

/**
 * Câblage NestJS de l'authentification : expose JwtModule (utilisé par les
 * autres modules protégés via AuthGuard('jwt')) et enregistre JwtStrategy.
 */
@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '7d' },
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    OAuthTwitchService,
    OAuthGoogleService,
    OAuthFacebookService,
    SessionRevocationService,
  ],
  exports: [JwtModule, SessionRevocationService],
})
export class AuthModule {}

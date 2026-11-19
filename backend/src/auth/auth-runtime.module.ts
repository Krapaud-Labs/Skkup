import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { SessionRevocationService } from './session-revocation.service';

/** Fournisseurs runtime Auth partagés par les modules Auth et Realtime. */
@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      // La stratégie invalide les sessions web au changement de journée.
      // Les jetons propres à l'extension définissent leur durée à leur émission.
      signOptions: { expiresIn: '24h' },
    }),
  ],
  providers: [SessionRevocationService],
  exports: [JwtModule, SessionRevocationService],
})
export class AuthRuntimeModule {}

import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

/** Limite IP globale exécutée avant toute authentification coûteuse. */
@Injectable()
export class PreAuthThrottlerGuard extends ThrottlerGuard {
  override async onModuleInit(): Promise<void> {
    await super.onModuleInit();
    this.throttlers = this.throttlers.filter(({ name }) => name === 'preauth');
  }
}

/** Quota métier exécuté après l'authentification utilisateur. */
@Injectable()
export class PostAuthThrottlerGuard extends ThrottlerGuard {
  override async onModuleInit(): Promise<void> {
    await super.onModuleInit();
    this.throttlers = this.throttlers.filter(({ name }) => name === 'default');
  }
}

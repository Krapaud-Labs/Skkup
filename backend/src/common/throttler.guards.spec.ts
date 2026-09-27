import {
  CanActivate,
  Controller,
  ExecutionContext,
  ForbiddenException,
  Get,
  INestApplication,
  Injectable,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { ThrottlerModule } from '@nestjs/throttler';
import request from 'supertest';
import type { App } from 'supertest/types';
import {
  PostAuthThrottlerGuard,
  PreAuthThrottlerGuard,
} from './throttler.guards';

class CredentialInvalideGuard implements CanActivate {
  canActivate(): boolean {
    throw new UnauthorizedException();
  }
}

class RoleInsuffisantGuard implements CanActivate {
  canActivate(): boolean {
    throw new ForbiddenException();
  }
}

@Injectable()
class IdentiteDeTestGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const requete = context.switchToHttp().getRequest<{
      headers: Record<string, string | undefined>;
      user?: { userId: string };
    }>();
    requete.user = { userId: requete.headers['x-test-user'] ?? 'user-1' };
    return true;
  }
}

@Controller('test-throttling')
class ControleurTestThrottling {
  @Get('credential-invalide')
  @UseGuards(CredentialInvalideGuard)
  credentialInvalide(): void {}

  @Get('role-insuffisant')
  @UseGuards(RoleInsuffisantGuard)
  roleInsuffisant(): void {}
}

@Controller('test-post-auth-throttling')
class ControleurTestPostAuthThrottling {
  @Get()
  @UseGuards(IdentiteDeTestGuard, PostAuthThrottlerGuard)
  reussi(): { ok: true } {
    return { ok: true };
  }
}

describe('PreAuthThrottlerGuard', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      imports: [
        ThrottlerModule.forRoot([
          {
            name: 'preauth',
            ttl: 60_000,
            limit: 2,
            getTracker: (requete: { ip?: string }) =>
              requete.ip ?? 'ip-inconnue',
          },
        ]),
      ],
      controllers: [ControleurTestThrottling],
      providers: [
        CredentialInvalideGuard,
        RoleInsuffisantGuard,
        { provide: APP_GUARD, useClass: PreAuthThrottlerGuard },
      ],
    }).compile();
    app = module.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('répond 429 même lorsque le credential est toujours invalide', async () => {
    const serveur = app.getHttpServer();
    await request(serveur)
      .get('/test-throttling/credential-invalide')
      .expect(401);
    await request(serveur)
      .get('/test-throttling/credential-invalide')
      .expect(401);
    await request(serveur)
      .get('/test-throttling/credential-invalide')
      .expect(429);
  });

  it('répond 429 avant de répéter un contrôle de rôle insuffisant', async () => {
    const serveur = app.getHttpServer();
    await request(serveur).get('/test-throttling/role-insuffisant').expect(403);
    await request(serveur).get('/test-throttling/role-insuffisant').expect(403);
    await request(serveur).get('/test-throttling/role-insuffisant').expect(429);
  });
});

describe('PostAuthThrottlerGuard', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      imports: [
        ThrottlerModule.forRoot([
          {
            name: 'default',
            ttl: 60_000,
            limit: 2,
            getTracker: (requete: {
              user?: { userId?: string };
              ip?: string;
            }) =>
              `${requete.user?.userId ?? 'anonyme'}:${requete.ip ?? 'ip-inconnue'}`,
          },
        ]),
      ],
      controllers: [ControleurTestPostAuthThrottling],
      providers: [IdentiteDeTestGuard, PostAuthThrottlerGuard],
    }).compile();
    app = module.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('applique le quota au couple utilisateur et adresse IP', async () => {
    const serveur = app.getHttpServer();

    await request(serveur)
      .get('/test-post-auth-throttling')
      .set('x-test-user', 'user-1')
      .expect(200);
    await request(serveur)
      .get('/test-post-auth-throttling')
      .set('x-test-user', 'user-1')
      .expect(200);
    await request(serveur)
      .get('/test-post-auth-throttling')
      .set('x-test-user', 'user-1')
      .expect(429);

    await request(serveur)
      .get('/test-post-auth-throttling')
      .set('x-test-user', 'user-2')
      .expect(200);
  });
});

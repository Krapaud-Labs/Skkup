import {
  CanActivate,
  Controller,
  ForbiddenException,
  Get,
  INestApplication,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { ThrottlerModule } from '@nestjs/throttler';
import request from 'supertest';
import type { App } from 'supertest/types';
import { PreAuthThrottlerGuard } from './throttler.guards';

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

@Controller('test-throttling')
class ControleurTestThrottling {
  @Get('credential-invalide')
  @UseGuards(CredentialInvalideGuard)
  credentialInvalide(): void {}

  @Get('role-insuffisant')
  @UseGuards(RoleInsuffisantGuard)
  roleInsuffisant(): void {}
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

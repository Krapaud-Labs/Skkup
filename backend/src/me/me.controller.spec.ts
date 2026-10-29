import { Test } from '@nestjs/testing';
import type { Request } from 'express';
import { MeController } from './me.controller';
import { MeService } from './me.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { PostAuthThrottlerGuard } from '../common/throttler.guards';

// ─── Identité et service simulés ─────────────────────────────────────────────

interface RequeteAuthentifiee extends Request {
  user: { userId: string; email: string };
}

describe('MeController', () => {
  let controller: MeController;

  const meService = {
    profil: jest.fn(),
    resumeDashboard: jest.fn(),
    historiquePoints: jest.fn(),
    resumeRecompenses: jest.fn(),
    mesTicketsTirage: jest.fn(),
    checkinQuotidien: jest.fn(),
  };

  const requete = {
    user: { userId: 'user-1', email: 'test@example.com' },
  } as RequeteAuthentifiee;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module = await Test.createTestingModule({
      controllers: [MeController],
      providers: [{ provide: MeService, useValue: meService }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(PostAuthThrottlerGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get(MeController);
  });

  // Le contrôleur doit toujours transmettre l'identité du JWT au service et
  // ne jamais accepter un identifiant utilisateur provenant de la requête.
  it("transmet l'identifiant issu du JWT au profil", () => {
    void controller.profil(requete);

    expect(meService.profil).toHaveBeenCalledWith('user-1');
  });

  it('protège le résumé par le JWT global sans exclure les comptes ADMIN', () => {
    const guards = Reflect.getMetadata(GUARDS_METADATA, MeController) as unknown[];

    expect(guards).toContain(JwtAuthGuard);
  });

  it("transmet l'identité du JWT au résumé dashboard", () => {
    void controller.resumeDashboard(requete);

    expect(meService.resumeDashboard).toHaveBeenCalledWith('user-1');
  });

  it("ignore tout identifiant fourni en query pour l'historique", () => {
    void controller.historiquePoints(requete, { page: 2, limit: 10 });

    expect(meService.historiquePoints).toHaveBeenCalledWith('user-1', 2, 10);
  });

  it('transmet la limite de l’agrégat et l’identité du JWT', () => {
    void controller.resumeRecompenses(requete, '12');
    expect(meService.resumeRecompenses).toHaveBeenCalledWith('user-1', 12);
  });

  it('ignore tout identifiant fourni en query pour les tickets de tirage', () => {
    void controller.mesTicketsTirage(requete, { page: 1, limit: 5 });

    expect(meService.mesTicketsTirage).toHaveBeenCalledWith('user-1', 1, 5);
  });
});

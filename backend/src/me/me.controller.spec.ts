import { Test } from '@nestjs/testing';
import type { Request } from 'express';
import { MeController } from './me.controller';
import { MeService } from './me.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

interface RequeteAuthentifiee extends Request {
  user: { userId: string; email: string };
}

describe('MeController', () => {
  let controller: MeController;

  const meService = {
    profil: jest.fn(),
    historiquePoints: jest.fn(),
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
      .compile();

    controller = module.get(MeController);
  });

  it("transmet l'identifiant issu du JWT au profil", () => {
    void controller.profil(requete);

    expect(meService.profil).toHaveBeenCalledWith('user-1');
  });

  it("ignore tout identifiant fourni en query pour l'historique", () => {
    void controller.historiquePoints(requete, { page: 2, limit: 10 });

    expect(meService.historiquePoints).toHaveBeenCalledWith('user-1', 2, 10);
  });

  it('ignore tout identifiant fourni en query pour les tickets de tirage', () => {
    void controller.mesTicketsTirage(requete, { page: 1, limit: 5 });

    expect(meService.mesTicketsTirage).toHaveBeenCalledWith('user-1', 1, 5);
  });
});

import { Test } from '@nestjs/testing';
import { RafflesController } from './raffles.controller';
import { RafflesService } from './raffles.service';
import { PostAuthThrottlerGuard } from '../common/throttler.guards';

// ─── Mise en place du module de test ─────────────────────────────────────────
describe('RafflesController', () => {
  let controller: RafflesController;
  const rafflesService = {
    lister: jest.fn().mockResolvedValue([{ id: 'raffle-1' }]),
    detail: jest.fn().mockResolvedValue({ id: 'raffle-1' }),
    resultat: jest.fn().mockResolvedValue({ id: 'raffle-1', gagnants: [] }),
    participants: jest
      .fn()
      .mockResolvedValue({ id: 'raffle-1', participants: [] }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      controllers: [RafflesController],
      providers: [{ provide: RafflesService, useValue: rafflesService }],
    })
      .overrideGuard(PostAuthThrottlerGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get(RafflesController);
  });

  it('GET /raffles délègue la liste au service', async () => {
    await expect(controller.lister()).resolves.toEqual([{ id: 'raffle-1' }]);
    expect(rafflesService.lister).toHaveBeenCalledTimes(1);
  });

  it("GET /raffles/:id transmet l'identifiant demandé", async () => {
    await controller.detail('raffle-1');

    expect(rafflesService.detail).toHaveBeenCalledWith('raffle-1');
  });

  it("GET /raffles/:id/result transmet l'identifiant demandé", async () => {
    await controller.resultat('raffle-1');

    expect(rafflesService.resultat).toHaveBeenCalledWith('raffle-1');
  });

  it('GET /raffles/:id/participants transmet la pagination demandée', async () => {
    await controller.participants('raffle-1', 2, 100);

    expect(rafflesService.participants).toHaveBeenCalledWith(
      'raffle-1',
      2,
      100,
    );
  });

  it('GET /raffles/:id/participants fonctionne sans paramètre de pagination', async () => {
    await controller.participants('raffle-1');

    expect(rafflesService.participants).toHaveBeenCalledWith(
      'raffle-1',
      undefined,
      undefined,
    );
  });
});

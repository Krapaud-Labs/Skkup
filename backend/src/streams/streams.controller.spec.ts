import { Test } from '@nestjs/testing';
import { StreamsController } from './streams.controller';
import { StreamsService } from './streams.service';
import { PostAuthThrottlerGuard } from '../common/throttler.guards';
import { AdminGuard } from '../auth/guards/admin.guard';

describe('StreamsController', () => {
  let controller: StreamsController;
  const streamsService = { lister: jest.fn() };

  beforeEach(async () => {
    streamsService.lister.mockReset();

    const module = await Test.createTestingModule({
      controllers: [StreamsController],
      providers: [{ provide: StreamsService, useValue: streamsService }],
    })
      .overrideGuard(AdminGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(PostAuthThrottlerGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get(StreamsController);
  });

  it('délègue la liste au service', async () => {
    const attendu = { streams: [] };
    streamsService.lister.mockResolvedValue(attendu);

    await expect(controller.lister()).resolves.toBe(attendu);
    expect(streamsService.lister).toHaveBeenCalledTimes(1);
  });
});

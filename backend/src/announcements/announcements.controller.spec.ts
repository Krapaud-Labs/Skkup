import {
  GUARDS_METADATA,
  PATH_METADATA,
  METHOD_METADATA,
} from '@nestjs/common/constants';
import { RequestMethod } from '@nestjs/common';
import { PostAuthThrottlerGuard } from '../common/throttler.guards';
import { ViewerGuard } from '../auth/guards/viewer.guard';
import { AnnouncementsController } from './announcements.controller';

describe('AnnouncementsController viewer endpoint', () => {
  it('expose GET /viewer/announcements avec garde VIEWER et limiteur post-auth', async () => {
    const handler = Object.getOwnPropertyDescriptor(
      AnnouncementsController.prototype,
      'annoncesViewer',
    )?.value as object;
    const guards = Reflect.getMetadata(GUARDS_METADATA, handler) as unknown[];
    const controller = new AnnouncementsController({
      publieesPourViewer: jest.fn().mockResolvedValue([]),
    } as never);

    expect(Reflect.getMetadata(PATH_METADATA, handler)).toBe(
      'viewer/announcements',
    );
    expect(Reflect.getMetadata(METHOD_METADATA, handler)).toBe(
      RequestMethod.GET,
    );
    expect(guards).toEqual([ViewerGuard, PostAuthThrottlerGuard]);
    await expect(controller.annoncesViewer()).resolves.toEqual([]);
  });
});

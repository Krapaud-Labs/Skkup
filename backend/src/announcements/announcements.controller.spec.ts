import {
  GUARDS_METADATA,
  PATH_METADATA,
  METHOD_METADATA,
} from '@nestjs/common/constants';
import { RequestMethod } from '@nestjs/common';
import { PostAuthThrottlerGuard } from '../common/throttler.guards';
import { AdminGuard } from '../auth/guards/admin.guard';
import { ViewerGuard } from '../auth/guards/viewer.guard';
import { AnnouncementsController } from './announcements.controller';

describe('AnnouncementsController viewer endpoint', () => {
  it('expose GET /viewer/announcements avec garde VIEWER et limiteur post-auth', async () => {
    const handler = Object.getOwnPropertyDescriptor(
      AnnouncementsController.prototype,
      'annoncesViewer',
    )?.value as object;
    const guards = Reflect.getMetadata(GUARDS_METADATA, handler) as unknown[];
    const publieesPourViewer = jest
      .fn()
      .mockResolvedValue({ items: [], nextCursor: null });
    const controller = new AnnouncementsController({
      publieesPourViewer,
    } as never);

    expect(Reflect.getMetadata(PATH_METADATA, handler)).toBe(
      'viewer/announcements',
    );
    expect(Reflect.getMetadata(METHOD_METADATA, handler)).toBe(
      RequestMethod.GET,
    );
    expect(guards).toEqual([ViewerGuard, PostAuthThrottlerGuard]);
    const curseur = 'opaque-cursor';
    await expect(controller.annoncesViewer(curseur)).resolves.toEqual({
      items: [],
      nextCursor: null,
    });
    expect(publieesPourViewer).toHaveBeenCalledWith(curseur);
  });

  it('expose une publication explicite protégée par le garde admin', async () => {
    const handler = Object.getOwnPropertyDescriptor(
      AnnouncementsController.prototype,
      'publier',
    )?.value as object;
    const guards = Reflect.getMetadata(GUARDS_METADATA, handler) as unknown[];
    const publier = jest.fn().mockResolvedValue({ status: 'PUBLISHED' });
    const controller = new AnnouncementsController({ publier } as never);

    expect(Reflect.getMetadata(PATH_METADATA, handler)).toBe(
      'admin/announcements/:id/publish',
    );
    expect(Reflect.getMetadata(METHOD_METADATA, handler)).toBe(
      RequestMethod.POST,
    );
    expect(guards).toEqual([AdminGuard, PostAuthThrottlerGuard]);
    await expect(
      controller.publier('a1', { user: { userId: 'admin-1' } } as never),
    ).resolves.toEqual({ status: 'PUBLISHED' });
    expect(publier).toHaveBeenCalledWith('a1', 'admin-1');
  });
});

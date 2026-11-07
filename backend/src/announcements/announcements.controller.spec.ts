import {
  GUARDS_METADATA,
  PATH_METADATA,
  METHOD_METADATA,
} from '@nestjs/common/constants';
import { RequestMethod } from '@nestjs/common';
import { PostAuthThrottlerGuard } from '../common/throttler.guards';
import { AdminGuard } from '../auth/guards/admin.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AnnouncementsController } from './announcements.controller';

describe('AnnouncementsController viewer endpoint', () => {
  it('expose GET /viewer/announcements aux sessions authentifiées avec limiteur post-auth', async () => {
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
    expect(guards).toEqual([JwtAuthGuard, PostAuthThrottlerGuard]);
    const curseur = 'opaque-cursor';
    await expect(controller.annoncesViewer(curseur)).resolves.toEqual({
      items: [],
      nextCursor: null,
    });
    expect(publieesPourViewer).toHaveBeenCalledWith(curseur);
  });

  it('expose le comptage authentifié avec uniquement les IDs de lecture envoyés', async () => {
    const handler = Object.getOwnPropertyDescriptor(
      AnnouncementsController.prototype,
      'compterAnnoncesNonLuesViewer',
    )?.value as object;
    const guards = Reflect.getMetadata(GUARDS_METADATA, handler) as unknown[];
    const compterNonLuesPourViewer = jest
      .fn()
      .mockResolvedValue({ publishedCount: 2, readPublishedCount: 1 });
    const controller = new AnnouncementsController({
      compterNonLuesPourViewer,
    } as never);
    const dto = { readIds: ['announcement-1'] };

    expect(Reflect.getMetadata(PATH_METADATA, handler)).toBe(
      'viewer/announcements/unread-count',
    );
    expect(Reflect.getMetadata(METHOD_METADATA, handler)).toBe(
      RequestMethod.POST,
    );
    expect(guards).toEqual([JwtAuthGuard, PostAuthThrottlerGuard]);
    await expect(controller.compterAnnoncesNonLuesViewer(dto)).resolves.toEqual(
      { publishedCount: 2, readPublishedCount: 1 },
    );
    expect(compterNonLuesPourViewer).toHaveBeenCalledWith(dto.readIds);
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

import { Test } from '@nestjs/testing';
import { ThrottlerModule } from '@nestjs/throttler';
import { MODULE_METADATA } from '@nestjs/common/constants';
import { AdminGuard } from '../auth/guards/admin.guard';
import { PostAuthThrottlerGuard } from '../common/throttler.guards';
import { ViewerGuard } from '../auth/guards/viewer.guard';
import { PrismaModule } from '../prisma/prisma.module';
import { AnnouncementsModule } from './announcements.module';

describe('AnnouncementsModule dependency resolution', () => {
  it('resolves every guard used by AnnouncementsController', async () => {
    const providers = Reflect.getMetadata(
      MODULE_METADATA.PROVIDERS,
      AnnouncementsModule,
    ) as unknown[];
    expect(providers).toEqual(
      expect.arrayContaining([
        AdminGuard,
        ViewerGuard,
        PostAuthThrottlerGuard,
      ]),
    );

    const testingModule = await Test.createTestingModule({
      imports: [
        PrismaModule,
        ThrottlerModule.forRoot([{ name: 'default', ttl: 60_000, limit: 120 }]),
        AnnouncementsModule,
      ],
    }).compile();

    expect(testingModule.get(AdminGuard)).toBeInstanceOf(AdminGuard);
    expect(testingModule.get(ViewerGuard)).toBeInstanceOf(ViewerGuard);
    expect(testingModule.get(PostAuthThrottlerGuard)).toBeInstanceOf(
      PostAuthThrottlerGuard,
    );

    await testingModule.close();
  });
});

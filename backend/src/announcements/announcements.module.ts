import { Module } from '@nestjs/common';
import { AdminGuard } from '../auth/guards/admin.guard';
import { ViewerGuard } from '../auth/guards/viewer.guard';
import { PostAuthThrottlerGuard } from '../common/throttler.guards';
import { AnnouncementsController } from './announcements.controller';
import { AnnouncementsService } from './announcements.service';

@Module({
  controllers: [AnnouncementsController],
  providers: [
    AnnouncementsService,
    AdminGuard,
    ViewerGuard,
    PostAuthThrottlerGuard,
  ],
})
export class AnnouncementsModule {}

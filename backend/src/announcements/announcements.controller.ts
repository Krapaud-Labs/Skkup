import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { AdminGuard } from '../auth/guards/admin.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AnnouncementsService } from './announcements.service';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { UpdateAnnouncementDto } from './dto/update-announcement.dto';
import { Throttle } from '@nestjs/throttler';
import { PostAuthThrottlerGuard } from '../common/throttler.guards';

type RequeteAuthentifiee = Request & { user?: { userId?: string } };

@Controller()
export class AnnouncementsController {
  constructor(private readonly announcements: AnnouncementsService) {}

  @Get('announcements/active')
  @UseGuards(PostAuthThrottlerGuard)
  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  actives() {
    return this.announcements.actives();
  }

  @Get('viewer/announcements')
  @UseGuards(JwtAuthGuard, PostAuthThrottlerGuard)
  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  annoncesViewer(@Query('cursor') cursor?: string) {
    return this.announcements.publieesPourViewer(cursor);
  }

  @Post('admin/announcements')
  @UseGuards(AdminGuard, PostAuthThrottlerGuard)
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  creer(
    @Body() dto: CreateAnnouncementDto,
    @Req() request: RequeteAuthentifiee,
  ) {
    return this.announcements.creer(dto, request.user!.userId!);
  }

  @Get('admin/announcements')
  @UseGuards(AdminGuard, PostAuthThrottlerGuard)
  listerAdmin() {
    return this.announcements.listerAdmin();
  }

  @Patch('admin/announcements/:id')
  @UseGuards(AdminGuard, PostAuthThrottlerGuard)
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  modifier(
    @Param('id') id: string,
    @Body() dto: UpdateAnnouncementDto,
    @Req() request: RequeteAuthentifiee,
  ) {
    return this.announcements.modifier(id, dto, request.user!.userId!);
  }

  @Post('admin/announcements/:id/publish')
  @UseGuards(AdminGuard, PostAuthThrottlerGuard)
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  publier(@Param('id') id: string, @Req() request: RequeteAuthentifiee) {
    return this.announcements.publier(id, request.user!.userId!);
  }

  @Get('admin/announcements/:id/history')
  @UseGuards(AdminGuard, PostAuthThrottlerGuard)
  historique(@Param('id') id: string) {
    return this.announcements.historique(id);
  }

  @Post('admin/announcements/:id/restore/:eventId')
  @UseGuards(AdminGuard, PostAuthThrottlerGuard)
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  restaurer(
    @Param('id') id: string,
    @Param('eventId') eventId: string,
    @Req() request: RequeteAuthentifiee,
  ) {
    return this.announcements.restaurer(id, eventId, request.user!.userId!);
  }

  @Delete('admin/announcements/:id')
  @UseGuards(AdminGuard, PostAuthThrottlerGuard)
  supprimer(@Param('id') id: string, @Req() request: RequeteAuthentifiee) {
    return this.announcements.supprimer(id, request.user!.userId!);
  }
}

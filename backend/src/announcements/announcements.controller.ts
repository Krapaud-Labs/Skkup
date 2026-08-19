import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { AdminGuard } from '../auth/guards/admin.guard';
import { AnnouncementsService } from './announcements.service';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { UpdateAnnouncementDto } from './dto/update-announcement.dto';

type RequeteAuthentifiee = Request & { user?: { userId?: string } };

@Controller()
export class AnnouncementsController {
  constructor(private readonly announcements: AnnouncementsService) {}

  @Get('announcements/active')
  actives() {
    return this.announcements.actives();
  }

  @Post('admin/announcements')
  @UseGuards(AdminGuard)
  creer(
    @Body() dto: CreateAnnouncementDto,
    @Req() request: RequeteAuthentifiee,
  ) {
    return this.announcements.creer(dto, request.user!.userId!);
  }

  @Patch('admin/announcements/:id')
  @UseGuards(AdminGuard)
  modifier(@Param('id') id: string, @Body() dto: UpdateAnnouncementDto) {
    return this.announcements.modifier(id, dto);
  }
}

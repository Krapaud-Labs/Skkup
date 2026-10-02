import {
  Body,
  Controller,
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
import { PostAuthThrottlerGuard } from '../common/throttler.guards';
import { Throttle } from '@nestjs/throttler';
import { ContentService } from './content.service';
import {
  ContentQueryDto,
  CreateContentDto,
  UpdateContentDto,
} from './dto/content.dto';
import { ManagedContentType } from '../../generated/prisma/enums';

type AuthenticatedRequest = Request & { user?: { userId?: string } };

@Controller('content')
export class ContentController {
  constructor(private readonly content: ContentService) {}

  @Get(':type/:slug')
  public(
    @Param('type') type: ManagedContentType,
    @Param('slug') slug: string,
    @Query('locale') locale = 'fr',
  ) {
    return this.content.publier(slug, type, locale);
  }
}

@Controller('admin/content')
@UseGuards(AdminGuard, PostAuthThrottlerGuard)
@Throttle({ default: { limit: 60, ttl: 60_000 } })
export class AdminContentController {
  constructor(private readonly content: ContentService) {}

  @Get()
  lister(@Query() query: ContentQueryDto) {
    return this.content.lister(query.type, query.locale);
  }

  @Get('audit')
  audit() {
    return this.content.audit();
  }

  @Post()
  creer(@Body() dto: CreateContentDto, @Req() request: AuthenticatedRequest) {
    return this.content.creer(dto, request.user!.userId!);
  }

  @Patch(':id')
  modifier(
    @Param('id') id: string,
    @Body() dto: UpdateContentDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.content.modifier(id, dto, request.user!.userId!);
  }

  @Post(':id/publish')
  publier(@Param('id') id: string, @Req() request: AuthenticatedRequest) {
    return this.content.publierVersion(id, request.user!.userId!);
  }

  @Post(':id/unpublish')
  depublier(@Param('id') id: string, @Req() request: AuthenticatedRequest) {
    return this.content.depublier(id, request.user!.userId!);
  }

  @Get(':id/versions')
  versions(@Param('id') id: string) {
    return this.content.versions(id);
  }

  @Post(':id/restore/:versionId')
  restaurer(
    @Param('id') id: string,
    @Param('versionId') versionId: string,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.content.restaurer(id, versionId, request.user!.userId!);
  }
}

import {
  Controller,
  Get,
  Param,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { PostAuthThrottlerGuard } from '../common/throttler.guards';
import { ViewerGuard } from '../auth/guards/viewer.guard';
import { ShopService } from './shop.service';

type RequeteViewer = Request & { user: { userId: string } };

@Controller('me/shop/purchases')
@UseGuards(ViewerGuard, PostAuthThrottlerGuard)
@Throttle({ default: { limit: 60, ttl: 60_000 } })
export class MeShopController {
  constructor(private readonly shop: ShopService) {}

  @Get()
  lister(
    @Req() req: RequeteViewer,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.shop.mesAchats(req.user.userId, page, limit);
  }

  @Get(':id/code')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  async code(
    @Req() req: RequeteViewer,
    @Param('id') id: string,
    @Res({ passthrough: true }) response: Response,
  ) {
    response.set({
      'Cache-Control': 'no-store, no-cache, must-revalidate, private',
      Pragma: 'no-cache',
      Expires: '0',
    });
    return this.shop.revelerCode(req.user.userId, id);
  }
}

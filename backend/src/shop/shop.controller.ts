import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Request } from 'express';
import { PostAuthThrottlerGuard } from '../common/throttler.guards';
import { ViewerGuard } from '../auth/guards/viewer.guard';
import { PurchaseShopItemDto } from './dto/purchase-shop-item.dto';
import { ShopService } from './shop.service';

type RequeteViewer = Request & { user: { userId: string } };

@Controller('shop')
@UseGuards(ViewerGuard, PostAuthThrottlerGuard)
@Throttle({ default: { limit: 60, ttl: 60_000 } })
export class ShopController {
  constructor(private readonly shop: ShopService) {}

  @Get('items')
  items(
    @Req() req: RequeteViewer,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.shop.listerCatalogue(req.user.userId, page, limit);
  }

  @Post('purchase')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  acheter(@Req() req: RequeteViewer, @Body() dto: PurchaseShopItemDto) {
    return this.shop.acheter(req.user.userId, dto.itemId, dto.idempotencyKey);
  }
}

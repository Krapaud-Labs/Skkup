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
import { Throttle } from '@nestjs/throttler';
import type { Request } from 'express';
import { AdminGuard } from '../auth/guards/admin.guard';
import { PostAuthThrottlerGuard } from '../common/throttler.guards';
import { CreateShopItemDto } from './dto/create-shop-item.dto';
import { ImportShopCodesDto } from './dto/import-shop-codes.dto';
import { UpdateShopItemDto } from './dto/update-shop-item.dto';
import { ShopService } from './shop.service';

type RequeteAdmin = Request & { user: { userId: string } };

@Controller('admin/shop')
@UseGuards(AdminGuard, PostAuthThrottlerGuard)
@Throttle({ default: { limit: 60, ttl: 60_000 } })
export class AdminShopController {
  constructor(private readonly shop: ShopService) {}

  @Get('items')
  items(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.shop.listerArticlesAdmin(page, limit);
  }

  @Post('items')
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  creer(@Body() dto: CreateShopItemDto, @Req() req: RequeteAdmin) {
    return this.shop.creerArticle(dto, req.user.userId);
  }

  @Patch('items/:id')
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  modifier(
    @Param('id') id: string,
    @Body() dto: UpdateShopItemDto,
    @Req() req: RequeteAdmin,
  ) {
    return this.shop.modifierArticle(id, dto, req.user.userId);
  }

  @Delete('items/:id')
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  supprimer(@Param('id') id: string, @Req() req: RequeteAdmin) {
    return this.shop.desactiverArticle(id, req.user.userId);
  }

  @Post('items/:id/codes')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  importerCodes(
    @Param('id') id: string,
    @Body() dto: ImportShopCodesDto,
    @Req() req: RequeteAdmin,
  ) {
    return this.shop.importerCodes(id, dto, req.user.userId);
  }

  @Get('purchases')
  achats(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.shop.listerAchatsAdmin(page, limit);
  }
}

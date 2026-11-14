import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AdminGuard } from '../auth/guards/admin.guard';
import { ViewerGuard } from '../auth/guards/viewer.guard';
import { AdminShopController } from './admin-shop.controller';
import { MeShopController } from './me-shop.controller';
import { ShopController } from './shop.controller';
import { ShopService } from './shop.service';

@Module({
  imports: [AuthModule],
  controllers: [ShopController, MeShopController, AdminShopController],
  providers: [ShopService, ViewerGuard, AdminGuard],
})
export class ShopModule {}

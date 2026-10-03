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
import { AdminLotsService } from './admin-lots.service';
import { CreateAdminLotDto } from './dto/create-admin-lot.dto';
import { UpdateAdminLotDto } from './dto/update-admin-lot.dto';

@Controller('admin/lots')
@UseGuards(AdminGuard)
export class AdminLotsController {
  constructor(private readonly lots: AdminLotsService) {}
  @Get() lister(@Query('search') search?: string) {
    return this.lots.lister(search);
  }
  @Get(':id') detail(@Param('id') id: string) {
    return this.lots.detail(id);
  }
  @Post() creer(@Body() dto: CreateAdminLotDto, @Req() req: Request) {
    return this.lots.creer(dto, (req.user as { userId: string }).userId);
  }
  @Patch(':id') modifier(
    @Param('id') id: string,
    @Body() dto: UpdateAdminLotDto,
    @Req() req: Request,
  ) {
    return this.lots.modifier(id, dto, (req.user as { userId: string }).userId);
  }
  @Delete(':id') supprimer(@Param('id') id: string, @Req() req: Request) {
    return this.lots.supprimer(id, (req.user as { userId: string }).userId);
  }
}

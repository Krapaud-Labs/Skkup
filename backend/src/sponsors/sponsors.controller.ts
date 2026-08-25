import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AdminGuard } from '../auth/guards/admin.guard';
import { CreateSponsorDto } from './dto/create-sponsor.dto';
import { UpdateSponsorDto } from './dto/update-sponsor.dto';
import { SponsorsService } from './sponsors.service';
import { Throttle } from '@nestjs/throttler';
import { PostAuthThrottlerGuard } from '../common/throttler.guards';

@Controller('admin/sponsors')
@UseGuards(AdminGuard, PostAuthThrottlerGuard)
@Throttle({ default: { limit: 60, ttl: 60_000 } })
export class SponsorsController {
  constructor(private readonly sponsors: SponsorsService) {}

  @Get()
  lister() {
    return this.sponsors.lister();
  }

  @Post()
  creer(@Body() dto: CreateSponsorDto) {
    return this.sponsors.creer(dto);
  }

  @Patch(':id')
  modifier(@Param('id') id: string, @Body() dto: UpdateSponsorDto) {
    return this.sponsors.modifier(id, dto);
  }
}

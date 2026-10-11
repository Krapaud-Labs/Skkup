import {
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
  Body,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { AdminGuard } from '../auth/guards/admin.guard';
import { FraudFlagStatus } from '../../generated/prisma/enums';
import { UpdateFraudFlagDto } from './dto/update-fraud-flag.dto';
import { FraudFlagsService } from './fraud-flags.service';
import { Throttle } from '@nestjs/throttler';
import { PostAuthThrottlerGuard } from '../common/throttler.guards';

@Controller('admin/fraud/flags')
@UseGuards(AdminGuard, PostAuthThrottlerGuard)
@Throttle({ default: { limit: 60, ttl: 60_000 } })
export class FraudFlagsController {
  constructor(private readonly flags: FraudFlagsService) {}

  @Get()
  lister(@Query('statut') statut?: FraudFlagStatus) {
    return this.flags.lister(statut);
  }

  @Get(':id')
  detail(@Param('id') id: string) {
    return this.flags.detail(id);
  }

  @Patch(':id')
  modifier(
    @Param('id') id: string,
    @Body() dto: UpdateFraudFlagDto,
    @Req() req: Request,
  ) {
    return this.flags.modifier(
      id,
      dto,
      (req.user as { userId: string }).userId,
    );
  }
}

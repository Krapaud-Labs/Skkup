import {
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
  Body,
} from '@nestjs/common';
import { AdminGuard } from '../auth/guards/admin.guard';
import { FraudFlagStatus } from '../../generated/prisma/enums';
import { UpdateFraudFlagDto } from './dto/update-fraud-flag.dto';
import { FraudFlagsService } from './fraud-flags.service';

@Controller('admin/fraud/flags')
@UseGuards(AdminGuard)
export class FraudFlagsController {
  constructor(private readonly flags: FraudFlagsService) {}

  @Get()
  lister(@Query('statut') statut?: FraudFlagStatus) {
    return this.flags.lister(statut);
  }

  @Patch(':id')
  modifier(@Param('id') id: string, @Body() dto: UpdateFraudFlagDto) {
    return this.flags.modifier(id, dto);
  }
}

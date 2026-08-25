import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { AdminGuard } from '../auth/guards/admin.guard';
import { UpdateStreamRewardDto } from './dto/update-stream-reward.dto';
import { StreamsService } from './streams.service';
import { Throttle } from '@nestjs/throttler';
import { PostAuthThrottlerGuard } from '../common/throttler.guards';

// Endpoint public : la page vitrine doit pouvoir afficher les chaînes
// proposées sans compte, comme la liste des tirages.
@Controller('streams')
export class StreamsController {
  constructor(private readonly streamsService: StreamsService) {}

  @Get()
  @UseGuards(PostAuthThrottlerGuard)
  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  lister() {
    return this.streamsService.lister();
  }

  @Patch('admin/:id/reward')
  @UseGuards(AdminGuard, PostAuthThrottlerGuard)
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  mettreAJourRecompense(
    @Param('id') id: string,
    @Body() dto: UpdateStreamRewardDto,
  ) {
    return this.streamsService.mettreAJourRecompense(id, dto);
  }
}

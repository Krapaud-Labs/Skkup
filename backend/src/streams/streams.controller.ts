import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { AdminGuard } from '../auth/guards/admin.guard';
import { UpdateStreamRewardDto } from './dto/update-stream-reward.dto';
import { StreamsService } from './streams.service';

// Endpoint public : la page vitrine doit pouvoir afficher les chaînes
// proposées sans compte, comme la liste des tirages.
@Controller('streams')
export class StreamsController {
  constructor(private readonly streamsService: StreamsService) {}

  @Get()
  lister() {
    return this.streamsService.lister();
  }

  @Patch('admin/:id/reward')
  @UseGuards(AdminGuard)
  mettreAJourRecompense(
    @Param('id') id: string,
    @Body() dto: UpdateStreamRewardDto,
  ) {
    return this.streamsService.mettreAJourRecompense(id, dto);
  }
}

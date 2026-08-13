import { Controller, Get } from '@nestjs/common';
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
}

import { Module } from '@nestjs/common';
import { AdminLotsController } from './admin-lots.controller';
import { AdminLotsService } from './admin-lots.service';

@Module({ controllers: [AdminLotsController], providers: [AdminLotsService] })
export class AdminLotsModule {}

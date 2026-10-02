import { Module } from '@nestjs/common';
import {
  ContentController,
  AdminContentController,
} from './content.controller';
import { ContentService } from './content.service';

@Module({
  controllers: [ContentController, AdminContentController],
  providers: [ContentService],
})
export class ContentModule {}

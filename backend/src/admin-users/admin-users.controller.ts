import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { AdminGuard } from '../auth/guards/admin.guard';
import { AdminUsersService } from './admin-users.service';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';

@Controller('admin/users')
@UseGuards(AdminGuard)
export class AdminUsersController {
  constructor(private readonly users: AdminUsersService) {}
  @Get() lister(@Query('search') search?: string) {
    return this.users.lister(search);
  }
  @Get(':id') detail(@Param('id') id: string) {
    return this.users.detail(id);
  }
  @Get(':id/audit') historique(@Param('id') id: string) {
    return this.users.historique(id);
  }
  @Patch(':id/status') modifierStatut(
    @Param('id') id: string,
    @Body() dto: UpdateUserStatusDto,
    @Req() req: Request,
  ) {
    return this.users.modifierStatut(
      id,
      dto,
      (req.user as { userId: string }).userId,
    );
  }
}

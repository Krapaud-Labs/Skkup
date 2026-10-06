import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service';

/** Contrôleur racine, garde de vie du scaffold NestJS (endpoint `GET /`). */

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  getHealth(): { status: string } {
    return { status: 'ok' };
  }

  @Get('public/stats')
  async getPublicStats(): Promise<{ nombreUtilisateursInscrits: number }> {
    return { nombreUtilisateursInscrits: await this.prisma.user.count() };
  }
}

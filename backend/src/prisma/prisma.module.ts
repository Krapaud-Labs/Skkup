import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

// Module global : PrismaService est disponible partout dans
// l'application sans avoir à importer PrismaModule dans chaque module
// métier.
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}

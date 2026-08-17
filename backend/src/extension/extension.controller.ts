import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ExtensionService } from './extension.service';
import { PairDto } from './dto/pair.dto';

interface RequeteAuthentifiee extends Request {
  user: { userId: string; email: string };
}

/**
 * Appariement de l'extension navigateur.
 *
 * Les deux routes n'ont pas le même modèle d'authentification et c'est
 * volontaire : la génération du code exige la session web (cookie), le
 * seul contexte où l'identité de l'utilisateur est déjà prouvée ;
 * l'échange, lui, vient de l'extension, qui n'a pas ce cookie, et
 * s'authentifie donc uniquement par la connaissance du code.
 */
@Controller('extension')
export class ExtensionController {
  constructor(private readonly extensionService: ExtensionService) {}

  /**
   * Un utilisateur légitime ne génère un code que quelques fois par an :
   * la limite basse ne le gêne pas et empêche de remplir la table de
   * codes en attente depuis un compte volé.
   */
  @Post('pairing-token')
  @UseGuards(JwtAuthGuard, ThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: 60 * 60_000 } })
  @HttpCode(HttpStatus.CREATED)
  genererCode(@Req() req: RequeteAuthentifiee) {
    return this.extensionService.genererCode(req.user.userId);
  }

  /**
   * Route non authentifiée : le code est le seul secret présenté. Elle
   * est donc la seule surface de force brute de l'appariement, d'où une
   * limite stricte par IP (le tracker par défaut retombe sur l'IP quand
   * aucun utilisateur n'est authentifié). Avec 60 bits d'entropie et
   * 10 essais par heure, une devinette reste hors de portée.
   */
  @Post('pair')
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 10, ttl: 60 * 60_000 } })
  @HttpCode(HttpStatus.OK)
  apparier(@Body() dto: PairDto) {
    return this.extensionService.apparier(dto);
  }
}

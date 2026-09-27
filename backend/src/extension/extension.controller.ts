import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { Throttle } from '@nestjs/throttler';
import { PostAuthThrottlerGuard } from '../common/throttler.guards';
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
  @UseGuards(JwtAuthGuard, PostAuthThrottlerGuard)
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
  @UseGuards(PostAuthThrottlerGuard)
  @Throttle({ default: { limit: 10, ttl: 60 * 60_000 } })
  @HttpCode(HttpStatus.OK)
  apparier(@Body() dto: PairDto) {
    return this.extensionService.apparier(dto);
  }

  /** Liste les appareils appariés au compte authentifié, pour le tableau de bord. */
  @Get('pairings')
  @UseGuards(JwtAuthGuard, PostAuthThrottlerGuard)
  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  listerAppareils(@Req() req: RequeteAuthentifiee) {
    return this.extensionService.listerAppareils(req.user.userId);
  }

  /**
   * Désappariement à la demande de l'utilisateur : coupe l'accès d'un
   * appareil avant l'échéance de 30 jours, notamment en cas de perte ou
   * de vol de l'appareil (voir le contexte sécurité agentic).
   *
   * La limite de débit borne le sondage d'identifiants : la réponse
   * distingue `404` (inconnu) de `403` (appartient à un autre compte),
   * ce qui reste sans portée face à des identifiants cuid, mais ne doit
   * pas devenir un oracle interrogeable en masse.
   */
  @Delete('pairings/:id')
  @UseGuards(JwtAuthGuard, PostAuthThrottlerGuard)
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @HttpCode(HttpStatus.NO_CONTENT)
  async revoquer(@Req() req: RequeteAuthentifiee, @Param('id') id: string) {
    await this.extensionService.revoquer(req.user.userId, id);
  }
}

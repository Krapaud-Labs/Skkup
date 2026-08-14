import { IsEnum, IsString } from 'class-validator';
import { Platform } from '../../../generated/prisma/enums';

/** Payload de POST /watch-sessions (ouverture d'une session de visionnage). */
export class OuvrirSessionDto {
  @IsEnum(Platform)
  platform!: Platform;

  @IsString()
  streamExternalId!: string;
}

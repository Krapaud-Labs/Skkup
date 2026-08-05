import { IsEnum, IsString } from 'class-validator';
import { Platform, WatchSessionSource } from '../../../generated/prisma/enums';

export class OuvrirSessionDto {
  @IsEnum(Platform)
  platform!: Platform;

  @IsString()
  streamExternalId!: string;

  @IsEnum(WatchSessionSource)
  source!: WatchSessionSource;
}

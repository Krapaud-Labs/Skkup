import {
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ManagedContentType } from '../../../generated/prisma/enums';

export class CreateContentDto {
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  slug!: string;

  @IsEnum(ManagedContentType)
  type!: ManagedContentType;

  @IsString()
  @Matches(/^(fr|en)$/)
  locale!: string;

  @IsObject()
  data!: Record<string, unknown>;
}

export class UpdateContentDto {
  @IsObject()
  data!: Record<string, unknown>;
}

export class RestoreContentDto {
  @IsString()
  version!: string;
}

export class ContentQueryDto {
  @IsOptional()
  @IsEnum(ManagedContentType)
  type?: ManagedContentType;

  @IsOptional()
  @Matches(/^(fr|en)$/)
  locale?: string;
}

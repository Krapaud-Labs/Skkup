import {
  IsBoolean,
  IsISO8601,
  IsOptional,
  IsString,
  Length,
} from 'class-validator';

export class UpdateAnnouncementDto {
  @IsOptional()
  @IsString()
  @Length(1, 160)
  titre?: string;

  @IsOptional()
  @IsString()
  @Length(1, 2000)
  texte?: string;

  @IsOptional()
  @IsBoolean()
  actif?: boolean;

  @IsOptional()
  @IsISO8601()
  debutAt?: string;

  @IsOptional()
  @IsISO8601()
  finAt?: string;
}

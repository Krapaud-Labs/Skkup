import {
  IsBoolean,
  IsOptional,
  IsString,
  IsUrl,
  Length,
} from 'class-validator';

export class UpdateSponsorDto {
  @IsOptional()
  @IsString()
  @Length(1, 160)
  nom?: string;

  @IsOptional()
  @IsUrl({ protocols: ['https'], require_protocol: true })
  logoUrl?: string;

  @IsOptional()
  @IsBoolean()
  actif?: boolean;
}

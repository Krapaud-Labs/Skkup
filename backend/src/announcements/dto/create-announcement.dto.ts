import { IsISO8601, IsOptional, IsString, Length } from 'class-validator';

export class CreateAnnouncementDto {
  @IsString()
  @Length(1, 160)
  titre!: string;

  @IsString()
  @Length(1, 2000)
  texte!: string;

  @IsOptional()
  @IsISO8601()
  debutAt?: string;

  @IsOptional()
  @IsISO8601()
  finAt?: string;
}

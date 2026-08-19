import { IsOptional, IsString, IsUrl, Length } from 'class-validator';

export class CreateSponsorDto {
  @IsString()
  @Length(1, 160)
  nom!: string;

  @IsOptional()
  @IsUrl({ protocols: ['https'], require_protocol: true })
  logoUrl?: string;
}

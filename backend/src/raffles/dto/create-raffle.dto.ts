import { Type } from 'class-transformer';
import {
  IsArray,
  IsISO8601,
  IsInt,
  IsString,
  IsOptional,
  IsUrl,
  Length,
  Min,
  ValidateNested,
} from 'class-validator';

export class CreateRaffleLotDto {
  @IsString()
  @Length(1, 160)
  nom!: string;

  @IsString()
  @Length(1, 32)
  valeurEstimee!: string;

  @IsInt()
  @Min(1)
  quantite!: number;

  @IsString()
  @Length(1, 160)
  fournisseur!: string;

  @IsOptional()
  @IsString()
  sponsorId?: string;

  @IsOptional()
  @IsUrl({ protocols: ['https'], require_protocol: true })
  @Length(1, 2048)
  imageUrl?: string;
}

export class CreateRaffleDto {
  @IsString()
  @Length(1, 160)
  titre!: string;

  @IsString()
  @Length(1, 2000)
  description!: string;

  @IsISO8601()
  dateOuverture!: string;

  @IsISO8601()
  dateTirage!: string;

  /** SHA-256 hex de la graine secrète conservée par l'opérateur. */
  @IsString()
  @Length(64, 64)
  engagementGraine!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateRaffleLotDto)
  lots!: CreateRaffleLotDto[];
}

export class DrawRaffleDto {
  @IsString()
  @Length(1, 512)
  graineExploitant!: string;

  @IsString()
  @Length(1, 512)
  entropiePublique!: string;
}

export class UpdateRaffleDto {
  @IsOptional()
  @IsString()
  @Length(1, 160)
  titre?: string;

  @IsOptional()
  @IsString()
  @Length(1, 2000)
  description?: string;

  @IsOptional()
  @IsISO8601()
  dateTirage?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateRaffleLotDto)
  lots?: CreateRaffleLotDto[];
}

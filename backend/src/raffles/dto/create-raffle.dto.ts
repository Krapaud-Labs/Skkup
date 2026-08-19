import { Type } from 'class-transformer';
import {
  IsArray,
  IsISO8601,
  IsInt,
  IsString,
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

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateRaffleLotDto)
  lots!: CreateRaffleLotDto[];
}

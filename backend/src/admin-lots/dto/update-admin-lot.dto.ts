import {
  IsDecimal,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Min,
} from 'class-validator';

export class UpdateAdminLotDto {
  @IsOptional()
  @IsString()
  @Length(1, 160)
  nom?: string;

  @IsOptional()
  @IsDecimal()
  valeurEstimee?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  quantite?: number;

  @IsOptional()
  @IsString()
  @Length(1, 160)
  fournisseur?: string;

  @IsOptional()
  @IsString()
  @Length(1, 120)
  sponsorId?: string;
}

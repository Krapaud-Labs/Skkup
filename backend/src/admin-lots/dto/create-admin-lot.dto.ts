import {
  IsInt,
  IsOptional,
  IsUrl,
  IsString,
  IsDecimal,
  Length,
  Min,
} from 'class-validator';

export class CreateAdminLotDto {
  @IsString()
  @Length(1, 120)
  raffleId!: string;

  @IsString()
  @Length(1, 160)
  nom!: string;

  @IsDecimal()
  valeurEstimee!: string;

  @IsInt()
  @Min(1)
  quantite!: number;

  @IsString()
  @Length(1, 160)
  fournisseur!: string;

  @IsOptional()
  @IsString()
  @Length(1, 120)
  sponsorId?: string;

  @IsOptional()
  @IsUrl({ protocols: ['https'], require_protocol: true })
  @Length(1, 2048)
  imageUrl?: string;
}

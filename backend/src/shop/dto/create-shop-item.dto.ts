import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Length,
  Min,
} from 'class-validator';
import { ShopItemType } from '../../../generated/prisma/enums';

export class CreateShopItemDto {
  @IsEnum(ShopItemType)
  type!: ShopItemType;

  @IsString()
  @Length(1, 160)
  nom!: string;

  @IsOptional()
  @IsString()
  @Length(0, 2000)
  description?: string;

  @IsOptional()
  @IsUrl({ protocols: ['https'], require_protocol: true })
  @Length(1, 2048)
  imageUrl?: string;

  @IsInt()
  @Min(1)
  costPoints!: number;

  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  maxPerUser?: number | null;

  @IsOptional()
  @IsString()
  @Length(1, 120)
  raffleId?: string | null;
}

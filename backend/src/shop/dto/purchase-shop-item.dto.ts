import { IsString, Length } from 'class-validator';

export class PurchaseShopItemDto {
  @IsString()
  @Length(1, 120)
  itemId!: string;

  @IsString()
  @Length(16, 128)
  idempotencyKey!: string;
}

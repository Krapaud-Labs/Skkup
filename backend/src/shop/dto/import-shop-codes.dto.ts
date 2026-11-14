import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsString,
  Length,
} from 'class-validator';

export class ImportShopCodesDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(500)
  @IsString({ each: true })
  @Length(1, 256, { each: true })
  codes!: string[];
}

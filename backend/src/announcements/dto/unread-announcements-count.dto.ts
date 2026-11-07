import {
  ArrayMaxSize,
  ArrayUnique,
  IsArray,
  IsString,
  Length,
} from 'class-validator';

export class UnreadAnnouncementsCountDto {
  @IsArray()
  @ArrayMaxSize(1000)
  @ArrayUnique()
  @IsString({ each: true })
  @Length(1, 64, { each: true })
  readIds!: string[];
}

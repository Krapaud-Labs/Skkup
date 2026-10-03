import { IsBoolean } from 'class-validator';

export class UpdateUserStatusDto {
  @IsBoolean()
  actif!: boolean;
}

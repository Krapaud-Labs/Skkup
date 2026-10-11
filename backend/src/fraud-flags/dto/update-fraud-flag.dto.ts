import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { FraudFlagStatus } from '../../../generated/prisma/enums';

export class UpdateFraudFlagDto {
  @IsEnum(FraudFlagStatus)
  statut!: FraudFlagStatus;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  note?: string;
}

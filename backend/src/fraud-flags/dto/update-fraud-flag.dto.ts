import { IsEnum } from 'class-validator';
import { FraudFlagStatus } from '../../../generated/prisma/enums';

export class UpdateFraudFlagDto {
  @IsEnum(FraudFlagStatus)
  statut!: FraudFlagStatus;
}
